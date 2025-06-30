import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { Invitation } from './schemas/invitation.schema';
import { InvitationsService } from './invitations.service';
import { InvitationStatusDto } from './dto/invitationStatus.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get('getAllInvitations')
  async getAllInvitations(@Query('slotId') slotId: string,@Query('recipientEmail') recipientEmail: string): Promise<Invitation[]|null> { 
    return this.invitationsService.getAllInvitations();
  }

  @Get('getInvitationBySlotIdAndRecipientEmail')
  async getInvitationBySlotIdAndRecipientEmail(@Query('slotId') slotId: string,@Query('recipientEmail') recipientEmail: string,@Query('invitationId') invitationId: string): Promise<Invitation|null> {
    return this.invitationsService.getInvitationBySlotIdAndRecipientEmail(slotId,recipientEmail);
    
  }
  
  @Get('getAllInvitationsBySlotId')
  async getAllInvitationsBySlotId(@Query('slotId') slotId: string): Promise<Invitation[]|null> {

    return this.invitationsService.getAllInvitationsBySlotId(slotId);
  }
  @Get('getAllInvitationsByRecipientEmail')
  async getAllInvitationsByRecipientEmail(@Query('recipientEmail') recipientEmail: string): Promise<Invitation[]|null> {

     return this.invitationsService.getAllInvitationsByRecipientEmail(recipientEmail);
  }


  @Get('getInvitationByInvitationId')
  async getInvitationByInvitationId (@Query('invitationId') invitationId: string): Promise<Invitation|null> {

    return this.invitationsService.getInvitationByInvitationId(invitationId)!;
    
  }
  @Post()
  async createOrUpdateInvitations(@Body() invitations: Invitation[]): Promise<Invitation[]> {

    return this.invitationsService.createOrUpdateInvitations(invitations);
  }
  
  @Post('updateInvitationStatus')
  async updateInvitationStatus(@Body() invitationStatusDto: InvitationStatusDto): Promise<Invitation[]|null> {

    return this.invitationsService.updateInvitationStatus(invitationStatusDto);
  }
  
}