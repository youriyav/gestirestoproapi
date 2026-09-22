import { RESTAURANT_PLAN } from './entities/restaurant.entity';

/**
 * Monthly price per plan (FCFA), mirroring the GestiRestoPro landing page
 * pricing table. Not stored on the entity — MRR is derived at read time
 * from `plan`/`status` rather than kept in sync as a separate column.
 */
export const RESTAURANT_PLAN_PRICE_MONTHLY: Record<RESTAURANT_PLAN, number> = {
  [RESTAURANT_PLAN.ESSENTIEL]: 15000,
  [RESTAURANT_PLAN.PRO]: 25000,
  [RESTAURANT_PLAN.BUSINESS]: 45000,
};

export const RESTAURANT_LOGO_UPLOAD_PATH = 'restaurant-logo';

/**
 * Subdomain labels that must never be interpreted as a restaurant slug —
 * reserved for infrastructure/product surfaces (www, the API itself, the
 * admin app, mail, CDN, status page, docs, the public-menu path prefix...).
 */
export const RESERVED_SLUGS: readonly string[] = [
  'www',
  'api',
  'app',
  'admin',
  'mail',
  'cdn',
  'status',
  'docs',
  'r',
  'public',
  'assets',
  'static',
  'blog',
  'support',
  'help',
];
