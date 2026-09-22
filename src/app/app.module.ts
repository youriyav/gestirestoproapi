import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { BullModule } from '@nestjs/bullmq';
import { UsersModule } from 'src/modules/users/users.module';
import { User } from 'src/modules/users/users.entity';
import { AuthModule } from 'src/modules/auth/auth.module';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { AuditLogsModule } from 'src/modules/audit-logs/audit-logs.module';
import { AuditLog } from 'src/modules/audit-logs/entities/audit-log.entity';
import { MailModule } from 'src/modules/mail/mail.module';
import { StorageModule } from 'src/modules/storage/storage.module';
import { PasswordResetToken } from 'src/modules/auth/entities/password-reset-token.entity';
import { MenuModule } from 'src/modules/menu/menu.module';
import { MenuCategory } from 'src/modules/menu/entities/menu-category.entity';
import { MenuItem } from 'src/modules/menu/entities/menu-item.entity';
import { ProspectsModule } from 'src/modules/prospects/prospects.module';
import { DemoRequest } from 'src/modules/prospects/entities/demo-request.entity';
import { RestaurantsModule } from 'src/modules/restaurants/restaurants.module';
import { Restaurant } from 'src/modules/restaurants/entities/restaurant.entity';
import { TablesModule } from 'src/modules/tables/tables.module';
import { Table } from 'src/modules/tables/entities/table.entity';
import { TableOrderItem } from 'src/modules/tables/entities/table-order-item.entity';
import { EmplacementsModule } from 'src/modules/emplacements/emplacements.module';
import { Emplacement } from 'src/modules/emplacements/entities/emplacement.entity';
import { SalesModule } from 'src/modules/sales/sales.module';
import { Sale } from 'src/modules/sales/entities/sale.entity';
import { SaleItem } from 'src/modules/sales/entities/sale-item.entity';
import { AdditionsModule } from 'src/modules/additions/additions.module';
import { Addition } from 'src/modules/additions/entities/addition.entity';
import { AdditionItem } from 'src/modules/additions/entities/addition-item.entity';
import { SettingsModule } from 'src/modules/settings/settings.module';
import { AppSetting } from 'src/modules/settings/entities/app-setting.entity';
import { TenantContextModule } from '@shared/tenant-context/tenant-context.module';
import { TenantContextGuard } from '@shared/tenant-context/guards/tenant-context.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '1h';
        return {
          secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
          signOptions: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            expiresIn: expiresIn as any,
          },
        };
      },
      inject: [ConfigService],
    }),
    // BullMQ configuration for mail queue
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD', ''),
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          type: 'postgres',
          host: config.get<string>('DB_HOST'),
          port: config.get<number>('DB_PORT'),
          username: config.get<string>('DB_USER'),
          password: config.get<string>('DB_PASSWORD'),
          database: config.get<string>('DB_NAME'),
          entities: [
            User,
            AuditLog,
            PasswordResetToken,
            MenuCategory,
            MenuItem,
            DemoRequest,
            Restaurant,
            Table,
            TableOrderItem,
            Emplacement,
            Sale,
            SaleItem,
            Addition,
            AdditionItem,
            AppSetting,
          ],
          migrations: [__dirname + 'database/migration/**/*{.js,.ts}'],
          migrationsRun: false,
          migrationsTableName: 'migrations',
          migrationsTransactionMode: 'all',
          synchronize: false,
          logging: true,
        };
      },
    }),
    // Registered but NOT wired as a global APP_GUARD — only POST
    // /auth/login-phone opts in via @UseGuards(ThrottlerGuard), since a
    // 4-digit access code has far less entropy than a password and needs
    // brute-force protection the rest of the API doesn't currently have.
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 5 }]),
    TenantContextModule,
    // Modules
    AuditLogsModule,
    MailModule,
    UsersModule,
    AuthModule,
    StorageModule,
    MenuModule,
    ProspectsModule,
    RestaurantsModule,
    TablesModule,
    EmplacementsModule,
    SalesModule,
    AdditionsModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Order matters: authenticate, then populate tenant context, then check role.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: TenantContextGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
