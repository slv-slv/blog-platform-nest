import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { GameQuestion } from './entities/game-question.entity.js';
import { PlayerAnswer } from './entities/player-answer.entity.js';
import { isPositiveIntegerString } from '../../../common/helpers/is-positive-integer-string.js';
import {
  GameNotFoundDomainException,
  NoRemainingQuestionsDomainException,
  UnauthorizedDomainException,
} from '../../../common/exceptions/domain-exceptions.js';

@Injectable()
export class GameQuestionsRepository {
  constructor(
    @InjectRepository(GameQuestion)
    private readonly gameQuestionEntityRepository: Repository<GameQuestion>,
  ) {}

  async getNextQuestion(gameId: string, userId: string, manager?: EntityManager): Promise<GameQuestion> {
    if (!isPositiveIntegerString(gameId)) {
      throw new GameNotFoundDomainException();
    }

    if (!isPositiveIntegerString(userId)) {
      throw new UnauthorizedDomainException();
    }

    const gameQuestionEntityRepository =
      manager?.getRepository(GameQuestion) ?? this.gameQuestionEntityRepository;

    const nextQuestion = await gameQuestionEntityRepository
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
      throw new NoRemainingQuestionsDomainException();
    }

    return nextQuestion;
  }
}
