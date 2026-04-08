import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation } from 'typeorm';
import { Question } from './question.entity.js';

@Entity({ name: 'correct_answers' })
export class CorrectAnswer {
  @PrimaryGeneratedColumn('identity')
  declare id: number;

  @ManyToOne(() => Question, (question) => question.correctAnswers, { nullable: false })
  @JoinColumn()
  declare question: Relation<Question>;

  @Column()
  declare answer: string;
}
