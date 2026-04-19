import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../../../app.module.js';
import { EmailService } from '../../../notifications/email/email.service.js';
import { UsersRepository } from '../../../user-accounts/infrastructure/typeorm/users.repository.js';
import { GameQuestion } from '../../infrastructure/typeorm/entities/game-question.entity.js';
import { Game } from '../../infrastructure/typeorm/entities/game.entity.js';
import { PlayerAnswer } from '../../infrastructure/typeorm/entities/player-answer.entity.js';
import { QuestionsRepository } from '../../infrastructure/typeorm/questions.repository.js';
import { GameStatus } from '../../types/game.types.js';
import { AnswerStatus } from '../../types/player-answer.types.js';
import { GetMyStatisticQuery, GetMyStatisticUseCase } from './get-my-statistic.use-case.js';

describe('GetMyStatisticUseCase Integration', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let usersRepository: UsersRepository;
  let questionsRepository: QuestionsRepository;
  let gameEntityRepository: Repository<Game>;
  let gameQuestionEntityRepository: Repository<GameQuestion>;
  let playerAnswerEntityRepository: Repository<PlayerAnswer>;
  let getMyStatisticUseCase: GetMyStatisticUseCase;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue({ sendConfirmationCode: () => {}, sendRecoveryCode: () => {} })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
    usersRepository = app.get(UsersRepository);
    questionsRepository = app.get(QuestionsRepository);
    gameEntityRepository = dataSource.getRepository(Game);
    gameQuestionEntityRepository = dataSource.getRepository(GameQuestion);
    playerAnswerEntityRepository = dataSource.getRepository(PlayerAnswer);
    getMyStatisticUseCase = app.get(GetMyStatisticUseCase);
  }, 30000);

  beforeEach(async () => {
    await dataSource.query(`
      TRUNCATE
        typeorm.player_answers,
        typeorm.game_questions,
        typeorm.games,
        typeorm.correct_answers,
        typeorm.questions,
        typeorm.devices,
        typeorm.users
      RESTART IDENTITY CASCADE
    `);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should return zero statistic when user has no finished games', async () => {
    const user = await createUser('player');

    const result = await getMyStatisticUseCase.execute(new GetMyStatisticQuery(user.id));

    expect(result).toEqual({
      sumScore: 0,
      avgScores: 0,
      gamesCount: 0,
      winsCount: 0,
      lossesCount: 0,
      drawsCount: 0,
    });
  });

  it('should calculate score, average, wins, losses and draws for finished games only', async () => {
    const player = await createUser('player');
    const firstOpponent = await createUser('first-opponent');
    const secondOpponent = await createUser('second-opponent');
    const thirdOpponent = await createUser('third-opponent');
    const activeGameOpponent = await createUser('active-opponent');

    await createGameWithScores({
      firstPlayerId: +player.id,
      secondPlayerId: +firstOpponent.id,
      firstPlayerScore: 5,
      secondPlayerScore: 3,
      status: GameStatus.finished,
    });
    await createGameWithScores({
      firstPlayerId: +secondOpponent.id,
      secondPlayerId: +player.id,
      firstPlayerScore: 4,
      secondPlayerScore: 1,
      status: GameStatus.finished,
    });
    await createGameWithScores({
      firstPlayerId: +player.id,
      secondPlayerId: +thirdOpponent.id,
      firstPlayerScore: 2,
      secondPlayerScore: 2,
      status: GameStatus.finished,
    });
    await createGameWithScores({
      firstPlayerId: +player.id,
      secondPlayerId: +activeGameOpponent.id,
      firstPlayerScore: 100,
      secondPlayerScore: 0,
      status: GameStatus.active,
    });

    const result = await getMyStatisticUseCase.execute(new GetMyStatisticQuery(player.id));

    expect(result).toEqual({
      sumScore: 8,
      avgScores: 2.67,
      gamesCount: 3,
      winsCount: 1,
      lossesCount: 1,
      drawsCount: 1,
    });
  });

  async function createUser(login: string) {
    return usersRepository.createUser({
      login,
      email: `${login}@example.com`,
      hash: `${login}-hash`,
      createdAt: new Date(),
      confirmation: {
        isConfirmed: true,
        code: null,
        expiration: null,
      },
      passwordRecovery: {
        code: null,
        expiration: null,
      },
    });
  }

  async function createGameWithScores(params: {
    firstPlayerId: number;
    secondPlayerId: number;
    firstPlayerScore: number;
    secondPlayerScore: number;
    status: GameStatus;
  }) {
    const question = await questionsRepository.createQuestion(
      `Question for ${params.firstPlayerId}-${params.secondPlayerId}`,
      ['correct-answer'],
    );
    const game = await gameEntityRepository.save(
      gameEntityRepository.create({
        firstPlayerId: params.firstPlayerId,
        secondPlayerId: params.secondPlayerId,
        status: params.status,
        startGameDate: new Date(),
        finishGameDate: params.status === GameStatus.finished ? new Date() : null,
      }),
    );

    await gameQuestionEntityRepository.save(
      gameQuestionEntityRepository.create({
        gameId: game.id,
        questionId: question.id,
        questionNumber: 1,
      }),
    );

    await playerAnswerEntityRepository.save([
      playerAnswerEntityRepository.create({
        gameId: game.id,
        questionId: question.id,
        userId: params.firstPlayerId,
        answer: 'fixture-answer',
        status: params.firstPlayerScore > 0 ? AnswerStatus.correct : AnswerStatus.incorrect,
        points: params.firstPlayerScore,
      }),
      playerAnswerEntityRepository.create({
        gameId: game.id,
        questionId: question.id,
        userId: params.secondPlayerId,
        answer: 'fixture-answer',
        status: params.secondPlayerScore > 0 ? AnswerStatus.correct : AnswerStatus.incorrect,
        points: params.secondPlayerScore,
      }),
    ]);
  }
});
