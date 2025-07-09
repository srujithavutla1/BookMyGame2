import { forwardRef, Inject, Injectable } from '@nestjs/common';
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
    @Inject(forwardRef(() => SlotsService))
    private readonly slotsService: SlotsService,



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
    
    const slotId = createInvitationDtos[0].slotId;
    const slot = await this.slotsService.getSlotBySlotId(slotId);
    
    if (!slot) {
      throw new Error(`Slot with ID ${slotId} not found`);
    }

    const invitationsToCreate = createInvitationDtos.map(dto => ({
      invitationId: uuidv4(),
      slotId: dto.slotId,
      recipientEmail: dto.recipientEmail,
      senderEmail: senderEmail,
      invitationStatus: 'pending' as InvitationStatus,
      sentAt: slot.createdAt,
      expiresAt: slot.expiresAt,
      isActive: true,
    }));

    const createdInvitations = await this.invitationModel.insertMany(invitationsToCreate);

    // Send notifications to each recipient
    try {
      const senderUser = await this.usersService.validateUserByEmail(senderEmail);
      if (senderUser.microsoftAccessToken) {
    
        



        for (const dto of invitationsToCreate) {
          const message = {
        contentType: 'html',
        content: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <h2 style="color: #464775; margin-bottom: 16px;">🎉 Invitation to Join a Chess Game Session! 🎉</h2>
            <p style="margin-bottom: 16px;">
              You've been invited to join a game session by <strong>${senderEmail}</strong>.
            </p>
            <div style="background-color: #f3f2f1; padding: 12px; border-radius: 4px; margin-bottom: 16px;">
              <h3 style="color: #464775; margin-top: 0; margin-bottom: 8px;">Slot Details:</h3>
              <ul style="margin-top: 0; padding-left: 20px;">
                <li><strong>Game ID:</strong> ${slot.gameId}</li>
                <li><strong>Start Time:</strong> ${slot.startTime}</li>
                <li><strong>End Time:</strong> ${slot.endTime}</li>
              </ul>
            </div>
            <p style="margin-bottom: 16px;">
              Please respond to the invitation to confirm your participation!
            </p>
            <a 
              href="${process.env.FRONTEND_URL}/invitations?invitationId=${dto.invitationId}"
              style="
                display: inline-block;
                padding: 8px 16px;
                background-color: #464775;
                color: white;
                text-decoration: none;
                border-radius: 4px;
                font-weight: bold;
              "
            >
              View Invitation
            </a>
          </div>
        `
      };
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
            console.error(`Failed to send notification to ${dto.recipientEmail}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error while sending notifications:', error);
    }

    return createdInvitations;
  }
}