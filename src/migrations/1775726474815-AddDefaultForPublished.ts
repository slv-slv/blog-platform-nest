import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDefaultForPublished1775726474815 implements MigrationInterface {
    name = 'AddDefaultForPublished1775726474815'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "typeorm"."questions" ALTER COLUMN "published" SET DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "typeorm"."questions" ALTER COLUMN "published" DROP DEFAULT`);
    }

}
