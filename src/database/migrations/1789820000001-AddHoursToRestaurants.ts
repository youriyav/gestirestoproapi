import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Free-text opening hours (e.g. "Lun-Dim : 08h-22h"), shown on the public
 * menu page. No structured per-day schedule model — out of scope for the
 * public menu feature this column exists for.
 */
export class AddHoursToRestaurants1789820000001 implements MigrationInterface {
  name = 'AddHoursToRestaurants1789820000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "restaurants" ADD COLUMN "hours" character varying
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "restaurants" DROP COLUMN "hours"
        `);
  }
}
