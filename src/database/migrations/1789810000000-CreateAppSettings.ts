import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the app_settings table — a singleton table (a single row) holding
 * app-wide settings editable by a Super Admin, starting with the commercial
 * WhatsApp number used on the public landing page.
 */
export class CreateAppSettings1789810000000 implements MigrationInterface {
  name = 'CreateAppSettings1789810000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "app_settings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "createdBy" uuid,
                "updatedBy" uuid,
                "deletedBy" uuid,
                "whatsappNumber" character varying NOT NULL,
                CONSTRAINT "PK_app_settings" PRIMARY KEY ("id")
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "app_settings"
        `);
  }
}
