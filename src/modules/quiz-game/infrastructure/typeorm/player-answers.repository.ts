import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { PlayerAnswer } from './entities/player-answer.entity.js';
import { AnswerStatus, PlayerAnswerStats } from '../../types/player-answer.types.js';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';
import {
  GameNotFoundDomainException,
  QuestionNotFoundDomainException,
  UnauthorizedDomainException,
} from '../../../../common/exceptions/domain-exceptions.js';

@Injectable()
export class PlayerAnswersRepository {
  async submitAnswer(
    gameId: string,
    userId: string,
    questionId: string,
    answer: string,
    status: AnswerStatus,
    points: number,
    manager: EntityManager,
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

    const playerAnswerEntityRepository = manager.getRepository(PlayerAnswer);

    const newAnswer = playerAnswerEntityRepository.create({
      gameId: +gameId,
      questionId: +questionId,
      userId: +userId,
      answer,
      status,
      points,
    });

    return playerAnswerEntityRepository.save(newAnswer);
  }

  async getPlayerAnswerStats(
    gameId: string,
    userId: string,
    manager: EntityManager,
  ): Promise<PlayerAnswerStats> {
    if (!isPositiveIntegerString(gameId)) {
      throw new GameNotFoundDomainException();
    }

    if (!isPositiveIntegerString(userId)) {
      throw new UnauthorizedDomainException();
    }

    const playerAnswerEntityRepository = manager.getRepository(PlayerAnswer);

    const result = await playerAnswerEntityRepository
      .createQueryBuilder('pa')
      .select(`COUNT(*)::int`, 'answersCount')
      .addSelect(`COUNT(*) FILTER (WHERE pa.status = :correctStatus)::int`, 'correctAnswersCount')
      .addSelect('MAX(pa.addedAt)', 'lastAnswerAt')
      .where('pa.gameId = :gameId', { gameId: +gameId })
      .andWhere('pa.userId = :userId', { userId: +userId })
      .setParameter('correctStatus', AnswerStatus.correct)
      .getRawOne<{ answersCount: number; correctAnswersCount: number; lastAnswerAt: Date | null }>();

    return {
      answersCount: result?.answersCount ?? 0,
      correctAnswersCount: result?.correctAnswersCount ?? 0,
      lastAnswerAt: result?.lastAnswerAt ?? null,
    };
  }

  async setBonus(gameId: string, userId: string, bonus: number, manager: EntityManager): Promise<void> {
    if (!isPositiveIntegerString(gameId)) {
      throw new GameNotFoundDomainException();
    }

    if (!isPositiveIntegerString(userId)) {
      throw new UnauthorizedDomainException();
    }

    const playerAnswerEntityRepository = manager.getRepository(PlayerAnswer);

    const lastAnswer = await playerAnswerEntityRepository.findOne({
      where: { gameId: +gameId, userId: +userId },
      order: { addedAt: 'DESC' },
    });

    if (!lastAnswer) return;

    lastAnswer.points += bonus;
    await playerAnswerEntityRepository.save(lastAnswer);
  }
}
