import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateInvitationDto {

  @IsString()
  @IsNotEmpty()
  slotId: string;

  @IsEmail()
  @IsNotEmpty()
  recipientEmail: string;
}