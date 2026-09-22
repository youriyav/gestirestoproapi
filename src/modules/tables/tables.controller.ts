import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { AddTableOrderItemDto } from './dto/add-table-order-item.dto';
import { Table } from './entities/table.entity';
import { TableOrderItem } from './entities/table-order-item.entity';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { USER_ROLES } from '@shared/enums/user-roles';
import { ApiResponse as CustomApiResponse } from '@shared/types';

@ApiTags('tables')
@Controller('tables')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  @Roles(USER_ROLES.SUPER_ADMIN, USER_ROLES.OWNER, USER_ROLES.SERVER, USER_ROLES.CASHIER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all tables in the caller's own restaurant" })
  @ApiResponse({ status: 200, description: 'Return all tables.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin access required.' })
  async findAll(): Promise<CustomApiResponse<Table[]>> {
    const tables = await this.tablesService.findAll();
    return { success: true, data: tables };
  }

  @Post()
  @Roles(USER_ROLES.SUPER_ADMIN, USER_ROLES.OWNER)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new table (Admin only)' })
  @ApiResponse({ status: 201, description: 'The table has been successfully created.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin access required.' })
  async create(@Body() createTableDto: CreateTableDto): Promise<CustomApiResponse<Table>> {
    const table = await this.tablesService.create(createTableDto);
    return { success: true, data: table };
  }

  @Post(':id/order-items')
  @Roles(USER_ROLES.SUPER_ADMIN, USER_ROLES.OWNER, USER_ROLES.SERVER, USER_ROLES.CASHIER)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Add a dish to a table's in-progress order" })
  @ApiParam({ name: 'id', description: 'Table ID (UUID)' })
  @ApiResponse({ status: 201, description: 'The order item has been recorded.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Table not found.' })
  async addOrderItem(
    @Param('id') id: string,
    @Body() addTableOrderItemDto: AddTableOrderItemDto,
  ): Promise<CustomApiResponse<TableOrderItem>> {
    const item = await this.tablesService.addOrderItem(id, addTableOrderItemDto);
    return { success: true, data: item };
  }

  @Post(':id/clear-order')
  @Roles(USER_ROLES.SUPER_ADMIN, USER_ROLES.OWNER, USER_ROLES.SERVER, USER_ROLES.CASHIER)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Wipe a table's in-progress order and free the table" })
  @ApiParam({ name: 'id', description: 'Table ID (UUID)' })
  @ApiResponse({ status: 204, description: 'The order has been cleared and the table freed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Table not found.' })
  async clearOrder(@Param('id') id: string): Promise<void> {
    await this.tablesService.clearOrder(id);
  }

  @Patch(':id')
  @Roles(USER_ROLES.SUPER_ADMIN, USER_ROLES.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a table (Admin only)' })
  @ApiParam({ name: 'id', description: 'Table ID (UUID)' })
  @ApiResponse({ status: 200, description: 'The table has been successfully updated.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin access required.' })
  @ApiResponse({ status: 404, description: 'Table not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateTableDto: UpdateTableDto,
  ): Promise<CustomApiResponse<Table>> {
    const table = await this.tablesService.update(id, updateTableDto);
    return { success: true, data: table };
  }

  @Delete(':id')
  @Roles(USER_ROLES.SUPER_ADMIN, USER_ROLES.OWNER)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a table (Admin only)' })
  @ApiParam({ name: 'id', description: 'Table ID (UUID)' })
  @ApiResponse({ status: 204, description: 'The table has been successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin access required.' })
  @ApiResponse({ status: 404, description: 'Table not found.' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.tablesService.remove(id);
  }
}
