import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAccountsModule } from '../user-accounts/user-accounts.module.js';
import { CreateQuestionUseCase } from './application/use-cases/create-question.use-case.js';
import { UpdateQuestionUseCase } from './application/use-cases/update-question.use-case.js';
import { DeleteQuestionUseCase } from './application/use-cases/delete-question.use-case.js';
import { PublishQuestionUseCase } from './application/use-cases/publish-question.use-case.js';
import { GetQuestionsUseCase } from './application/use-cases/get-questions.use-case.js';
import { GetCurrentGameUseCase } from './application/use-cases/get-current-game.use-case.js';
import { GetGameByIdUseCase } from './application/use-cases/get-game-by-id.use-case.js';
import { GetMyGamesUseCase } from './application/use-cases/get-my-games.use-case.js';
import { GetMyStatisticUseCase } from './application/use-cases/get-my-statistic.use-case.js';
import { GetTopPlayersUseCase } from './application/use-cases/get-top-players.use-case.js';
import { ConnectUserUseCase } from './application/use-cases/connect-user.use-case.js';
import { SubmitAnswerUseCase } from './application/use-cases/submit-answer.use-case.js';
import { FinishExpiredGamesUseCase } from './application/use-cases/finish-expired-games.use-case.js';
import { QuestionsRepository } from './infrastructure/typeorm/questions.repository.js';
import { Question } from './infrastructure/typeorm/entities/question.entity.js';
import { CorrectAnswer } from './infrastructure/typeorm/entities/correct-answer.entity.js';
import { QuestionsController } from './api/questions.controller.js';
import { QuestionsQueryRepository } from './infrastructure/typeorm/questions.query-repository.js';
import { Game } from './infrastructure/typeorm/entities/game.entity.js';
import { GameQuestion } from './infrastructure/typeorm/entities/game-question.entity.js';
import { PlayerAnswer } from './infrastructure/typeorm/entities/player-answer.entity.js';
import { GamesRepository } from './infrastructure/typeorm/games.repository.js';
import { GamesQueryRepository } from './infrastructure/typeorm/games.query-repository.js';
import { GameQuestionsRepository } from './infrastructure/typeorm/game-questions.repository.js';
import { PlayerAnswersRepository } from './infrastructure/typeorm/player-answers.repository.js';
import { PairsController } from './api/pairs.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Question, CorrectAnswer, Game, GameQuestion, PlayerAnswer]),
    UserAccountsModule,
  ],
  providers: [
    QuestionsRepository,
    CreateQuestionUseCase,
    UpdateQuestionUseCase,
    DeleteQuestionUseCase,
    PublishQuestionUseCase,
    GetQuestionsUseCase,
    GetCurrentGameUseCase,
    GetGameByIdUseCase,
    GetMyGamesUseCase,
    GetMyStatisticUseCase,
    GetTopPlayersUseCase,
    ConnectUserUseCase,
    SubmitAnswerUseCase,
    FinishExpiredGamesUseCase,
    QuestionsQueryRepository,
    GamesRepository,
    GamesQueryRepository,
    GameQuestionsRepository,
    PlayerAnswersRepository,
  ],
  controllers: [QuestionsController, PairsController],
})
export class QuizGameModule {}
