import { MenuCategory } from '@modules/menu/entities/menu-category.entity';
import { MenuItem } from '@modules/menu/entities/menu-item.entity';

/** Only what the public menu page needs — never the raw entity (no restaurantId/audit columns). */
export interface PublicMenuCategoryResponse {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  order: number;
}

export interface PublicMenuItemResponse {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  unit: string | null;
  description: string | null;
  imageUrl: string | null;
  order: number;
}

export function toPublicMenuCategoryResponse(category: MenuCategory): PublicMenuCategoryResponse {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    icon: category.icon ?? null,
    order: category.order,
  };
}

export function toPublicMenuItemResponse(item: MenuItem): PublicMenuItemResponse {
  return {
    id: item.id,
    name: item.name,
    categoryId: item.categoryId,
    price: item.price,
    unit: item.unit ?? null,
    description: item.description ?? null,
    imageUrl: item.imageUrl ?? null,
    order: item.order,
  };
}
