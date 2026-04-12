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
import { GameQuestion } from './game-question.entity.js';

@Entity({ name: 'questions' })
export class Question {
  @PrimaryGeneratedColumn('identity')
  declare id: number;

  @Column()
  declare body: string;

  @Column({ default: false })
  declare published: boolean;

  @OneToMany(() => CorrectAnswer, (correctAnswer) => correctAnswer.question, {
    cascade: true,
  })
  declare correctAnswers: Relation<CorrectAnswer[]>;

  // @OneToMany(() => GameQuestion, (gameQuestion) => gameQuestion.question)
  // declare gameQuestions: Relation<GameQuestion[]>;

  @CreateDateColumn({ type: 'timestamptz' })
  declare createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  declare updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  declare deletedAt: Date;

  setPublishedStatus(published: boolean): void {
    this.published = published;
  }
}
