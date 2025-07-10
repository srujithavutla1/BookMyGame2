import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { Slot } from './schemas/slot.schema';
import { SlotsService } from './slots.service';
import { SlotDto } from './dtos/slot.dto';
import { SlotPeopleAddedDto } from './dtos/SlotPeopleAdded.dto';
import { SlotStatusDto } from './dtos/slotStatus.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
@UseGuards(JwtAuthGuard)
@Controller('slots')

export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  //use dynamic routes
  @Get('getAll')
  async getAll(): Promise<Slot[]|null> {  
    return this.slotsService.getAllSlots();
  }
  @Get('getAllUserSlots')
  async getAllUserSlots(@Query('recipientEmail') recipientEmail: string):Promise<Slot[]|null>
  {
    return this.slotsService.getAllUserSlots(recipientEmail);
  }
  @Get('getAllExpiredSlots')
  async getAllExpiredSlots(@Query('gameId') gameId: string): Promise<Slot[]> {
   
    return this.slotsService.getExpiredSlots(gameId);
  }
  @Get('getAllSlotsByInvitationRecipientEmail')
  async getAllSlotsByInvitationRecipientEmail(@Query('recipientEmail') recipientEmail: string): Promise<Slot[]> {
   
    return this.slotsService.getAllSlotsByInvitationRecipientEmail(recipientEmail);
  }
  @Get('getAllActiveSlotsByGameId')
  async getAllActiveSlotsByGameId(@Query('gameId') gameId: string): Promise<Slot[]> {
   
    return this.slotsService.getAllActiveSlotsByGameId(gameId);
  }
  @Get('getAllSlotsByGameId')
  async getAllSlotsByGameId(@Query('gameId') gameId: string):Promise<Slot[]|null>
  {
    return this.slotsService.getAllSlotsByGameId(gameId);
  }
  @Get('getSlotStatus')
  async getSlotStatus(@Query('gameId') gameId: string,@Query('startTime') startTime: string,@Query('endTime') endTime: string):Promise<Boolean>
  {
    return this.slotsService.getSlotStatus(gameId,startTime,endTime);
  }

  @Post('createSlot')
  async createSlot(@Body() createSlotDto: SlotDto): Promise<Slot> {
    return this.slotsService.createSlot(createSlotDto);
  }
  @Post('updateSlotPeopleAdded')
  async updateSlotPeopleAdded(@Body()  updateSlotPeopleAddedDto: SlotPeopleAddedDto): Promise<Slot> {
    return this.slotsService.updateSlotPeopleAdded(updateSlotPeopleAddedDto);
  }
  @Post('updateSlotStatus')
  async updateSlotStatus(@Body() updateSlotStatusDto: SlotStatusDto): Promise<Slot> {
    console.log("hit");
    return this.slotsService.updateSlotStatus(updateSlotStatusDto);
  }
  
  
  @Post()
  async createOrUpdate(@Body() slots: Slot[]): Promise<Slot[]> {
    return this.slotsService.createOrUpdateSlots(slots);
  }
}