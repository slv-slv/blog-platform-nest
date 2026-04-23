import { Injectable } from '@nestjs/common';
import { Game } from './entities/game.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, LessThanOrEqual, Not, Repository } from 'typeorm';
import { GameStatus } from '../../types/game.types.js';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';
import {
  GameNotFoundDomainException,
  UnauthorizedDomainException,
} from '../../../../common/exceptions/domain-exceptions.js';
import { PlayerAnswer } from './entities/player-answer.entity.js';

@Injectable()
export class GamesRepository {
  constructor(@InjectRepository(Game) private readonly gameEntityRepository: Repository<Game>) {}

  async save(game: Game, manager?: EntityManager): Promise<Game> {
    const gameEntityRepository = manager?.getRepository(Game) ?? this.gameEntityRepository;
    return gameEntityRepository.save(game);
  }

  async findActiveGame(userId: string, manager: EntityManager): Promise<Game | null> {
    if (!isPositiveIntegerString(userId)) {
      throw new UnauthorizedDomainException();
    }

    const gameEntityRepository = manager.getRepository(Game);

    return gameEntityRepository.findOne({
      where: [
        { firstPlayerId: +userId, status: GameStatus.active },
        { secondPlayerId: +userId, status: GameStatus.active },
      ],
    });
  }

  async findActiveGameWithLock(userId: string, manager: EntityManager): Promise<Game | null> {
    if (!isPositiveIntegerString(userId)) {
      throw new UnauthorizedDomainException();
    }

    const gameEntityRepository = manager.getRepository(Game);

    return gameEntityRepository.findOne({
      where: [
        { firstPlayerId: +userId, status: GameStatus.active },
        { secondPlayerId: +userId, status: GameStatus.active },
      ],
      lock: { mode: 'pessimistic_write' },
    });
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

  async setDeadline(gameId: string, deadlineDate: Date, manager: EntityManager): Promise<void> {
    if (!isPositiveIntegerString(gameId)) {
      throw new GameNotFoundDomainException();
    }

    const gameEntityRepository = manager.getRepository(Game);
    const result = await gameEntityRepository.update({ id: +gameId }, { deadlineDate });
    if (result.affected === 0) {
      throw new GameNotFoundDomainException();
    }
  }

  async findDeadlineForPlayer(
    gameId: string,
    userId: string,
    requiredAnswersCount: number,
    manager: EntityManager,
  ): Promise<Date | null> {
    if (!isPositiveIntegerString(gameId)) {
      throw new GameNotFoundDomainException();
    }

    if (!isPositiveIntegerString(userId)) {
      throw new UnauthorizedDomainException();
    }

    const gameEntityRepository = manager.getRepository(Game);
    const playerAnswerEntityRepository = manager.getRepository(PlayerAnswer);

    const game = await gameEntityRepository.findOneBy([
      { id: +gameId, firstPlayerId: +userId, status: GameStatus.active },
      { id: +gameId, secondPlayerId: +userId, status: GameStatus.active },
    ]);

    if (!game) {
      throw new GameNotFoundDomainException();
    }

    if (!game.deadlineDate) {
      return null;
    }

    if (game.secondPlayerId === null) {
      return null;
    }

    const currentPlayerId = +userId;
    const anotherPlayerId = game.firstPlayerId === currentPlayerId ? game.secondPlayerId : game.firstPlayerId;

    const currentPlayerAnswersCount = await playerAnswerEntityRepository.countBy({
      gameId: +gameId,
      userId: currentPlayerId,
    });
    const anotherPlayerAnswersCount = await playerAnswerEntityRepository.countBy({
      gameId: +gameId,
      userId: anotherPlayerId,
    });

    if (
      currentPlayerAnswersCount < requiredAnswersCount &&
      anotherPlayerAnswersCount === requiredAnswersCount
    ) {
      return game.deadlineDate;
    }

    return null;
  }

  async findGamesWithExpiredDeadline(manager: EntityManager): Promise<Game[]> {
    const gameEntityRepository = manager.getRepository(Game);

    return gameEntityRepository.find({
      where: { status: GameStatus.active, deadlineDate: LessThanOrEqual(new Date()) },
      lock: { mode: 'pessimistic_write' },
    });
  }
}
