import {
  Column,
  CreateDateColumn,
  Entity,
  ForeignKey,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { GameStatus } from '../../../types/game.types.js';
import { GameQuestion } from './game-question.entity.js';

@Entity({ name: 'games' })
export class Game {
  @PrimaryGeneratedColumn('identity')
  declare id: number;

  @ForeignKey('users', 'id')
  @Column()
  declare firstPlayerId: number;

  @ForeignKey('users', 'id')
  @Column({ nullable: true, default: null })
  declare secondPlayerId: number;

  @OneToMany(() => GameQuestion, (gameQuestion) => gameQuestion.game)
  declare questionEntries: Relation<GameQuestion[]>;

  @Column({ type: 'enum', enum: GameStatus, default: GameStatus.pending })
  declare status: GameStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  declare pairCreatedDate: Date;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  declare startGameDate: Date | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  declare finishGameDate: Date | null;
}
