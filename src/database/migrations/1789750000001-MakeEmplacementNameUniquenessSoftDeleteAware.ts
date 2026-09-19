import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * UQ_emplacements_restaurant_name was a plain UNIQUE constraint, so it applied
 * to soft-deleted rows too — recreating an emplacement with the same name as
 * one already deleted (deletedAt set) failed with a raw QueryFailedError, even
 * though EmplacementsService.create()'s own pre-check (a findOne(), which
 * TypeORM automatically scopes to deletedAt IS NULL) saw no conflict. Replaces
 * it with a partial unique index that only applies to active rows.
 */
export class MakeEmplacementNameUniquenessSoftDeleteAware1789750000001
  implements MigrationInterface
{
  name = 'MakeEmplacementNameUniquenessSoftDeleteAware1789750000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "emplacements" DROP CONSTRAINT "UQ_emplacements_restaurant_name"
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_emplacements_restaurant_name"
            ON "emplacements" ("restaurant_id", "name")
            WHERE "deletedAt" IS NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "UQ_emplacements_restaurant_name"
        `);
    // NOTE: fails if a soft-deleted row now shares a name with an active one
    // (exactly what this migration exists to allow) — expected when rolling
    // back onto data created under the new, more permissive rule.
    await queryRunner.query(`
            ALTER TABLE "emplacements"
            ADD CONSTRAINT "UQ_emplacements_restaurant_name" UNIQUE ("restaurant_id", "name")
        `);
  }
}
