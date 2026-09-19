import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drops the legacy free-text "emplacement" column on tables now that
 * emplacement_id (added + backfilled in AddEmplacementIdToTablesAndBackfill)
 * is the source of truth. Run only after manually verifying zero orphans:
 *   SELECT count(*) FROM tables WHERE emplacement IS NOT NULL AND emplacement <> '' AND emplacement_id IS NULL
 * must return 0 before this migration is applied to a database with real data.
 */
export class DropEmplacementColumnFromTables1789750000005 implements MigrationInterface {
  name = 'DropEmplacementColumnFromTables1789750000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "tables" DROP COLUMN "emplacement"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreates an empty column only — the original free-text values are not
    // recoverable once dropped (they were already migrated into "emplacements").
    await queryRunner.query(`
            ALTER TABLE "tables" ADD COLUMN "emplacement" character varying
        `);
  }
}
