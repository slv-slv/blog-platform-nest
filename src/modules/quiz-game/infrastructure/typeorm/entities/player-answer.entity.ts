import { Column, CreateDateColumn, Entity, ForeignKey, PrimaryColumn } from 'typeorm';
import { GameQuestion } from './game-question.entity.js';
import { AnswerStatus } from '../../../types/player-answer.types.js';

@Entity({ name: 'player_answers' })
@ForeignKey(() => GameQuestion, ['gameId', 'questionId'], ['gameId', 'questionId'])
export class PlayerAnswer {
  @PrimaryColumn()
  declare gameId: number;

  @PrimaryColumn()
  declare questionId: number;

  @PrimaryColumn()
  @ForeignKey('users', 'id')
  declare userId: number;

  @Column({ type: 'text', nullable: true })
  declare answer: string | null;

  @Column({ type: 'enum', enum: AnswerStatus })
  declare status: AnswerStatus;

  @Column({ type: 'integer' })
  declare points: number;

  @CreateDateColumn({ type: 'timestamptz' })
  declare addedAt: Date;
}
