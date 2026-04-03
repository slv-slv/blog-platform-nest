import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBlogIdIndexForPosts1775237186177 implements MigrationInterface {
    name = 'AddBlogIdIndexForPosts1775237186177'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_55d9c167993fed3f375391c8e3" ON "typeorm"."posts" ("blogId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "typeorm"."IDX_55d9c167993fed3f375391c8e3"`);
    }

}
