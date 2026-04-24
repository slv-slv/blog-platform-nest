import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { GamesRepository } from '../../infrastructure/typeorm/games.repository.js';
import { GameFinisher } from '../services/game-finisher.js';

export class FinishExpiredGamesCommand extends Command<void> {
  constructor() {
    super();
  }
}

@CommandHandler(FinishExpiredGamesCommand)
export class FinishExpiredGamesUseCase implements ICommandHandler<FinishExpiredGamesCommand> {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly gamesRepository: GamesRepository,
    private readonly gameFinisher: GameFinisher,
  ) {}

  async execute(): Promise<void> {
    const currentTime = new Date();
    const gameIds = await this.gamesRepository.findExpiredGameIds(currentTime);

    for (const gameId of gameIds) {
      await this.dataSource.transaction(async (manager) => {
        const game = await this.gamesRepository.findExpiredGameByIdWithLock(
          gameId.toString(),
          currentTime,
          manager,
        );

        if (!game || game.secondPlayerId === null) {
          return;
        }

        await this.gameFinisher.finish(game, manager);
      });
    }
  }
}
