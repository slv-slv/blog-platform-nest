import { Check, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm';
import { Game } from './game.entity.js';
import { Question } from './question.entity.js';

@Entity({ name: 'game_questions' })
export class GameQuestion {
  @PrimaryColumn()
  declare gameId: number;

  @PrimaryColumn()
  declare questionId: number;

  @ManyToOne(() => Game)
  @JoinColumn({ name: 'gameId' })
  declare game: Relation<Game>;

  @ManyToOne(() => Question)
  @JoinColumn({ name: 'questionId' })
  declare question: Relation<Question>;

  @Column({ type: 'smallint' })
  @Check('"questionNumber" >= 1 AND "questionNumber" <= 5')
  declare questionNumber: number;
}
