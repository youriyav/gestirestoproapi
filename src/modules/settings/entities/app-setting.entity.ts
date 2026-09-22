import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';

/**
 * Singleton table (a single row) holding app-wide settings editable by a
 * Super Admin, as opposed to per-restaurant settings on the restaurants table.
 */
@Entity({ name: 'app_settings' })
export class AppSetting extends BaseEntity {
  @Column()
  whatsappNumber: string;
}
