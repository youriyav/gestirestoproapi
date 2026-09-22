import { Controller, Get, Header, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle, ThrottlerGuard } from '@nestjs/throttler';
import { RestaurantsService } from './restaurants.service';
import { ApiResponse as CustomApiResponse } from '@shared/types';
import { Public } from '@shared/tenant-context';
import { PublicRestaurantResponse, toPublicRestaurantResponse } from './dto/public-restaurant.response';

/**
 * Public, unauthenticated restaurant info — scanned via QR code alongside
 * PublicMenuController's /r/{slug}/menu. Separate controller/path (not nested
 * under /r/:slug) since it's restaurant info, not menu content.
 */
@ApiTags('public-restaurant')
@Controller('public/restaurants')
@Public()
@UseGuards(ThrottlerGuard)
@SkipThrottle({ default: true }) // only the more permissive 'public' bucket applies here
export class PublicRestaurantController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get(':slug')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  @ApiOperation({ summary: 'Get a restaurant\'s public info by slug (name, address, phone, hours)' })
  @ApiParam({ name: 'slug', description: 'Restaurant slug' })
  @ApiResponse({ status: 200, description: 'Return the restaurant public info.' })
  @ApiResponse({ status: 404, description: 'Restaurant not found or not active.' })
  async findOne(@Param('slug') slug: string): Promise<CustomApiResponse<PublicRestaurantResponse>> {
    const restaurant = await this.restaurantsService.findActiveBySlugOrNotFound(slug);
    return { success: true, data: toPublicRestaurantResponse(restaurant) };
  }
}
