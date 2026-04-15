import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { GamesRepository } from '../../infrastructure/typeorm/games.repository.js';
import { QuestionsRepository } from '../../infrastructure/typeorm/questions.repository.js';
import { Inject } from '@nestjs/common';
import { quizConfig } from '../../../config/quiz.config.js';
import { ConfigType } from '@nestjs/config';
import { isPositiveIntegerString } from '../../../common/helpers/is-positive-integer-string.js';
import {
  AccessDeniedDomainException,
  UnauthorizedDomainException,
} from '../../../common/exceptions/domain-exceptions.js';
import { GameViewModel } from '../../types/game.types.js';
import { GamesQueryRepository } from '../../infrastructure/typeorm/games.query-repository.js';

export class ConnectUserCommand extends Command<GameViewModel> {
  constructor(public readonly userId: string) {
    super();
  }
}

@CommandHandler(ConnectUserCommand)
export class ConnectUserUseCase implements ICommandHandler<ConnectUserCommand> {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly gamesRepository: GamesRepository,
    private readonly gamesQueryRepository: GamesQueryRepository,
    private readonly questionsRepository: QuestionsRepository,
    @Inject(quizConfig.KEY) private readonly quiz: ConfigType<typeof quizConfig>,
  ) {}
  async execute(command: ConnectUserCommand) {
    if (!isPositiveIntegerString(command.userId)) {
      throw new UnauthorizedDomainException();
    }
    const userId = +command.userId;

    const savedGame = await this.dataSource.transaction(async (manager) => {
      const activeGame = await this.gamesRepository.findActiveGame(command.userId, manager);
      if (activeGame) {
        throw new AccessDeniedDomainException('Current user is already inside active pair');
      }

      const pendingGame = await this.gamesRepository.findPendingGameWithLock(manager);

      if (!pendingGame) {
        return this.gamesRepository.createGame(command.userId, manager);
      }

      const requiredQuestionsCount = this.quiz.questionsCount;
      const questions = await this.questionsRepository.getRandomQuestions(manager, requiredQuestionsCount);

      pendingGame.startGame(userId, questions, requiredQuestionsCount);

      return this.gamesRepository.save(pendingGame, manager);
    });

    return this.gamesQueryRepository.getGameViewModel(savedGame.id);
  }
}
