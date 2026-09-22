import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class AddTableOrderItemDto {
  @ApiProperty({ description: 'Mobile offline-queue idempotency key', example: 'orderitem-<tableId>-<timestamp>' })
  @IsNotEmpty()
  @IsString()
  clientId: string;

  @ApiPropertyOptional({ description: 'Menu item ID this line was ordered from, if still known' })
  @IsOptional()
  @IsUUID()
  menuItemId?: string;

  @ApiProperty({ description: 'Item name, snapshotted at add time', example: 'Tawouk' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Unit price (FCFA), snapshotted at add time', example: 10000 })
  @IsInt()
  @Min(0)
  unitPrice: number;

  // Negative deltas are legal (decrease/remove a line — see TablesService)
  // in addition to positive ones (add/increase) — only 0 would be a no-op.
  @ApiProperty({ description: 'Quantity delta for this event: positive to add/increase, negative to decrease/remove', example: 2 })
  @IsInt()
  quantity: number;
}
