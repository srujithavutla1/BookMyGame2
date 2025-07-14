import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Slot } from './schemas/slot.schema';
import { InvitationsService } from 'src/invitations/invitations.service';
import { SlotDto } from './dtos/slot.dto';
import { SlotPeopleAddedDto } from './dtos/SlotPeopleAdded.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SlotStatusDto } from './dtos/slotStatus.dto';
import { UsersService } from 'src/users/users.service';
import { Invitation } from 'src/invitations/schemas/invitation.schema';

@Injectable()
export class SlotsService {
  private getStartOfDay(): Date {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }

  constructor(
    @InjectModel(Slot.name) private slotModel: Model<Slot>,
    @Inject(forwardRef(() => InvitationsService))
    private readonly invitationsService: InvitationsService,
    private readonly eventEmitter: EventEmitter2,

  ) {}

  private getTodayFilter() {
    return { createdAt: { $gte: this.getStartOfDay() } };
  }

  async getAllSlots(): Promise<Slot[]> {
    return this.slotModel.find(this.getTodayFilter()).exec();
  }

  async getAllSlotsByGameId(gameId: string): Promise<Slot[]> {
    return this.slotModel.find({
      gameId: gameId,
      ...this.getTodayFilter()
    }).exec();
  }

  async getAllUserSlots(email: string): Promise<Slot[]> {
    const [heldSlots, invitations] = await Promise.all([
        this.slotModel.find({
            heldBy: email,
            ...this.getTodayFilter()
        }).exec(),
        this.invitationsService.getAllInvitationsByRecipientEmail(email)
    ]);
    const slotIds = invitations
        .filter(inv => inv.invitationStatus === 'accepted')
        .map(inv => inv.slotId);

    
    const invitedSlots = slotIds.length > 0 
        ? await this.slotModel.find({
            slotId: { $in: slotIds },
            ...this.getTodayFilter()
        }).exec()
        : [];

    return [...heldSlots, ...invitedSlots];
  }
  async getAllSlotsByInvitationRecipientEmail(recipientEmail: string): Promise<Slot[]> {
    const invitations = await this.invitationsService.getAllInvitationsByRecipientEmail(recipientEmail);
    const slotIds = invitations.map(invitation => invitation.slotId);

    return slotIds.length > 0
        ? await this.slotModel.find({
            slotId: { $in: slotIds },
            ...this.getTodayFilter()
          }).exec()
        : [];
  }


  async getAllActiveSlotsByGameId(gameId: string): Promise<Slot[]> {
    return this.slotModel.find({
      gameId: gameId,
      slotStatus: {$in: ['on-hold', 'booked']},
      ...this.getTodayFilter()
    }).exec();
  }

  async getExpiredSlots(gameId: string): Promise<Slot[]> {
    const now = new Date();

    return this.slotModel.find({
      gameId: gameId,
      slotStatus: 'on-hold',
      expiresAt: { $lte: now },
      ...this.getTodayFilter()
    }).exec();
  }
  async getSlotStatus(gameId: string,startTime: string,endTime: string): Promise<Boolean> {
    const slot = await this.slotModel.findOne({
      gameId: gameId,
      startTime: startTime,
      endTime: endTime,
      slotStatus: {$in: ['on-hold', 'booked']},
      ...this.getTodayFilter()
    }).exec();
    if(slot)
      return true;
    return false;
  }




  async createSlot(createSlotDto: SlotDto): Promise<Slot> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 0.5 * 60 * 1000); 

    const slotData = {
      ...createSlotDto,
      slotStatus: 'on-hold' as const,
      peopleAccepted: 1,
      createdAt: now,
      expiresAt: expiresAt,
      updatedAt: now,
      isActive: true
    };

    const createdSlot = await new this.slotModel(slotData).save();
    
    this.eventEmitter.emit('slot.created', {
      gameId: createdSlot.gameId,
      slotId: createdSlot.slotId,
      slotStatus: createdSlot.slotStatus,
      startTime: createdSlot.startTime,
      endTime: createdSlot.endTime,
      heldBy: createdSlot.heldBy
    });

    return createdSlot;
  }

  async updateSlotPeopleAdded(updateSlotPeopleAddedDto: SlotPeopleAddedDto): Promise<Slot> {
    const now = new Date();
    const updatedSlot = await this.slotModel.findOneAndUpdate(
      { 
        slotId: updateSlotPeopleAddedDto.slotId,
        ...this.getTodayFilter()
      },
      { 
        $set: { 
          peopleAdded: updateSlotPeopleAddedDto.peopleAdded,
          updatedAt: now 
        } 
      },
      { new: true } 
    ).exec();

    if (!updatedSlot) {
      throw new Error(`Slot with ID ${updateSlotPeopleAddedDto.slotId} not found or not created today`);
    }

    return updatedSlot;
  }
  async updateSlotStatus(updateSlotStatus: SlotStatusDto): Promise<Slot> {
    console.log("hi")
  const now = new Date();
  const updatedSlot = await this.slotModel.findOneAndUpdate(
    { 
      slotId: updateSlotStatus.slotId,
      ...this.getTodayFilter()
    },
    { 
      $set: { 
        slotStatus: updateSlotStatus.slotStatus,
        isActive: updateSlotStatus.isActive,
        updatedAt: now 
      } 
    },
    { new: true } 
  ).exec();

  if (!updatedSlot) {
    throw new Error(`Slot with ID ${updateSlotStatus.slotId} not found or not created today`);
  }

  this.eventEmitter.emit('slot.statusUpdated', {
    gameId: updatedSlot.gameId,
    slotId: updatedSlot.slotId,
    slotStatus: updatedSlot.slotStatus,
    startTime: updatedSlot.startTime,
    endTime: updatedSlot.endTime,
    heldBy: updatedSlot.heldBy,
    isActive: updatedSlot.isActive
  });

  return updatedSlot;
}

  async createOrUpdateSlots(slots: Slot[]): Promise<Slot[]> {
    const operations = slots.map(slot => ({
      updateOne: {
        filter: { slotId: slot.slotId },
        update: { $set: slot },
        upsert: true
      }
    }));

    await this.slotModel.bulkWrite(operations);

    return this.slotModel.find({
      slotId: { $in: slots.map(s => s.slotId) },
      ...this.getTodayFilter()
    }).exec();
  }


  async getSlotBySlotId(slotId: string): Promise<Slot | null> {
  return this.slotModel.findOne({
    slotId: slotId,
    ...this.getTodayFilter()
  }).exec();
}

async SlotsAndInvitationsByGameId(gameId: string, startTime: string, endTime: string): Promise<{
  slots: Slot[];
  invitations: Invitation[];
}> {

 console.log(startTime+" "+endTime);
 
  const slots = await this.slotModel
    .find({
      gameId,
      slotStatus: { $in: ['booked', 'cancelled', 'failed', 'on-hold'] },
      startTime: { $gte: startTime },
      endTime: { $lte: endTime },    
      ...this.getTodayFilter(),
    })
    .exec();

  const slotIds = slots.map(slot => slot.slotId);
  const invitations = slotIds.length > 0
    ? await this.invitationsService.getAllInvitationsBySlotIds(slotIds, 'accepted')
    : [];



  return {
    slots,
    invitations,
  };
}
}
