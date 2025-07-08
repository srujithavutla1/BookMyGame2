// invitations.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Invitation, InvitationSchema } from './schemas/invitation.schema';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { SlotsModule } from 'src/slots/slots.module';

@Module({
  imports: [
    SlotsModule,
    MongooseModule.forFeature([{ name: Invitation.name, schema: InvitationSchema }])
  ],
  controllers: [InvitationsController],
  providers: [InvitationsService],
  exports: [InvitationsService], 
})
export class InvitationsModule {}