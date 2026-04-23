import { MigrationInterface, QueryRunner } from "typeorm";

export class SetNullableForPlayerAnswer1776965832190 implements MigrationInterface {
    name = 'SetNullableForPlayerAnswer1776965832190'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "typeorm"."player_answers" ALTER COLUMN "answer" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "typeorm"."player_answers" ALTER COLUMN "answer" SET NOT NULL`);
    }

}
