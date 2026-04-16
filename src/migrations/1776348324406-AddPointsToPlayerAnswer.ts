import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPointsToPlayerAnswer1776348324406 implements MigrationInterface {
    name = 'AddPointsToPlayerAnswer1776348324406'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "typeorm"."game_questions" DROP CONSTRAINT "CHK_e55b49a9ff5f49bf8b6e60d04a"`);
        await queryRunner.query(`ALTER TABLE "typeorm"."player_answers" ADD "points" integer NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_932418ef509f5926b1a00be0b0" ON "typeorm"."games" ("status") WHERE "status" = 'pending'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "typeorm"."IDX_932418ef509f5926b1a00be0b0"`);
        await queryRunner.query(`ALTER TABLE "typeorm"."player_answers" DROP COLUMN "points"`);
        await queryRunner.query(`ALTER TABLE "typeorm"."game_questions" ADD CONSTRAINT "CHK_e55b49a9ff5f49bf8b6e60d04a" CHECK ((("questionNumber" >= 1) AND ("questionNumber" <= 5)))`);
    }

}
