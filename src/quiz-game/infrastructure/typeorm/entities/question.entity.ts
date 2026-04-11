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

  @Column({ default: false })
  declare published: boolean;

  @OneToMany(() => CorrectAnswer, (correctAnswer) => correctAnswer.question, {
    cascade: true,
  })
  declare correctAnswers: Relation<CorrectAnswer[]>;

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
