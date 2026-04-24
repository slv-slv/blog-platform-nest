import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { EntityManager } from 'typeorm';
import { quizConfig } from '../../../../config/quiz.config.js';
import { PlayerAnswersRepository } from '../../infrastructure/typeorm/player-answers.repository.js';
import { GamesRepository } from '../../infrastructure/typeorm/games.repository.js';
import { Game } from '../../infrastructure/typeorm/entities/game.entity.js';
import { PlayerAnswerStats } from '../../types/player-answer.types.js';

@Injectable()
export class GameFinisher {
  constructor(
    private readonly gamesRepository: GamesRepository,
    private readonly playerAnswersRepository: PlayerAnswersRepository,
    @Inject(quizConfig.KEY) private readonly quiz: ConfigType<typeof quizConfig>,
  ) {}

  async finish(game: Game, manager: EntityManager): Promise<void> {
    if (game.secondPlayerId === null) {
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
