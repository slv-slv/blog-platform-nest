import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Game } from './entities/game.entity.js';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { GameStatus } from '../../types/game.types.js';
import { Question } from './entities/question.entity.js';
import { quizConfig } from '../../../config/quiz.config.js';

@Injectable()
export class GamesRepository {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Game) private readonly gameEntityRepository: Repository<Game>,
    @Inject(quizConfig.KEY) private readonly quiz: ConfigType<typeof quizConfig>,
  ) {}

  async createGame(userId: number): Promise<Game> {
    const game = this.gameEntityRepository.create({
      firstPlayerId: userId,
      secondPlayerId: null,
      status: GameStatus.pending,
    });
    return this.gameEntityRepository.save(game);
  }

  async connectUserToGame(userId: number): Promise<Game> {
    const pendingGame = await this.dataSource.transaction(async (manager) => {
      const gameEntityRepository = manager.getRepository(Game);
      const questionEntityRepository = manager.getRepository(Question);

      const pendingGame = await gameEntityRepository.findOne({
        where: { status: GameStatus.pending },
        lock: { mode: 'pessimistic_write' },
      });

      if (!pendingGame) {
        return null;
      }

      const questions = await questionEntityRepository
        .createQueryBuilder('q')
        .where('q.published = true')
        .orderBy('RANDOM()')
        .limit(this.quiz.questionsCount)
        .getMany();

      pendingGame.joinSecondPlayer(userId);
      pendingGame.startGame(questions, this.quiz.questionsCount);

      return gameEntityRepository.save(pendingGame);
    });

    if (!pendingGame) {
      return this.createGame(userId);
    }

    return pendingGame;
  }
}
