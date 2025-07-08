import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Invitation, InvitationStatus } from './schemas/invitation.schema';
import { InvitationStatusDto } from './dto/invitationStatus.dto';
import { CreateInvitationDto } from './dto/invitation.dto';
import { UsersService } from 'src/users/users.service';
import { GraphService } from 'src/graph/graph.service';
import { Slot } from 'src/slots/schemas/slot.schema';
import { SlotsService } from 'src/slots/slots.service';

@Injectable()
export class InvitationsService {
  private getStartOfDay(): Date {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }

  constructor(
    @InjectModel(Invitation.name) private invitationModel: Model<Invitation>,
    @InjectModel(Slot.name) private slotModel: Model<Slot>,

    private readonly usersService: UsersService,
    private readonly graphService: GraphService,
    


  ) {}

  private getTodayFilter() {
    return { sentAt: { $gte: this.getStartOfDay() } };
  }

  async getAllInvitations(): Promise<Invitation[]> {
    return this.invitationModel.find(this.getTodayFilter()).exec();
  }

  async createOrUpdateInvitations(invitations: Invitation[]): Promise<Invitation[]> {
    const operations = invitations.map(invitation => ({
      updateOne: {
        filter: { invitationId: invitation.invitationId },
        update: { $set: invitation },
        upsert: true
      }
    }));

    await this.invitationModel.bulkWrite(operations);

    return this.invitationModel.find({
      invitationId: { $in: invitations.map(i => i.invitationId) },
      ...this.getTodayFilter()
    }).exec();
  }

  async getAllInvitationsByRecipientEmail(email: string): Promise<Invitation[]> {
    return this.invitationModel.find({
      recipientEmail: email,
      ...this.getTodayFilter()
    }).exec();
  }

  async getAllInvitationsBySlotId(slotId: string): Promise<Invitation[]> {
    return this.invitationModel.find({
      slotId: slotId,
      ...this.getTodayFilter()
    }).exec();
  }

  async getInvitationByInvitationId(invitationId: string): Promise<Invitation | null> {
    return this.invitationModel.findOne({
      invitationId: invitationId,
      ...this.getTodayFilter()
    }).exec();
  }

  async getInvitationBySlotIdAndRecipientEmail(slotId: string, email: string): Promise<Invitation|null> {
    return this.invitationModel.findOne({
      slotId: slotId,
      recipientEmail: email,
      //invitationStatus: 'pending' as InvitationStatus,
      ...this.getTodayFilter()
    }).exec();
  }

  async updateInvitationStatus(statusDto: InvitationStatusDto): Promise<Invitation[]> {
    const { recipientEmails, slotId, invitationStatus, isActive } = statusDto;
    const result = await this.invitationModel.updateMany(
      {
        slotId: slotId,
        recipientEmail: { $in: recipientEmails },
        isActive: true, 
        ...this.getTodayFilter()
      },
      {
        $set: { 
          invitationStatus: invitationStatus,
          isActive: isActive,
          respondedAt: new Date() 
        }
      }
    ).exec();

    return this.invitationModel.find({
      slotId: slotId,
      recipientEmail: { $in: recipientEmails },
      ...this.getTodayFilter()
    }).exec();
  }



  async createInvitations(createInvitationDtos: CreateInvitationDto[], senderEmail: string): Promise<Invitation[]> {
  if (createInvitationDtos.length === 0) {
    return [];
  }
  
  // const slotId = createInvitationDtos[0].slotId;

 
  //  const slot =  await this.slotsService.getSlotBySlotId(slotId);
  
  // if (!slot) {
  //   throw new Error(`Slot with ID ${slotId} not found`);
  // }


  const sentAt = new Date();
  const expiresAt = new Date(sentAt.getTime() + 5 * 60 * 1000); //
  const invitationsToCreate = createInvitationDtos.map(dto => ({
    invitationId: uuidv4(),
    slotId: dto.slotId,
    recipientEmail: dto.recipientEmail,
    senderEmail: senderEmail,
    invitationStatus: 'pending' as InvitationStatus,
    sentAt: sentAt,
    expiresAt: expiresAt,
    isActive: true,
  }));

  const createdInvitations = await this.invitationModel.insertMany(invitationsToCreate);

  // Send notifications to each recipient
  try {
    const senderUser = await this.usersService.validateUserByEmail(senderEmail);
    if (senderUser.microsoftAccessToken) {
      const message = `You've been invited to join a game session by ${senderEmail}`;
        // Slot Details:
        // - Game ID: ${slot.gameId}
        // - Start Time: ${slot.startTime}
        // - End Time: ${slot.endTime}
        // Please respond to the invitation.`;

      for (const dto of createInvitationDtos) {
        try {
          const recipient = await this.usersService.validateUserByEmail(dto.recipientEmail);
          if (recipient?.microsoftAccessToken) {
            const senderId = await this.graphService.getUserIdByEmail(
              senderUser.microsoftAccessToken, 
              senderUser.email
            );
            const chatId = await this.graphService.getOrCreateChat(
              senderUser.microsoftAccessToken, 
              senderId, 
              dto.recipientEmail,
              recipient.microsoftAccessToken
            );
            await this.graphService.sendMessage(
              senderUser.microsoftAccessToken, 
              chatId, 
              message
            );
          }
        } catch (error) {
          // Log error but don't fail the whole operation
          console.error(`Failed to send notification to ${dto.recipientEmail}:`, error);
        }
      }
    }
  } catch (error) {
    // Log error but don't fail the whole operation
    console.error('Error while sending notifications:', error);
  }

  return createdInvitations;
}
}