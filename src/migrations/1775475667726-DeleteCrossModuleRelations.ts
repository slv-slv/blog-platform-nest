import { MigrationInterface, QueryRunner } from "typeorm";

export class DeleteCrossModuleRelations1775475667726 implements MigrationInterface {
    name = 'DeleteCrossModuleRelations1775475667726'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "typeorm"."comments" DROP CONSTRAINT "FK_7e8d7c49f218ebb14314fdb3749"`);
        await queryRunner.query(`ALTER TABLE "typeorm"."comments" ALTER COLUMN "userId" SET NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_7e8d7c49f218ebb14314fdb374" ON "typeorm"."comments" ("userId") `);
        await queryRunner.query(`ALTER TABLE "typeorm"."comments" ADD CONSTRAINT "FK_7e8d7c49f218ebb14314fdb3749" FOREIGN KEY ("userId") REFERENCES "typeorm"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "typeorm"."comments" DROP CONSTRAINT "FK_7e8d7c49f218ebb14314fdb3749"`);
        await queryRunner.query(`DROP INDEX "typeorm"."IDX_7e8d7c49f218ebb14314fdb374"`);
        await queryRunner.query(`ALTER TABLE "typeorm"."comments" ALTER COLUMN "userId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "typeorm"."comments" ADD CONSTRAINT "FK_7e8d7c49f218ebb14314fdb3749" FOREIGN KEY ("userId") REFERENCES "typeorm"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
