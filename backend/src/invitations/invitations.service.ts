import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Invitation, InvitationStatus } from './schemas/invitation.schema';
import { InvitationStatusDto } from './dto/invitationStatus.dto';
import { CreateInvitationDto } from './dto/invitation.dto';
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
    private readonly slotsService: SlotsService // Inject SlotsService

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
  async createInvitations(createInvitationDtos: CreateInvitationDto[],senderEmail: string): Promise<Invitation[]> {
    if (createInvitationDtos.length === 0) {
        return [];
    }
    const slotId = createInvitationDtos[0].slotId;
    const slot = await this.slotsService.getSlotBySlotId(slotId);
    
    if (!slot) {
        throw new Error(`Slot with ID ${slotId} not found`);
    }

    const invitationsToCreate = createInvitationDtos.map(dto => ({
        invitationId: uuidv4(), // Generate new GUID
        slotId: dto.slotId,
        recipientEmail: dto.recipientEmail,
        senderEmail: senderEmail,
        invitationStatus: 'pending' as InvitationStatus,
        sentAt: new Date(),
        expiresAt: slot.expiresAt, // Set from slot's expiration
        isActive: true,
    }));

    // Using insertMany for bulk insertion
    const createdInvitations = await this.invitationModel.insertMany(invitationsToCreate);
    return createdInvitations;
}
}