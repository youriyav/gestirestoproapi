import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { QuerySalesDto } from './dto/query-sales.dto';
import { Sale } from './entities/sale.entity';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { User } from '@modules/auth/decorators/user.decorator';
import { User as UserEntity } from '@modules/users/users.entity';
import { USER_ROLES } from '@shared/enums/user-roles';
import { ApiResponse as CustomApiResponse } from '@shared/types';

@ApiTags('sales')
@Controller('sales')
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @Roles(USER_ROLES.SUPER_ADMIN, USER_ROLES.OWNER, USER_ROLES.CASHIER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a sale, printed at the cashier — idempotent by clientId' })
  @ApiResponse({ status: 201, description: 'The sale has been recorded (or already existed).' })
  @ApiResponse({ status: 400, description: 'Invalid payload, or table not found in this restaurant.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async create(
    @Body() createSaleDto: CreateSaleDto,
    @User() user: Partial<UserEntity>,
  ): Promise<CustomApiResponse<Sale>> {
    const sale = await this.salesService.create(createSaleDto, user.id!);
    return { success: true, data: sale };
  }

  @Get()
  @Roles(USER_ROLES.SUPER_ADMIN, USER_ROLES.OWNER)
  @ApiOperation({ summary: "List the caller's own restaurant's sales, filterable by day and cashier" })
  @ApiResponse({ status: 200, description: 'Return paginated sales.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async findAll(@Query() query: QuerySalesDto): Promise<
    CustomApiResponse<{
      data: Sale[];
      meta: { total: number; page: number; limit: number; totalPages: number };
    }>
  > {
    const result = await this.salesService.findAll(query);
    return { success: true, data: result };
  }
}
