import {
  Column,
  CreateDateColumn,
  Entity,
  ForeignKey,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { GameStatus } from '../../../types/game.types.js';
import { GameQuestion } from './game-question.entity.js';
import {
  CannotJoinOwnGameDomainException,
  GameIsNotPendingDomainException,
  SecondPlayerAlreadyJoinedDomainException,
} from '../../../../common/exceptions/domain-exceptions.js';

@Entity({ name: 'games' })
export class Game {
  @PrimaryGeneratedColumn('identity')
  declare id: number;

  @ForeignKey('users', 'id')
  @Column()
  declare firstPlayerId: number;

  @ForeignKey('users', 'id')
  @Column('integer', { nullable: true, default: null })
  declare secondPlayerId: number | null;

  @OneToMany(() => GameQuestion, (gameQuestion) => gameQuestion.game)
  declare questionEntries: Relation<GameQuestion[]>;

  @Column({ type: 'enum', enum: GameStatus, default: GameStatus.pending })
  @Index({ unique: true, where: `"status" = 'pending'` })
  declare status: GameStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  declare pairCreatedDate: Date;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  declare startGameDate: Date | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  declare finishGameDate: Date | null;

  // async startGame(userId: number): Promise<Game> {
  //   this.secondPlayerId = userId;

  // }

  joinSecondPlayer(userId: number) {
    if (this.firstPlayerId === userId) {
      throw new CannotJoinOwnGameDomainException();
    }

    if (this.status !== GameStatus.pending) {
      throw new GameIsNotPendingDomainException();
    }

    if (this.secondPlayerId !== null) {
      throw new SecondPlayerAlreadyJoinedDomainException();
    }

    this.secondPlayerId = userId;
  }
}
