import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPostIdIndexForComments1775237510648 implements MigrationInterface {
    name = 'AddPostIdIndexForComments1775237510648'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "typeorm"."comments" DROP CONSTRAINT "FK_e44ddaaa6d058cb4092f83ad61f"`);
        await queryRunner.query(`ALTER TABLE "typeorm"."comments" ALTER COLUMN "postId" SET NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_e44ddaaa6d058cb4092f83ad61" ON "typeorm"."comments" ("postId") `);
        await queryRunner.query(`ALTER TABLE "typeorm"."comments" ADD CONSTRAINT "FK_e44ddaaa6d058cb4092f83ad61f" FOREIGN KEY ("postId") REFERENCES "typeorm"."posts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "typeorm"."comments" DROP CONSTRAINT "FK_e44ddaaa6d058cb4092f83ad61f"`);
        await queryRunner.query(`DROP INDEX "typeorm"."IDX_e44ddaaa6d058cb4092f83ad61"`);
        await queryRunner.query(`ALTER TABLE "typeorm"."comments" ALTER COLUMN "postId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "typeorm"."comments" ADD CONSTRAINT "FK_e44ddaaa6d058cb4092f83ad61f" FOREIGN KEY ("postId") REFERENCES "typeorm"."posts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
