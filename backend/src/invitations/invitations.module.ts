// invitations.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Invitation, InvitationSchema } from './schemas/invitation.schema';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { UsersModule } from 'src/users/users.module';
import { Slot, SlotSchema } from 'src/slots/schemas/slot.schema';
import { GraphModule } from 'src/graph/graph.module';
import { SlotsModule } from 'src/slots/slots.module';

@Module({
  imports: [
    forwardRef(()=>SlotsModule),
    GraphModule,
    UsersModule,
    MongooseModule.forFeature([{ name: Invitation.name, schema: InvitationSchema }]),
    MongooseModule.forFeature([{ name: Slot.name, schema: SlotSchema }]),
    
  ],
  controllers: [InvitationsController],
  providers: [InvitationsService],
  exports:[InvitationsService]

  
})
export class InvitationsModule {}