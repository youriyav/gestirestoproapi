import { Restaurant } from '../entities/restaurant.entity';

/** Only what a public menu page needs — never the raw entity (no id/status/plan/internal keys). */
export interface PublicRestaurantResponse {
  name: string;
  city: string;
  address: string | null;
  phone: string | null;
  hours: string | null;
  logoUrl: string | null;
}

export function toPublicRestaurantResponse(restaurant: Restaurant): PublicRestaurantResponse {
  return {
    name: restaurant.name,
    city: restaurant.city,
    address: restaurant.address ?? null,
    phone: restaurant.phone ?? null,
    hours: restaurant.hours ?? null,
    logoUrl: restaurant.logoUrl ?? null,
  };
}
