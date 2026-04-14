import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { GamesRepository } from '../../infrastructure/typeorm/games.repository.js';
import { Game } from '../../infrastructure/typeorm/entities/game.entity.js';
import { QuestionsRepository } from '../../infrastructure/typeorm/questions.repository.js';
import { Inject } from '@nestjs/common';
import { quizConfig } from '../../../config/quiz.config.js';
import { ConfigType } from '@nestjs/config';

export class ConnectUserCommand extends Command<Game> {
  constructor(public readonly userId: string) {
    super();
  }
}

@CommandHandler(ConnectUserCommand)
export class ConnectUserUseCase implements ICommandHandler<ConnectUserCommand> {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly gamesRepository: GamesRepository,
    private readonly questionsRepository: QuestionsRepository,
    @Inject(quizConfig.KEY) private readonly quiz: ConfigType<typeof quizConfig>,
  ) {}
  async execute(command: ConnectUserCommand) {
    return this.dataSource.transaction(async (manager) => {
      const pendingGame = await this.gamesRepository.findPendingGameWithLock(manager);

      if (!pendingGame) {
        return this.gamesRepository.createGame(command.userId, manager);
      }

      const requiredQuestionsCount = this.quiz.questionsCount;
      const questions = await this.questionsRepository.getRandomQuestions(manager, requiredQuestionsCount);

      pendingGame.startGame(command.userId, questions, requiredQuestionsCount);
      return this.gamesRepository.save(pendingGame, manager);
    });
  }
}
