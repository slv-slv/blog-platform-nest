import { Injectable } from '@nestjs/common';
import { Game } from './entities/game.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { GameStatus } from '../../types/game.types.js';
import { isPositiveIntegerString } from '../../../common/helpers/is-positive-integer-string.js';
import { UnauthorizedDomainException } from '../../../common/exceptions/domain-exceptions.js';

@Injectable()
export class GamesRepository {
  constructor(@InjectRepository(Game) private readonly gameEntityRepository: Repository<Game>) {}

  async save(game: Game, manager?: EntityManager): Promise<Game> {
    const gameEntityRepository = manager?.getRepository(Game) ?? this.gameEntityRepository;
    return gameEntityRepository.save(game);
  }

  async findActiveGameByUserId(userId: string, manager?: EntityManager): Promise<Game | null> {
    if (!isPositiveIntegerString(userId)) {
      throw new UnauthorizedDomainException();
    }

    const gameEntityRepository = manager?.getRepository(Game) ?? this.gameEntityRepository;

    return gameEntityRepository.findOneBy([
      { firstPlayerId: +userId, status: GameStatus.active },
      { secondPlayerId: +userId, status: GameStatus.active },
    ]);
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

  async acquirePlayerLock(gameId: number, userId: number, manager: EntityManager): Promise<void> {
    await manager.query('SELECT pg_advisory_xact_lock($1, $2)', [gameId, userId]);
  }

  async findPendingGameWithLock(manager: EntityManager): Promise<Game | null> {
    const gameEntityRepository = manager.getRepository(Game);
    return gameEntityRepository.findOne({
      where: { status: GameStatus.pending },
      lock: { mode: 'pessimistic_write' },
    });
  }
}
