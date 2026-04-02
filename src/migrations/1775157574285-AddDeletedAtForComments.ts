import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeletedAtForComments1775157574285 implements MigrationInterface {
    name = 'AddDeletedAtForComments1775157574285'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "typeorm"."comments" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "typeorm"."comments" DROP COLUMN "deletedAt"`);
    }

}
