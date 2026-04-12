import { Injectable } from '@nestjs/common';
import { Game } from './entities/game.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameStatus } from '../../types/game.types.js';

@Injectable()
export class GamesRepository {
  constructor(@InjectRepository(Game) private readonly gameEntityRepository: Repository<Game>) {}

  async createGame(userId: number): Promise<Game> {
    const game = this.gameEntityRepository.create({
      firstPlayerId: userId,
      secondPlayerId: null,
      status: GameStatus.pending,
    });
    return this.gameEntityRepository.save(game);
  }
}
