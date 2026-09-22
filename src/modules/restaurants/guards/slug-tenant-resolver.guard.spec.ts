import { ExecutionContext } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { SlugTenantResolverGuard } from './slug-tenant-resolver.guard';
import { RestaurantsService } from '../restaurants.service';
import { TenantContextService } from '@shared/tenant-context/tenant-context.service';

function createExecutionContext(slug: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ params: { slug } }),
    }),
  } as unknown as ExecutionContext;
}

describe('SlugTenantResolverGuard', () => {
  let guard: SlugTenantResolverGuard;
  let restaurantsService: { findActiveBySlugOrNotFound: jest.Mock };
  let tenantContext: { set: jest.Mock };

  beforeEach(() => {
    restaurantsService = { findActiveBySlugOrNotFound: jest.fn() };
    tenantContext = { set: jest.fn() };
    guard = new SlugTenantResolverGuard(
      restaurantsService as unknown as RestaurantsService,
      tenantContext as unknown as TenantContextService,
    );
  });

  it('resolves the restaurant by slug and populates tenant context with its id', async () => {
    restaurantsService.findActiveBySlugOrNotFound.mockResolvedValue({ id: 'restaurant-1' });

    const result = await guard.canActivate(createExecutionContext('le-bangui-chic'));

    expect(restaurantsService.findActiveBySlugOrNotFound).toHaveBeenCalledWith('le-bangui-chic');
    expect(tenantContext.set).toHaveBeenCalledWith({ restaurantId: 'restaurant-1' });
    expect(result).toBe(true);
  });

  it('propagates the 404 for an unknown slug without touching tenant context', async () => {
    restaurantsService.findActiveBySlugOrNotFound.mockRejectedValue(
      new NotFoundException('Restaurant not found'),
    );

    await expect(guard.canActivate(createExecutionContext('unknown'))).rejects.toThrow(
      NotFoundException,
    );
    expect(tenantContext.set).not.toHaveBeenCalled();
  });

  it('propagates the same 404 for a slug that exists but is not active (trial/suspended)', async () => {
    restaurantsService.findActiveBySlugOrNotFound.mockRejectedValue(
      new NotFoundException('Restaurant not found'),
    );

    await expect(guard.canActivate(createExecutionContext('suspended-resto'))).rejects.toThrow(
      NotFoundException,
    );
    expect(tenantContext.set).not.toHaveBeenCalled();
  });
});
