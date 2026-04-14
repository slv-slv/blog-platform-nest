import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnswerStatus, PlayerAnswer } from './entities/player-answer.entity.js';
import { isPositiveIntegerString } from '../../../common/helpers/is-positive-integer-string.js';
import {
  GameNotFoundDomainException,
  QuestionNotFoundDomainException,
  UnauthorizedDomainException,
} from '../../../common/exceptions/domain-exceptions.js';

@Injectable()
export class PlayerAnswersRepository {
  constructor(
    @InjectRepository(PlayerAnswer)
    private readonly playerAnswerEntityRepository: Repository<PlayerAnswer>,
  ) {}

  async submitAnswer(
    gameId: string,
    userId: string,
    questionId: string,
    answer: string,
    status: AnswerStatus,
  ): Promise<PlayerAnswer> {
    if (!isPositiveIntegerString(gameId)) {
      throw new GameNotFoundDomainException();
    }

    if (!isPositiveIntegerString(userId)) {
      throw new UnauthorizedDomainException();
    }

    if (!isPositiveIntegerString(questionId)) {
      throw new QuestionNotFoundDomainException();
    }

    const newAnswer = this.playerAnswerEntityRepository.create({
      gameId: +gameId,
      questionId: +questionId,
      userId: +userId,
      answer,
      status,
    });

    return this.playerAnswerEntityRepository.save(newAnswer);
  }
}
