import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DESIRED_PLAN } from '../entities/demo-request.entity';

export class CreateDemoRequestDto {
  @ApiProperty({ description: 'Restaurant name', example: 'Le Bangui Chic' })
  @IsNotEmpty()
  @IsString()
  restaurantName: string;

  @ApiProperty({ description: 'Contact full name', example: 'Aïcha Doumta' })
  @IsNotEmpty()
  @IsString()
  contactName: string;

  @ApiProperty({
    description: 'Contact phone number',
    example: '+236 70 12 34 56',
  })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiPropertyOptional({ description: 'Contact email', example: 'contact@lebanguichic.cf' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'City', example: 'Bangui', default: 'Bangui' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Desired plan', enum: DESIRED_PLAN, default: DESIRED_PLAN.UNSURE })
  @IsOptional()
  @IsEnum(DESIRED_PLAN)
  desiredPlan?: DESIRED_PLAN;

  @ApiPropertyOptional({ description: 'Free-text message', example: "Nous avons 3 salles et cherchons à digitaliser la caisse." })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({
    description:
      'Honeypot anti-spam field. Must stay empty for real users — hidden from view. If filled, the request is silently discarded.',
  })
  @IsOptional()
  @IsString()
  honeypot?: string;
}
