import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'questions' })
export class Question {
  @PrimaryGeneratedColumn('identity')
  declare id: number;

  @Column()
  declare body: string;

  @Column()
  declare published: boolean;

  @CreateDateColumn('timestamptz')
  declare createdAt: Date;

  @UpdateDateColumn('timestamptz')
  declare updatedAt: Date;

  @DeleteDateColumn('timestamptz')
  declare deletedAt: Date;
}
