import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { GamesRepository } from '../../infrastructure/typeorm/games.repository.js';
import { PlayerAnswersRepository } from '../../infrastructure/typeorm/player-answers.repository.js';
import { Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { quizConfig } from '../../../../config/quiz.config.js';
import { PlayerAnswerStats } from '../../types/player-answer.types.js';

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
    private readonly playerAnswersRepository: PlayerAnswersRepository,
    @Inject(quizConfig.KEY) private readonly quiz: ConfigType<typeof quizConfig>,
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

        await this.playerAnswersRepository.createRemainingIncorrectAnswers(game, manager);

        const firstPlayerAnswerStats = await this.playerAnswersRepository.getPlayerAnswerStats(
          game.id.toString(),
          game.firstPlayerId.toString(),
          manager,
        );
        const secondPlayerAnswerStats = await this.playerAnswersRepository.getPlayerAnswerStats(
          game.id.toString(),
          game.secondPlayerId.toString(),
          manager,
        );

        const bonusUserId = this.getBonusUserId(
          game.firstPlayerId.toString(),
          firstPlayerAnswerStats,
          game.secondPlayerId.toString(),
          secondPlayerAnswerStats,
        );

        if (bonusUserId) {
          await this.playerAnswersRepository.setBonus(
            game.id.toString(),
            bonusUserId,
            this.quiz.bonusPoints,
            manager,
          );
        }

        game.finishGame();
        await this.gamesRepository.save(game, manager);
      });
    }
  }

  private getBonusUserId(
    firstPlayerId: string,
    firstPlayerAnswerStats: PlayerAnswerStats,
    secondPlayerId: string,
    secondPlayerAnswerStats: PlayerAnswerStats,
  ): string | null {
    if (firstPlayerAnswerStats.lastAnswerAt === null || secondPlayerAnswerStats.lastAnswerAt === null) {
      return null;
    }

    if (firstPlayerAnswerStats.lastAnswerAt === secondPlayerAnswerStats.lastAnswerAt) {
      return null;
    }

    if (
      firstPlayerAnswerStats.lastAnswerAt < secondPlayerAnswerStats.lastAnswerAt &&
      firstPlayerAnswerStats.correctAnswersCount > 0
    ) {
      return firstPlayerId;
    }

    if (
      secondPlayerAnswerStats.lastAnswerAt < firstPlayerAnswerStats.lastAnswerAt &&
      secondPlayerAnswerStats.correctAnswersCount > 0
    ) {
      return secondPlayerId;
    }

    return null;
  }
}
