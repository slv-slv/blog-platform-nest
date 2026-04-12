import { Column, CreateDateColumn, Entity, ForeignKey, PrimaryColumn } from 'typeorm';
import { GameQuestion } from './game-question.entity.js';

export enum AnswerStatus {
  correct = 'correct',
  incorrect = 'incorrect',
}

@ForeignKey(() => GameQuestion, ['gameId', 'questionId'], ['gameId', 'questionId'])
@Entity({ name: 'player_answers' })
export class PlayerAnswer {
  @PrimaryColumn()
  declare gameId: number;

  @PrimaryColumn()
  declare questionId: number;

  @PrimaryColumn()
  @ForeignKey('users', 'id')
  declare userId: number;

  @Column()
  declare answer: string;

  @Column({ type: 'enum', enum: AnswerStatus })
  declare status: AnswerStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  declare addedAt: Date;
}
