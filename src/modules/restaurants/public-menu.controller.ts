import {
  Controller,
  Get,
  Header,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle, ThrottlerGuard } from '@nestjs/throttler';
import { MenuCategoriesService } from '@modules/menu/menu-categories.service';
import { MenuItemsService } from '@modules/menu/menu-items.service';
import { ApiResponse as CustomApiResponse } from '@shared/types';
import { Public } from '@shared/tenant-context';
import { SlugTenantResolverGuard } from './guards/slug-tenant-resolver.guard';
import {
  PublicMenuCategoryResponse,
  PublicMenuItemResponse,
  toPublicMenuCategoryResponse,
  toPublicMenuItemResponse,
} from './dto/public-menu.response';

const PUBLIC_MENU_CACHE_CONTROL = 'public, max-age=60, stale-while-revalidate=300';

/**
 * Public, unauthenticated digital menu — scanned via QR code as /r/{slug}/menu.
 * Lives in `restaurants`, not `menu`, so the dependency points restaurants ->
 * menu, never the reverse, and slug-resolution logic has one home.
 */
@ApiTags('public-menu')
@Controller('r/:slug/menu')
@Public()
@UseGuards(SlugTenantResolverGuard, ThrottlerGuard)
@SkipThrottle({ default: true }) // only the more permissive 'public' bucket applies here
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class PublicMenuController {
  constructor(
    private readonly menuCategoriesService: MenuCategoriesService,
    private readonly menuItemsService: MenuItemsService,
  ) {}

  @Get('categories')
  @Header('Cache-Control', PUBLIC_MENU_CACHE_CONTROL)
  @ApiOperation({ summary: "Get a restaurant's digital menu categories by slug (public)" })
  @ApiParam({ name: 'slug', description: 'Restaurant slug' })
  @ApiResponse({ status: 200, description: "Return the restaurant's menu categories." })
  @ApiResponse({ status: 404, description: 'Restaurant not found or not active.' })
  async findCategories(): Promise<CustomApiResponse<PublicMenuCategoryResponse[]>> {
    const categories = await this.menuCategoriesService.findAll();
    return { success: true, data: categories.map(toPublicMenuCategoryResponse) };
  }

  @Get('items')
  @Header('Cache-Control', PUBLIC_MENU_CACHE_CONTROL)
  @ApiOperation({ summary: "Get a restaurant's available digital menu items by slug (public)" })
  @ApiParam({ name: 'slug', description: 'Restaurant slug' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category slug' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Filter by name (contains, case-insensitive)',
  })
  @ApiResponse({ status: 200, description: 'Return the matching available menu items.' })
  @ApiResponse({ status: 404, description: 'Restaurant not found or not active.' })
  async findItems(
    @Query('category') category?: string,
    @Query('search') search?: string,
  ): Promise<CustomApiResponse<PublicMenuItemResponse[]>> {
    const items = await this.menuItemsService.findPublicScoped({ category, search });
    return { success: true, data: items.map(toPublicMenuItemResponse) };
  }
}
