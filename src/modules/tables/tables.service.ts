import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Table } from './entities/table.entity';
import { TableOrderItem } from './entities/table-order-item.entity';
import { User } from '../users/users.entity';
import { Emplacement } from '../emplacements/entities/emplacement.entity';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { AddTableOrderItemDto } from './dto/add-table-order-item.dto';
import { TenantScopedBaseService } from '@shared/services/tenant-scoped-base.service';
import { TenantContextService } from '@shared/tenant-context/tenant-context.service';
import { TABLE_ETAT } from '@shared/enums/table-etat';

export interface AggregatedOrderLine {
  menuItemId: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
}

@Injectable()
export class TablesService extends TenantScopedBaseService<Table> {
  constructor(
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    @InjectRepository(TableOrderItem)
    private readonly orderItemRepository: Repository<TableOrderItem>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Emplacement)
    private readonly emplacementRepository: Repository<Emplacement>,
    tenantContext: TenantContextService,
  ) {
    super(tableRepository, tenantContext);
  }

  async findAll(): Promise<(Table & { orderItems: AggregatedOrderLine[] })[]> {
    const tables = await this.findAllScoped(undefined, {
      order: { createdAt: 'ASC' },
      relations: ['assignedStaff', 'emplacement'],
    });

    const orderItemsByTable = await this.aggregateOrderItemsByTable();

    return tables.map((table) => ({
      ...this.withSafeStaff(table),
      orderItems: orderItemsByTable.get(table.id) ?? [],
    }));
  }

  /**
   * Records one "add this dish to this table" event and derives the table's
   * live order/status from it. Idempotent by clientId so the mobile offline
   * queue can safely retry a submission whose response never made it back.
   */
  async addOrderItem(tableId: string, dto: AddTableOrderItemDto): Promise<TableOrderItem> {
    const restaurantId = this.tenantContext.getRestaurantIdOrThrow();

    const existing = await this.orderItemRepository.findOne({
      where: { restaurantId, clientId: dto.clientId },
    });
    if (existing) {
      return existing;
    }

    const table = await this.findOneScopedOrFail(tableId);

    const item = await this.orderItemRepository.save(
      this.orderItemRepository.create({
        restaurantId,
        tableId,
        clientId: dto.clientId,
        menuItemId: dto.menuItemId ?? null,
        name: dto.name,
        unitPrice: dto.unitPrice,
        quantity: dto.quantity,
      }),
    );

    if (table.etat === TABLE_ETAT.LIBRE || table.etat === TABLE_ETAT.RESERVEE) {
      await this.tableRepository.update({ id: tableId, restaurantId }, { etat: TABLE_ETAT.OCCUPEE });
    }

    return item;
  }

  /** Groups all of the tenant's order-add events by table, then by menu item (or name+unitPrice for custom items), summing quantity. */
  private async aggregateOrderItemsByTable(): Promise<Map<string, AggregatedOrderLine[]>> {
    const items = await this.orderItemRepository.find({
      where: { restaurantId: this.tenantContext.getRestaurantIdOrThrow() },
    });

    const byTable = new Map<string, Map<string, AggregatedOrderLine>>();
    for (const item of items) {
      const lines = byTable.get(item.tableId) ?? new Map<string, AggregatedOrderLine>();
      byTable.set(item.tableId, lines);

      const key = item.menuItemId ?? `custom:${item.name}:${item.unitPrice}`;
      const existingLine = lines.get(key);
      if (existingLine) {
        existingLine.quantity += item.quantity;
      } else {
        lines.set(key, {
          menuItemId: item.menuItemId ?? null,
          name: item.name,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
        });
      }
    }

    const result = new Map<string, AggregatedOrderLine[]>();
    for (const [tableId, lines] of byTable) {
      // A line brought down to 0 (or below) by a decrease/remove delta no
      // longer belongs to the order.
      result.set(tableId, Array.from(lines.values()).filter((line) => line.quantity > 0));
    }
    return result;
  }

  /**
   * Wipes a table's in-progress order and frees the table — a full reset,
   * not a delta, so it gets its own endpoint rather than going through
   * addOrderItem's event log. Hard delete: these are disposable working
   * rows, not a financial record like Sale/Addition.
   */
  async clearOrder(tableId: string): Promise<void> {
    const restaurantId = this.tenantContext.getRestaurantIdOrThrow();
    await this.findOneScopedOrFail(tableId);

    await this.orderItemRepository.delete({ restaurantId, tableId });
    await this.tableRepository.update({ id: tableId, restaurantId }, { etat: TABLE_ETAT.LIBRE });
  }

  async findOne(id: string): Promise<Table> {
    return this.findOneScopedOrFail(id);
  }

  async create(createTableDto: CreateTableDto): Promise<Table> {
    await this.assertStaffBelongsToRestaurant(createTableDto.assignedStaffId);
    await this.assertEmplacementBelongsToRestaurant(createTableDto.emplacementId);
    return this.saveScoped(createTableDto);
  }

  async update(id: string, updateTableDto: UpdateTableDto): Promise<Table> {
    await this.assertStaffBelongsToRestaurant(updateTableDto.assignedStaffId);
    await this.assertEmplacementBelongsToRestaurant(updateTableDto.emplacementId);
    return this.updateScoped(id, updateTableDto);
  }

  async remove(id: string): Promise<void> {
    await this.softDeleteScoped(id);
  }

  /** Never return the raw User relation — only the fields safe to display. */
  private withSafeStaff(table: Table): Table {
    if (table.assignedStaff) {
      table.assignedStaff = {
        id: table.assignedStaff.id,
        first_name: table.assignedStaff.first_name,
        last_name: table.assignedStaff.last_name,
      } as User;
    }
    return table;
  }

  private async assertStaffBelongsToRestaurant(staffId?: string | null): Promise<void> {
    if (!staffId) return;

    const staff = await this.userRepository.findOne({
      where: { id: staffId, restaurantId: this.tenantContext.getRestaurantIdOrThrow() },
    });

    if (!staff) {
      throw new BadRequestException('Assigned staff member not found in this restaurant');
    }
  }

  private async assertEmplacementBelongsToRestaurant(emplacementId?: string | null): Promise<void> {
    if (!emplacementId) return;

    const emplacement = await this.emplacementRepository.findOne({
      where: { id: emplacementId, restaurantId: this.tenantContext.getRestaurantIdOrThrow() },
    });

    if (!emplacement) {
      throw new BadRequestException('Emplacement not found in this restaurant');
    }
  }
}
