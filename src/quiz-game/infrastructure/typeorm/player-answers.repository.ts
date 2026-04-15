import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PlayerAnswer } from './entities/player-answer.entity.js';
import { AnswerStatus } from '../../types/player-answer.types.js';
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
    manager?: EntityManager,
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

    const playerAnswerEntityRepository =
      manager?.getRepository(PlayerAnswer) ?? this.playerAnswerEntityRepository;

    const newAnswer = playerAnswerEntityRepository.create({
      gameId: +gameId,
      questionId: +questionId,
      userId: +userId,
      answer,
      status,
    });

    return playerAnswerEntityRepository.save(newAnswer);
  }

  async countAnswersByPlayer(gameId: string, userId: string, manager?: EntityManager): Promise<number> {
    if (!isPositiveIntegerString(gameId)) {
      throw new GameNotFoundDomainException();
    }

    if (!isPositiveIntegerString(userId)) {
      throw new UnauthorizedDomainException();
    }

    const playerAnswerEntityRepository =
      manager?.getRepository(PlayerAnswer) ?? this.playerAnswerEntityRepository;

    return playerAnswerEntityRepository.countBy({
      gameId: +gameId,
      userId: +userId,
    });
  }
}
