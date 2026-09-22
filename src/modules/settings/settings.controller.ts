import { Body, Controller, Get, Patch, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateAppSettingsDto } from './dto/update-app-settings.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { USER_ROLES } from '@shared/enums/user-roles';
import { ApiResponse as CustomApiResponse } from '@shared/types';
import { Public } from '@shared/tenant-context';

@ApiTags('settings')
@Controller('settings')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get public app settings (public)' })
  @ApiResponse({ status: 200, description: 'Return the app settings.' })
  async get(): Promise<CustomApiResponse<{ whatsappNumber: string }>> {
    const settings = await this.settingsService.getPublicSettings();
    return { success: true, data: settings };
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update app settings (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'The settings have been successfully updated.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Super Admin access required.' })
  async update(
    @Body() dto: UpdateAppSettingsDto,
  ): Promise<CustomApiResponse<{ whatsappNumber: string }>> {
    const settings = await this.settingsService.updateSettings(dto);
    return { success: true, data: settings };
  }
}
