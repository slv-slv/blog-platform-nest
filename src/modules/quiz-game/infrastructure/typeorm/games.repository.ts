import { Injectable } from '@nestjs/common';
import { Game } from './entities/game.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { GameStatus } from '../../types/game.types.js';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';
import { UnauthorizedDomainException } from '../../../../common/exceptions/domain-exceptions.js';

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
}
