import { Injectable } from '@nestjs/common';
import { Game } from './entities/game.entity.js';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { GameStatus } from '../../types/game.types.js';
import { AnswerStatus, PlayerAnswer } from './entities/player-answer.entity.js';
import { GameQuestion } from './entities/game-question.entity.js';
import { isPositiveIntegerString } from '../../../common/helpers/is-positive-integer-string.js';
import {
  GameNotFoundDomainException,
  UnauthorizedDomainException,
} from '../../../common/exceptions/domain-exceptions.js';

@Injectable()
export class GamesRepository {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Game) private readonly gameEntityRepository: Repository<Game>,
    @InjectRepository(GameQuestion) private readonly gameQuestionEntityRepository: Repository<GameQuestion>,
    @InjectRepository(PlayerAnswer) private readonly playerAnswerEntityRepository: Repository<PlayerAnswer>,
  ) {}

  async save(game: Game, manager?: EntityManager): Promise<Game> {
    const gameEntityRepository = manager?.getRepository(Game) ?? this.gameEntityRepository;
    return gameEntityRepository.save(game);
  }

  async createGame(userId: string, manager?: EntityManager): Promise<Game> {
    if (!isPositiveIntegerString(userId)) {
      throw new UnauthorizedDomainException();
    }

    const gameEntityRepository = manager?.getRepository(Game) ?? this.gameEntityRepository;
    const game = gameEntityRepository.create({
      firstPlayerId: +userId,
      secondPlayerId: null,
      status: GameStatus.pending,
    });
    return gameEntityRepository.save(game);
  }

  async findPendingGameWithLock(manager: EntityManager): Promise<Game | null> {
    const gameEntityRepository = manager.getRepository(Game);
    return gameEntityRepository.findOne({
      where: { status: GameStatus.pending },
      lock: { mode: 'pessimistic_write' },
    });
  }

  async submitAnswer(gameId: string, userId: string, answer: string): Promise<AnswerStatus | null> {
    if (!isPositiveIntegerString(gameId)) {
      throw new GameNotFoundDomainException();
    }

    if (!isPositiveIntegerString(userId)) {
      throw new UnauthorizedDomainException();
    }

    const nextQuestion = await this.gameQuestionEntityRepository
      .createQueryBuilder('gq')
      .leftJoin(
        PlayerAnswer,
        'pa',
        `gq."gameId" = pa."gameId"
        AND gq."questionId" = pa."questionId"
        AND pa."userId" = :userId`,
        { userId: +userId },
      )
      .leftJoinAndSelect('gq.question', 'q')
      .leftJoinAndSelect('q.correctAnswers', 'ca')
      .where('gq.gameId = :gameId', { gameId: +gameId })
      .andWhere('pa.questionId IS NULL')
      .orderBy('gq.questionNumber', 'ASC')
      .getOne();

    if (!nextQuestion) {
      return null;
    }

    const isCorrect = nextQuestion.question.correctAnswers.some(
      (correctAnswer) => correctAnswer.answer === answer,
    );

    const status = isCorrect ? AnswerStatus.correct : AnswerStatus.incorrect;

    await this.playerAnswerEntityRepository.insert({
      gameId: +gameId,
      questionId: nextQuestion.questionId,
      userId: +userId,
      answer,
      status,
    });

    return status;
  }
}
