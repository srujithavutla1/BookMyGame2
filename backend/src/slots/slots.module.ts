import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Slot, SlotSchema } from './schemas/slot.schema';
import { SlotsController } from './slots.controller';
import { SlotsService } from './slots.service';

import { GamesModule } from '../games/games.module'; // Add this import
import { SlotExpirationService } from './slot-expiration.service'; // Add this import
import { UsersModule } from 'src/users/users.module';
import { User, UserSchema } from 'src/users/schemas/user.schema';
import { Invitation, InvitationSchema } from 'src/invitations/schemas/invitation.schema';
import { Game, GameSchema } from 'src/games/schemas/game.schema';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { InvitationsModule } from 'src/invitations/invitations.module';
import { GraphModule } from 'src/graph/graph.module';

@Module({
  imports: [
    GraphModule,
    MongooseModule.forFeature([{ name: Slot.name, schema: SlotSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Invitation.name, schema: InvitationSchema }]),
    MongooseModule.forFeature([{ name: Game.name, schema: GameSchema }]),
    UsersModule, 
    GamesModule,
    forwardRef(()=>InvitationsModule)
  
    
  ],
  controllers: [SlotsController],
  providers: [SlotsService,SlotExpirationService],
 
  exports: [SlotsService], 
})
export class SlotsModule {}


