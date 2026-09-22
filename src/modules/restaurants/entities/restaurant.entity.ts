import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';

export enum RESTAURANT_PLAN {
  ESSENTIEL = 'essentiel',
  PRO = 'pro',
  BUSINESS = 'business',
}

export enum RESTAURANT_STATUS {
  ACTIVE = 'active',
  TRIAL = 'trial',
  SUSPENDED = 'suspended',
}

/**
 * The tenant root. Every per-restaurant entity (User, MenuCategory, MenuItem,
 * and future Table/Order/Payment) carries a restaurantId FK to this table.
 * Restaurant itself has no restaurantId — it IS the tenant, not a tenant member.
 */
@Entity({ name: 'restaurants' })
export class Restaurant extends BaseEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ default: 'Bangui' })
  city: string;

  @Column({
    type: 'enum',
    enum: RESTAURANT_PLAN,
    default: RESTAURANT_PLAN.ESSENTIEL,
  })
  plan: RESTAURANT_PLAN;

  @Column({
    type: 'enum',
    enum: RESTAURANT_STATUS,
    default: RESTAURANT_STATUS.TRIAL,
  })
  status: RESTAURANT_STATUS;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  phone?: string;

  // Free text, e.g. "Lun-Dim : 08h-22h" — shown on the public menu page.
  @Column({ nullable: true })
  hours?: string;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl?: string;

  @Column({ name: 'logo_object_key', nullable: true })
  logoObjectKey?: string;
}
