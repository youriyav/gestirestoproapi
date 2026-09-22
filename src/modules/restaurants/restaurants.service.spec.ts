import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { RestaurantsService } from './restaurants.service';
import { Restaurant, RESTAURANT_PLAN, RESTAURANT_STATUS } from './entities/restaurant.entity';
import { MinioService } from '@modules/storage/minio.service';
import { RESTAURANT_LOGO_UPLOAD_PATH } from './restaurants.constants';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T = any>(): MockRepository<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn((data: unknown) => data),
  save: jest.fn(),
  remove: jest.fn(),
  softDelete: jest.fn(),
});

describe('RestaurantsService', () => {
  let service: RestaurantsService;
  let restaurantRepository: MockRepository<Restaurant>;
  let minioService: { uploadFile: jest.Mock; deleteFile: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantsService,
        { provide: getRepositoryToken(Restaurant), useValue: createMockRepository() },
        { provide: MinioService, useValue: { uploadFile: jest.fn(), deleteFile: jest.fn() } },
      ],
    }).compile();

    service = module.get<RestaurantsService>(RestaurantsService);
    restaurantRepository = module.get(getRepositoryToken(Restaurant));
    minioService = module.get(MinioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('saves the restaurant with a client-supplied, available slug as-is', async () => {
      restaurantRepository.findOne!.mockResolvedValue(null);
      restaurantRepository.save!.mockImplementation((entity: unknown) => Promise.resolve(entity));

      const result = await service.create({ name: 'Le Bangui Chic', slug: 'le-bangui-chic' } as never);

      expect(result.slug).toBe('le-bangui-chic');
    });

    it('rejects a client-supplied slug that is already taken', async () => {
      restaurantRepository.findOne!.mockResolvedValue({ id: 'existing', slug: 'le-bangui-chic' });

      await expect(
        service.create({ name: 'Le Bangui Chic', slug: 'le-bangui-chic' } as never),
      ).rejects.toThrow(ConflictException);
      expect(restaurantRepository.save).not.toHaveBeenCalled();
    });

    it('rejects a client-supplied slug that is reserved', async () => {
      await expect(service.create({ name: 'Admin Panel', slug: 'admin' } as never)).rejects.toThrow(
        BadRequestException,
      );
      expect(restaurantRepository.save).not.toHaveBeenCalled();
    });

    it('auto-generates a slug from the name when none is supplied', async () => {
      restaurantRepository.findOne!.mockResolvedValue(null);
      restaurantRepository.save!.mockImplementation((entity: unknown) => Promise.resolve(entity));

      const result = await service.create({ name: 'Le Bangui Chic' } as never);

      expect(result.slug).toBe('le-bangui-chic');
    });

    it('disambiguates an auto-generated slug on collision with a numeric suffix', async () => {
      restaurantRepository.findOne!
        .mockResolvedValueOnce({ id: 'existing-1', slug: 'le-bangui-chic' })
        .mockResolvedValueOnce({ id: 'existing-2', slug: 'le-bangui-chic-2' })
        .mockResolvedValueOnce(null);
      restaurantRepository.save!.mockImplementation((entity: unknown) => Promise.resolve(entity));

      const result = await service.create({ name: 'Le Bangui Chic' } as never);

      expect(result.slug).toBe('le-bangui-chic-3');
    });

    it('skips a reserved word when disambiguating an auto-generated slug', async () => {
      // Name slugifies to exactly a reserved word ("api") — must skip straight to "-2".
      restaurantRepository.findOne!.mockResolvedValue(null);
      restaurantRepository.save!.mockImplementation((entity: unknown) => Promise.resolve(entity));

      const result = await service.create({ name: 'API' } as never);

      expect(result.slug).toBe('api-2');
    });
  });

  describe('update', () => {
    it('leaves plan untouched when it is not part of the update payload', async () => {
      const restaurant = {
        id: '1',
        slug: 'le-bangui-chic',
        plan: RESTAURANT_PLAN.PRO,
        status: RESTAURANT_STATUS.ACTIVE,
      };
      restaurantRepository.findOne!.mockResolvedValue(restaurant);
      restaurantRepository.save!.mockImplementation((entity: unknown) => Promise.resolve(entity));

      const result = await service.update('1', { city: 'Bimbo' } as never);

      expect(result.plan).toBe(RESTAURANT_PLAN.PRO);
      expect(result.mrr).toBe(25000);
    });

    it('rejects renaming the slug to one already taken by another restaurant', async () => {
      const restaurant = { id: '1', slug: 'le-bangui-chic', status: RESTAURANT_STATUS.ACTIVE };
      restaurantRepository.findOne!
        .mockResolvedValueOnce(restaurant) // findEntityOrFail
        .mockResolvedValueOnce({ id: '2', slug: 'le-bangui-chic-nouveau' }); // assertSlugAvailable

      await expect(
        service.update('1', { slug: 'le-bangui-chic-nouveau' } as never),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects renaming the slug to a reserved word', async () => {
      const restaurant = { id: '1', slug: 'le-bangui-chic', status: RESTAURANT_STATUS.ACTIVE };
      restaurantRepository.findOne!.mockResolvedValueOnce(restaurant);

      await expect(service.update('1', { slug: 'www' } as never)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findActiveBySlugOrNotFound', () => {
    it('returns the restaurant when the slug exists and is active', async () => {
      const restaurant = { id: '1', slug: 'le-bangui-chic', status: RESTAURANT_STATUS.ACTIVE };
      restaurantRepository.findOne!.mockResolvedValue(restaurant);

      await expect(service.findActiveBySlugOrNotFound('le-bangui-chic')).resolves.toBe(restaurant);
    });

    it('404s when the slug does not exist', async () => {
      restaurantRepository.findOne!.mockResolvedValue(null);

      await expect(service.findActiveBySlugOrNotFound('unknown')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('404s when the restaurant is still in trial', async () => {
      restaurantRepository.findOne!.mockResolvedValue({
        id: '1',
        slug: 'le-bangui-chic',
        status: RESTAURANT_STATUS.TRIAL,
      });

      await expect(service.findActiveBySlugOrNotFound('le-bangui-chic')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('404s when the restaurant is suspended', async () => {
      restaurantRepository.findOne!.mockResolvedValue({
        id: '1',
        slug: 'le-bangui-chic',
        status: RESTAURANT_STATUS.SUSPENDED,
      });

      await expect(service.findActiveBySlugOrNotFound('le-bangui-chic')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deletes the stored logo before removing a restaurant that has one', async () => {
      const restaurant = { id: '1', logoObjectKey: 'restaurant-logo/old.jpg' };
      restaurantRepository.findOne!.mockResolvedValue(restaurant);
      minioService.deleteFile.mockResolvedValue(undefined);

      await service.remove('1');

      expect(minioService.deleteFile).toHaveBeenCalledWith('1', 'restaurant-logo/old.jpg');
      expect(restaurantRepository.softDelete).toHaveBeenCalledWith('1');
    });

    it('does not call MinIO when the restaurant has no logo', async () => {
      const restaurant = { id: '1', logoObjectKey: null };
      restaurantRepository.findOne!.mockResolvedValue(restaurant);

      await service.remove('1');

      expect(minioService.deleteFile).not.toHaveBeenCalled();
      expect(restaurantRepository.softDelete).toHaveBeenCalledWith('1');
    });
  });

  describe('uploadLogo', () => {
    it('replaces an existing logo and persists the new URL/object key', async () => {
      const restaurant = {
        id: '1',
        logoObjectKey: 'restaurant-logo/old.jpg',
        status: RESTAURANT_STATUS.TRIAL,
        plan: RESTAURANT_PLAN.ESSENTIEL,
      };
      const file = { buffer: Buffer.from(''), originalname: 'new.jpg' } as Express.Multer.File;
      restaurantRepository.findOne!.mockResolvedValue(restaurant);
      restaurantRepository.save!.mockImplementation((entity: unknown) => Promise.resolve(entity));
      minioService.deleteFile.mockResolvedValue(undefined);
      minioService.uploadFile.mockResolvedValue({
        objectKey: 'restaurant-logo/new.jpg',
        url: 'http://minio/1/restaurant-logo/new.jpg',
        size: 10,
        mimeType: 'image/jpeg',
      });

      const result = await service.uploadLogo('1', file);

      expect(minioService.deleteFile).toHaveBeenCalledWith('1', 'restaurant-logo/old.jpg');
      expect(minioService.uploadFile).toHaveBeenCalledWith('1', file, RESTAURANT_LOGO_UPLOAD_PATH);
      expect(restaurantRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          logoUrl: 'http://minio/1/restaurant-logo/new.jpg',
          logoObjectKey: 'restaurant-logo/new.jpg',
        }),
      );
      expect(result.logoUrl).toBe('http://minio/1/restaurant-logo/new.jpg');
    });

    it('does not call deleteFile when there was no existing logo', async () => {
      const restaurant = {
        id: '1',
        logoObjectKey: null,
        status: RESTAURANT_STATUS.TRIAL,
        plan: RESTAURANT_PLAN.ESSENTIEL,
      };
      const file = { buffer: Buffer.from(''), originalname: 'first.jpg' } as Express.Multer.File;
      restaurantRepository.findOne!.mockResolvedValue(restaurant);
      restaurantRepository.save!.mockImplementation((entity: unknown) => Promise.resolve(entity));
      minioService.uploadFile.mockResolvedValue({
        objectKey: 'restaurant-logo/first.jpg',
        url: 'http://minio/1/restaurant-logo/first.jpg',
        size: 10,
        mimeType: 'image/jpeg',
      });

      await service.uploadLogo('1', file);

      expect(minioService.deleteFile).not.toHaveBeenCalled();
    });

    it('still uploads the new logo if deleting the old one fails', async () => {
      const restaurant = {
        id: '1',
        logoObjectKey: 'restaurant-logo/broken.jpg',
        status: RESTAURANT_STATUS.TRIAL,
        plan: RESTAURANT_PLAN.ESSENTIEL,
      };
      const file = { buffer: Buffer.from(''), originalname: 'new.jpg' } as Express.Multer.File;
      restaurantRepository.findOne!.mockResolvedValue(restaurant);
      restaurantRepository.save!.mockImplementation((entity: unknown) => Promise.resolve(entity));
      minioService.deleteFile.mockRejectedValue(new Error('bucket unreachable'));
      minioService.uploadFile.mockResolvedValue({
        objectKey: 'restaurant-logo/new.jpg',
        url: 'http://minio/1/restaurant-logo/new.jpg',
        size: 10,
        mimeType: 'image/jpeg',
      });

      const result = await service.uploadLogo('1', file);

      expect(result.logoObjectKey).toBe('restaurant-logo/new.jpg');
    });

    it('404s when the restaurant does not exist', async () => {
      restaurantRepository.findOne!.mockResolvedValue(null);

      await expect(service.uploadLogo('missing', {} as Express.Multer.File)).rejects.toThrow(
        NotFoundException,
      );
      expect(minioService.uploadFile).not.toHaveBeenCalled();
    });
  });
});
