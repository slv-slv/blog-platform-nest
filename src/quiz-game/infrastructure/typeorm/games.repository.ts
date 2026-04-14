import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Game } from './entities/game.entity.js';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { GameStatus } from '../../types/game.types.js';
import { Question } from './entities/question.entity.js';
import { quizConfig } from '../../../config/quiz.config.js';
import { AnswerStatus, PlayerAnswer } from './entities/player-answer.entity.js';
import { GameQuestion } from './entities/game-question.entity.js';

@Injectable()
export class GamesRepository {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Game) private readonly gameEntityRepository: Repository<Game>,
    @InjectRepository(GameQuestion) private readonly gameQuestionEntityRepository: Repository<GameQuestion>,
    @InjectRepository(PlayerAnswer) private readonly playerAnswerEntityRepository: Repository<PlayerAnswer>,
    @Inject(quizConfig.KEY) private readonly quiz: ConfigType<typeof quizConfig>,
  ) {}

  async save(game: Game, manager?: EntityManager): Promise<Game> {
    const gameEntityRepository = manager?.getRepository(Game) ?? this.gameEntityRepository;
    return gameEntityRepository.save(game);
  }

  async createGame(userId: number, manager?: EntityManager): Promise<Game> {
    const gameEntityRepository = manager?.getRepository(Game) ?? this.gameEntityRepository;
    const game = gameEntityRepository.create({
      firstPlayerId: userId,
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

  async submitAnswer(gameId: number, userId: number, answer: string): Promise<AnswerStatus | null> {
    const nextQuestion = await this.gameQuestionEntityRepository
      .createQueryBuilder('gq')
      .leftJoin(
        PlayerAnswer,
        'pa',
        `gq."gameId" = pa."gameId"
        AND gq."questionId" = pa."questionId"
        AND pa."userId" = :userId`,
        { userId },
      )
      .leftJoinAndSelect('gq.question', 'q')
      .leftJoinAndSelect('q.correctAnswers', 'ca')
      .where('gq.gameId = :gameId', { gameId })
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
      gameId,
      questionId: nextQuestion.questionId,
      userId,
      answer,
      status,
    });

    return status;
  }
}
