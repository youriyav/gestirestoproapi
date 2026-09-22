import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Matches } from 'class-validator';

export class UpdateAppSettingsDto {
  @ApiProperty({
    description: 'Commercial WhatsApp number, digits only, no "+" or "00" prefix (wa.me format)',
    example: '221778399425',
  })
  @IsNotEmpty()
  @Matches(/^[1-9]\d{6,14}$/, {
    message: 'Le numéro doit être au format international sans "+" ni "00" (ex: 221778399425)',
  })
  whatsappNumber: string;
}
