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
  NotEnoughQuestionsToStartGameDomainException,
  SecondPlayerAlreadyJoinedDomainException,
} from '../../../../common/exceptions/domain-exceptions.js';
import { Question } from './question.entity.js';

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

  @OneToMany(() => GameQuestion, (gameQuestion) => gameQuestion.game, { cascade: true })
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

  startGame(secondPlayerId: number, questions: Question[], requiredQuestionsCount: number): void {
    if (this.status !== GameStatus.pending) {
      throw new GameIsNotPendingDomainException();
    }

    if (this.firstPlayerId === secondPlayerId) {
      throw new CannotJoinOwnGameDomainException();
    }

    if (this.secondPlayerId !== null) {
      throw new SecondPlayerAlreadyJoinedDomainException();
    }

    if (questions.length < requiredQuestionsCount) {
      throw new NotEnoughQuestionsToStartGameDomainException(requiredQuestionsCount);
    }

    this.secondPlayerId = secondPlayerId;

    this.questionEntries = questions.map((question, index) => {
      const entry = new GameQuestion();

      entry.game = this;
      entry.question = question;
      entry.questionNumber = index + 1;

      return entry;
    });

    this.status = GameStatus.active;
    this.startGameDate = new Date();
  }

  finishGame(): void {
    this.status = GameStatus.finished;
    this.finishGameDate = new Date();
  }
}
