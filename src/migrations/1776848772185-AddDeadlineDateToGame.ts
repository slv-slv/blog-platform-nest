import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeadlineDateToGame1776848772185 implements MigrationInterface {
    name = 'AddDeadlineDateToGame1776848772185'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "typeorm"."games" ADD "deadlineDate" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "typeorm"."games" DROP COLUMN "deadlineDate"`);
    }

}
