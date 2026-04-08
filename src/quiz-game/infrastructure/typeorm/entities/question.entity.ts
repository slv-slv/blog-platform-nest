import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { CorrectAnswer } from './correct-answer.entity.js';

@Entity({ name: 'questions' })
export class Question {
  @PrimaryGeneratedColumn('identity')
  declare id: number;

  @Column()
  declare body: string;

  @Column()
  declare published: boolean;

  @OneToMany(() => CorrectAnswer, (correctAnswer) => correctAnswer.question)
  declare correctAnswers: Relation<CorrectAnswer[]>;

  @CreateDateColumn('timestamptz')
  declare createdAt: Date;

  @UpdateDateColumn('timestamptz')
  declare updatedAt: Date;

  @DeleteDateColumn('timestamptz')
  declare deletedAt: Date;
}
