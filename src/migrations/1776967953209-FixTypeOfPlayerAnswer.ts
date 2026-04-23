import { MigrationInterface, QueryRunner } from "typeorm";

export class FixTypeOfPlayerAnswer1776967953209 implements MigrationInterface {
    name = 'FixTypeOfPlayerAnswer1776967953209'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "typeorm"."player_answers" DROP COLUMN "answer"`);
        await queryRunner.query(`ALTER TABLE "typeorm"."player_answers" ADD "answer" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "typeorm"."player_answers" DROP COLUMN "answer"`);
        await queryRunner.query(`ALTER TABLE "typeorm"."player_answers" ADD "answer" character varying`);
    }

}
