import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { RESTAURANT_PLAN, RESTAURANT_STATUS } from '../entities/restaurant.entity';

export class CreateRestaurantDto {
  @ApiProperty({ description: 'Restaurant display name', example: 'Le Bangui Chic' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description:
      'Unique URL-friendly slug, used in public menu URLs (/r/{slug}/menu). Auto-generated from the name if omitted.',
    example: 'le-bangui-chic',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase, alphanumeric, hyphen-separated',
  })
  slug?: string;

  @ApiPropertyOptional({ description: 'City', example: 'Bangui', default: 'Bangui' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Street address', example: "12 Avenue de l'Indépendance" })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Contact phone number', example: '+236 70 12 34 56' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Opening hours (free text)', example: 'Lun-Dim : 08h-22h' })
  @IsOptional()
  @IsString()
  hours?: string;

  @ApiPropertyOptional({ enum: RESTAURANT_PLAN, default: RESTAURANT_PLAN.ESSENTIEL })
  @IsOptional()
  @IsEnum(RESTAURANT_PLAN)
  plan?: RESTAURANT_PLAN;

  @ApiPropertyOptional({ enum: RESTAURANT_STATUS, default: RESTAURANT_STATUS.TRIAL })
  @IsOptional()
  @IsEnum(RESTAURANT_STATUS)
  status?: RESTAURANT_STATUS;
}
