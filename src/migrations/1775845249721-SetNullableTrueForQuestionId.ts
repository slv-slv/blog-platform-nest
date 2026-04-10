import { MigrationInterface, QueryRunner } from "typeorm";

export class SetNullableTrueForQuestionId1775845249721 implements MigrationInterface {
    name = 'SetNullableTrueForQuestionId1775845249721'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "typeorm"."correct_answers" DROP CONSTRAINT "FK_b971cf511fea024a2134cc42abe"`);
        await queryRunner.query(`ALTER TABLE "typeorm"."correct_answers" ALTER COLUMN "questionId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "typeorm"."correct_answers" ADD CONSTRAINT "FK_b971cf511fea024a2134cc42abe" FOREIGN KEY ("questionId") REFERENCES "typeorm"."questions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "typeorm"."correct_answers" DROP CONSTRAINT "FK_b971cf511fea024a2134cc42abe"`);
        await queryRunner.query(`ALTER TABLE "typeorm"."correct_answers" ALTER COLUMN "questionId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "typeorm"."correct_answers" ADD CONSTRAINT "FK_b971cf511fea024a2134cc42abe" FOREIGN KEY ("questionId") REFERENCES "typeorm"."questions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
