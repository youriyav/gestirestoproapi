import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '@shared/services/base.service';
import { AppSetting } from './entities/app-setting.entity';
import { UpdateAppSettingsDto } from './dto/update-app-settings.dto';

const DEFAULT_WHATSAPP_NUMBER = '221778399425';

@Injectable()
export class SettingsService extends BaseService<AppSetting> {
  constructor(
    @InjectRepository(AppSetting)
    private readonly appSettingsRepository: Repository<AppSetting>,
  ) {
    super(appSettingsRepository);
  }

  private async getOrCreate(): Promise<AppSetting> {
    const existing = await this.appSettingsRepository.findOne({ where: {} });
    if (existing) return existing;

    return this.appSettingsRepository.save(
      this.appSettingsRepository.create({ whatsappNumber: DEFAULT_WHATSAPP_NUMBER }),
    );
  }

  async getPublicSettings(): Promise<{ whatsappNumber: string }> {
    const settings = await this.getOrCreate();
    return { whatsappNumber: settings.whatsappNumber };
  }

  async updateSettings(dto: UpdateAppSettingsDto): Promise<{ whatsappNumber: string }> {
    const settings = await this.getOrCreate();
    settings.whatsappNumber = dto.whatsappNumber;
    const saved = await this.appSettingsRepository.save(settings);
    return { whatsappNumber: saved.whatsappNumber };
  }
}
