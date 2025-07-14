import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Slot } from './schemas/slot.schema';
import { Cron } from '@nestjs/schedule';
import { User } from 'src/users/schemas/user.schema';
import { Game } from 'src/games/schemas/game.schema';
import { Invitation } from 'src/invitations/schemas/invitation.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UsersService } from 'src/users/users.service';
import { GraphService } from 'src/graph/graph.service';

@Injectable()
export class SlotExpirationService implements OnModuleInit {
  constructor(
    @InjectModel(Slot.name) private slotModel: Model<Slot>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Invitation.name) private invitationModel: Model<Invitation>,
    @InjectModel(Game.name) private gameModel: Model<Game>,
    private eventEmitter: EventEmitter2,
    private usersService: UsersService,
    private graphService: GraphService,
  ) {}

  onModuleInit

() {
    console.log('Slot expiration service initialized');
  }

  @Cron('*/1 * * * * *')
  async handleExpiredSlots() {
    try {
      const now = new Date();
      const expiredSlots = await this.slotModel.find({
        expiresAt: { $lte: now },
        slotStatus: 'on-hold',
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
      const meetsRequirements =
        slot.peopleAccepted >= game.minPlayers &&
        slot.peopleAccepted <= game.maxPlayers;

      const updatedSlot = await this.slotModel.findOneAndUpdate(
        { slotId: slot.slotId },
        {
          $set: {
            slotStatus: meetsRequirements ? 'booked' : 'failed',
            updatedAt: new Date(),
          },
        },
        { new: true },
      );

      if (!updatedSlot) {
        throw new Error(`Failed to update slot ${slot.slotId}`);
      }

      const invitations = await this.invitationModel.find({
        slotId: slot.slotId,
      });

      for (const invitation of invitations) {
        const newStatus =
          updatedSlot.slotStatus === 'booked'
            ? invitation.invitationStatus
            : 'expired';

        await this.invitationModel.updateOne(
          { invitationId: invitation.invitationId },
          {
            $set: {
              invitationStatus: newStatus,
              isActive: false,
              respondedAt: new Date(),
            },
          },
        );

        if (!meetsRequirements && invitation.invitationStatus === 'accepted') {
          await this.userModel.updateOne(
            { email: invitation.recipientEmail },
            {
              $inc: { chances: 1 },
              $set: { lastChanceUpdatedAt: new Date() },
            },
          );
        }
      }

      if (!meetsRequirements && slot.heldBy) {
        await this.userModel.updateOne(
          { email: slot.heldBy },
          {
            $inc: { chances: 1 },
            $set: { lastChanceUpdatedAt: new Date() },
          },
        );
      }

      // Send Teams message for both booked and failed slots
      await this.sendSlotStatusNotification(updatedSlot, invitations);

      this.eventEmitter.emit('slot.expired', {
        gameId: slot.gameId,
        slotId: slot.slotId,
        slotStatus: updatedSlot.slotStatus,
        startTime: updatedSlot.startTime,
        endTime: updatedSlot.endTime,
        heldBy: updatedSlot.heldBy,
      });

      console.log(`Successfully processed expired slot ${slot.slotId}`);
    } catch (error) {
      console.error(`Error processing slot ${slot.slotId}:`, error);
      throw error;
    }
  }

  private async sendSlotStatusNotification(slot: Slot, invitations: Invitation[]) {
    try {
      const senderEmail = 'srujitha.vutla@pal.tech';
      const senderUser = await this.usersService.validateUserByEmail(senderEmail);
      if (!senderUser?.microsoftAccessToken) {
        console.error(`Sender ${senderEmail} does not have a valid Microsoft access token`);
        return;
      }

      const acceptedParticipants = invitations
        .filter((inv) => inv.invitationStatus === 'accepted')
        .map((inv) => inv.recipientEmail)
        .join(', ');

      const isBooked = slot.slotStatus === 'booked';
      const message = {
        contentType: 'html',
        content: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <h2 style="color: #464775; margin-bottom: 16px;">
              ${isBooked ? '🎉 Game Session Booked! 🎉' : '❌ Game Session Failed to Book ❌'}
            </h2>
            <p style="margin-bottom: 16px;">
              The game session for <strong>${slot.gameId}</strong> has ${
          isBooked ? 'been successfully booked' : 'failed to book due to insufficient participants'
        }.
            </p>
            <div style="background-color: #f3f2f1; padding: 12px; border-radius: 4px; margin-bottom: 16px;">
              <h3 style="color: #464775; margin-top: 0; margin-bottom: 8px;">Slot Details:</h3>
              <ul style="margin-top: 0; padding-left: 20px;">
                <li><strong>Game ID:</strong> ${slot.gameId}</li>
                <li><strong>Slot ID:</strong> ${slot.slotId}</li>
                <li><strong>Start Time:</strong> ${slot.startTime}</li>
                <li><strong>End Time:</strong> ${slot.endTime}</li>
                <li><strong>Participants (Accepted):</strong> ${acceptedParticipants || 'None'}</li>
              </ul>
            </div>
            <p style="margin-bottom: 16px;">
              ${isBooked ? 'Get ready for an exciting game session!' : 'Please try booking another slot or inviting more participants.'}
            </p>
          </div>
        `,
      };

      // Notify accepted participants and the slot holder
      const participants = [
        ...invitations
          .filter((inv) => inv.invitationStatus === 'accepted')
          .map((inv) => inv.recipientEmail),
        slot.heldBy, // Include the slot holder
      ].filter((email, index, self) => email && self.indexOf(email) === index); // Remove duplicates and nulls

      for (const recipientEmail of participants) {
        try {
          const recipient = await this.usersService.validateUserByEmail(recipientEmail);
          if (recipient?.microsoftAccessToken) {
            const senderId = await this.graphService.getUserIdByEmail(
              senderUser.microsoftAccessToken,
              senderUser.email,
            );
            const chatId = await this.graphService.getOrCreateChat(
              senderUser.microsoftAccessToken,
              senderId,
              recipientEmail,
              recipient.microsoftAccessToken,
            );
            await this.graphService.sendMessage(
              senderUser.microsoftAccessToken,
              chatId,
              message,
            );
          }
        } catch (error) {
          console.error(`Failed to send slot status notification to ${recipientEmail}:`, error);
        }
      }
    } catch (error) {
      console.error('Error sending slot status notification:', error);
    }
  }
}