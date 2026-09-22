import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Same soft-delete gap as UQ_emplacements_restaurant_name / UQ_users_phone
 * (see MakeEmplacementNameUniquenessSoftDeleteAware /
 * MakeUsersPhoneUniquenessSoftDeleteAware): UQ_restaurants_slug was a plain
 * UNIQUE constraint, so a soft-deleted restaurant permanently blocks its slug
 * from ever being reused — a real problem once the public menu QR feature
 * makes slugs a customer-facing, expected-to-be-reclaimable resource.
 */
export class MakeRestaurantSlugUniquenessSoftDeleteAware1789820000000
  implements MigrationInterface
{
  name = 'MakeRestaurantSlugUniquenessSoftDeleteAware1789820000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "restaurants" DROP CONSTRAINT "UQ_restaurants_slug"
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_restaurants_slug"
            ON "restaurants" ("slug")
            WHERE "deletedAt" IS NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "UQ_restaurants_slug"
        `);
    // NOTE: fails if a soft-deleted restaurant now shares a slug with an
    // active one — expected when rolling back onto data created under the
    // new, more permissive rule.
    await queryRunner.query(`
            ALTER TABLE "restaurants" ADD CONSTRAINT "UQ_restaurants_slug" UNIQUE ("slug")
        `);
  }
}
