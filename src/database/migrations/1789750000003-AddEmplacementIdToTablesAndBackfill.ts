import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds a nullable emplacement_id FK on tables (replacing the free-text
 * "emplacement" column, which is dropped in a later migration once this
 * backfill is verified). For every restaurant, each distinct non-empty
 * legacy "emplacement" string becomes a real row in "emplacements", and
 * every table using that string is repointed at it via emplacement_id.
 * Tables with a null/empty "emplacement" are left with a null emplacement_id.
 */
export class AddEmplacementIdToTablesAndBackfill1789750000001 implements MigrationInterface {
  name = 'AddEmplacementIdToTablesAndBackfill1789750000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "tables" ADD COLUMN "emplacement_id" uuid
        `);
    await queryRunner.query(`
            ALTER TABLE "tables"
            ADD CONSTRAINT "FK_tables_emplacement" FOREIGN KEY ("emplacement_id") REFERENCES "emplacements"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            INSERT INTO "emplacements" ("id", "restaurant_id", "name", "order", "createdAt", "updatedAt")
            SELECT
                uuid_generate_v4(),
                grouped."restaurant_id",
                grouped."emplacement",
                (ROW_NUMBER() OVER (PARTITION BY grouped."restaurant_id" ORDER BY grouped."emplacement") - 1)::integer,
                now(),
                now()
            FROM (
                SELECT DISTINCT "restaurant_id", "emplacement"
                FROM "tables"
                WHERE "emplacement" IS NOT NULL AND trim("emplacement") <> ''
            ) AS grouped
        `);

    await queryRunner.query(`
            UPDATE "tables"
            SET "emplacement_id" = "emplacements"."id"
            FROM "emplacements"
            WHERE "emplacements"."restaurant_id" = "tables"."restaurant_id"
              AND "emplacements"."name" = "tables"."emplacement"
              AND "tables"."emplacement" IS NOT NULL
              AND trim("tables"."emplacement") <> ''
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "tables" DROP CONSTRAINT "FK_tables_emplacement"
        `);
    await queryRunner.query(`
            ALTER TABLE "tables" DROP COLUMN "emplacement_id"
        `);
    // Backfilled "emplacements" rows are intentionally left in place — they
    // are indistinguishable from rows a user may have since created by hand.
  }
}
