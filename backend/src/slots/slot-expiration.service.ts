import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Slot } from './schemas/slot.schema';
import { Cron } from '@nestjs/schedule';
import { User } from 'src/users/schemas/user.schema';
import { Game } from 'src/games/schemas/game.schema';
import { Invitation } from 'src/invitations/schemas/invitation.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class SlotExpirationService implements OnModuleInit {
  constructor(
    @InjectModel(Slot.name) private slotModel: Model<Slot>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Invitation.name) private invitationModel: Model<Invitation>,
    @InjectModel(Game.name) private gameModel: Model<Game>,
    private eventEmitter: EventEmitter2

  ) {}

  onModuleInit() {
    console.log('Slot expiration service initialized');
  }
  

  @Cron('*/1 * * * * *') 
  async handleExpiredSlots() {
    try {
      const now = new Date();
      const expiredSlots = await this.slotModel.find({
        expiresAt: { $lte: now },
        slotStatus: 'on-hold'
      });

      if (expiredSlots.length > 0) {
        console.log(`Processing ${expiredSlots.length} expired slots`);
      }

      for (const slot of expiredSlots) {
        await this.processExpiredSlot(slot);
      }
    } catch (error) {
      console.error('Error in handleExpiredSlots:', error);
    }
  }

  async processExpiredSlot(slot: Slot) {
    try {
      const game = await this.gameModel.findOne({ gameId: slot.gameId });
      if (!game) {
        throw new Error(`Game not found for slot ${slot.slotId}`);
      }
      const meetsRequirements = slot.peopleAccepted >= game.minPlayers && 
                              slot.peopleAccepted <= game.maxPlayers;

      const updatedSlot = await this.slotModel.findOneAndUpdate(
        { slotId: slot.slotId },
        { 
          $set: { 
            slotStatus: meetsRequirements ? "booked" : "failed",
            updatedAt: new Date() 
          }
        },
        { new: true }
      );

      if (!updatedSlot) {
        throw new Error(`Failed to update slot ${slot.slotId}`);
      }
      const invitations = await this.invitationModel.find({ 
        slotId: slot.slotId 
      });
     
      for (const invitation of invitations) {
        const newStatus = updatedSlot.slotStatus === "booked" 
          ? invitation.invitationStatus 
          : 'expired';

        await this.invitationModel.updateOne(
          { invitationId: invitation.invitationId },
          {
            $set: {
              invitationStatus: newStatus,
              isActive: false,
              respondedAt: new Date()
            }
          }
        );

        if (!meetsRequirements && invitation.invitationStatus === "accepted") {
          await this.userModel.updateOne(
            { email: invitation.recipientEmail },
            {
              $inc: { chances: 1 },
              $set: { lastChanceUpdatedAt: new Date() }
            }
          );
        }
      }

      if (!meetsRequirements && slot.heldBy) {
        await this.userModel.updateOne(
          { email: slot.heldBy },
          {
            $inc: { chances: 1 },
            $set: { lastChanceUpdatedAt: new Date() }
          }
        );
      }
      
      this.eventEmitter.emit('slot.expired', {
        gameId: slot.gameId,
        slotId: slot.slotId,
        slotStatus: updatedSlot.slotStatus,
        startTime:updatedSlot.startTime,
        endTime:updatedSlot.endTime,
        heldBy:updatedSlot.heldBy
      });

      console.log(`Successfully processed expired slot ${slot.slotId}`);
    } catch (error) {
      console.error(`Error processing slot ${slot.slotId}:`, error);
      throw error;
    }
  }
}