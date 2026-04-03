import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserIdIndexForDevices1775236460512 implements MigrationInterface {
    name = 'AddUserIdIndexForDevices1775236460512'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_e8a5d59f0ac3040395f159507c" ON "typeorm"."devices" ("userId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "typeorm"."IDX_e8a5d59f0ac3040395f159507c"`);
    }

}
