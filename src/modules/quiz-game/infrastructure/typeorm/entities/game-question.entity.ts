import { Check, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation, Unique } from 'typeorm';
import { Game } from './game.entity.js';
import { Question } from './question.entity.js';

@Entity({ name: 'game_questions' })
@Unique(['gameId', 'questionNumber'])
export class GameQuestion {
  @PrimaryColumn()
  declare gameId: number;

  @PrimaryColumn()
  declare questionId: number;

  @Column({ type: 'smallint' })
  declare questionNumber: number;

  @ManyToOne(() => Game, (game) => game.questionEntries)
  @JoinColumn({ name: 'gameId' })
  declare game: Relation<Game>;

  @ManyToOne(() => Question)
  @JoinColumn({ name: 'questionId' })
  declare question: Relation<Question>;
}
