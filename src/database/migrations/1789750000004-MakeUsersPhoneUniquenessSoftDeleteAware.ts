import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Same soft-delete gap as UQ_emplacements_restaurant_name (see
 * MakeEmplacementNameUniquenessSoftDeleteAware): UQ_users_phone (added by
 * AddUniqueConstraintToUsersPhone for phone+code mobile login) was a plain
 * UNIQUE constraint, so a soft-deleted user would block a new user from
 * reusing their phone number. Replaces it with a partial unique index scoped
 * to active rows.
 */
export class MakeUsersPhoneUniquenessSoftDeleteAware1789750000001 implements MigrationInterface {
  name = 'MakeUsersPhoneUniquenessSoftDeleteAware1789750000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "users_table" DROP CONSTRAINT "UQ_users_phone"
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_users_phone"
            ON "users_table" ("phone")
            WHERE "deletedAt" IS NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "UQ_users_phone"
        `);
    // NOTE: fails if a soft-deleted user now shares a phone with an active
    // one — expected when rolling back onto data created under the new,
    // more permissive rule.
    await queryRunner.query(`
            ALTER TABLE "users_table" ADD CONSTRAINT "UQ_users_phone" UNIQUE ("phone")
        `);
  }
}
