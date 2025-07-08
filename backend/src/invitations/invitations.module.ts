// invitations.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Invitation, InvitationSchema } from './schemas/invitation.schema';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UsersModule } from 'src/users/users.module';
import { Slot, SlotSchema } from 'src/slots/schemas/slot.schema';
import { GraphModule } from 'src/graph/graph.module';

@Module({
  imports: [
    GraphModule,
    UsersModule,
    MongooseModule.forFeature([{ name: Invitation.name, schema: InvitationSchema }]),
    MongooseModule.forFeature([{ name: Slot.name, schema: SlotSchema }]),
    
  ],
  controllers: [InvitationsController],
  providers: [InvitationsService],
  

  
})
export class InvitationsModule {}