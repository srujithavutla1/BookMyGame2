import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class SlotPeopleAddedDto {
  @IsString()
  @IsNotEmpty()
  slotId: string;

  @IsNumber()
  @IsOptional()
  peopleAdded?: number;
}