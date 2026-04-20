import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../../../app.module.js';
import { SortDirection } from '../../../../common/types/paging-params.types.js';
import { EmailService } from '../../../notifications/email/email.service.js';
import { UsersRepository } from '../../../user-accounts/infrastructure/typeorm/users.repository.js';
import { GameQuestion } from '../../infrastructure/typeorm/entities/game-question.entity.js';
import { Game } from '../../infrastructure/typeorm/entities/game.entity.js';
import { PlayerAnswer } from '../../infrastructure/typeorm/entities/player-answer.entity.js';
import { QuestionsRepository } from '../../infrastructure/typeorm/questions.repository.js';
import { GameStatus, PlayerStatisticSortBy } from '../../types/game.types.js';
import { AnswerStatus } from '../../types/player-answer.types.js';
import { GetTopPlayersQuery, GetTopPlayersUseCase } from './get-top-players.use-case.js';

describe('GetTopPlayersUseCase Integration', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let usersRepository: UsersRepository;
  let questionsRepository: QuestionsRepository;
  let gameEntityRepository: Repository<Game>;
  let gameQuestionEntityRepository: Repository<GameQuestion>;
  let playerAnswerEntityRepository: Repository<PlayerAnswer>;
  let getTopPlayersUseCase: GetTopPlayersUseCase;

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
    getTopPlayersUseCase = app.get(GetTopPlayersUseCase);
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

  it('should return empty paginated result when there are no top players', async () => {
    const result = await getTopPlayersUseCase.execute(
      new GetTopPlayersQuery({
        sort: [
          [PlayerStatisticSortBy.avgScores, SortDirection.desc],
          [PlayerStatisticSortBy.sumScore, SortDirection.desc],
        ],
        pageNumber: 1,
        pageSize: 10,
      }),
    );

    expect(result).toEqual({
      pagesCount: 0,
      page: 1,
      pageSize: 10,
      totalCount: 0,
      items: [],
    });
  });

  it('should calculate top players from finished games with sorting and pagination', async () => {
    const alice = await createUser('alice');
    const bob = await createUser('bob');
    const carol = await createUser('carol');
    const activeOpponent = await createUser('active-opponent');

    await createGameWithScores({
      firstPlayerId: +alice.id,
      secondPlayerId: +bob.id,
      firstPlayerScore: 3,
      secondPlayerScore: 1,
      status: GameStatus.finished,
    });
    await createGameWithScores({
      firstPlayerId: +alice.id,
      secondPlayerId: +carol.id,
      firstPlayerScore: 1,
      secondPlayerScore: 5,
      status: GameStatus.finished,
    });
    await createGameWithScores({
      firstPlayerId: +bob.id,
      secondPlayerId: +carol.id,
      firstPlayerScore: 2,
      secondPlayerScore: 2,
      status: GameStatus.finished,
    });
    await createGameWithScores({
      firstPlayerId: +alice.id,
      secondPlayerId: +activeOpponent.id,
      firstPlayerScore: 100,
      secondPlayerScore: 0,
      status: GameStatus.active,
    });

    const firstPage = await getTopPlayersUseCase.execute(
      new GetTopPlayersQuery({
        sort: [
          [PlayerStatisticSortBy.avgScores, SortDirection.desc],
          [PlayerStatisticSortBy.sumScore, SortDirection.desc],
        ],
        pageNumber: 1,
        pageSize: 2,
      }),
    );

    expect(firstPage).toEqual({
      pagesCount: 2,
      page: 1,
      pageSize: 2,
      totalCount: 3,
      items: [
        {
          sumScore: 7,
          avgScores: 3.5,
          gamesCount: 2,
          winsCount: 1,
          lossesCount: 0,
          drawsCount: 1,
          player: {
            id: carol.id,
            login: carol.login,
          },
        },
        {
          sumScore: 4,
          avgScores: 2,
          gamesCount: 2,
          winsCount: 1,
          lossesCount: 1,
          drawsCount: 0,
          player: {
            id: alice.id,
            login: alice.login,
          },
        },
      ],
    });

    const secondPage = await getTopPlayersUseCase.execute(
      new GetTopPlayersQuery({
        sort: [
          [PlayerStatisticSortBy.avgScores, SortDirection.desc],
          [PlayerStatisticSortBy.sumScore, SortDirection.desc],
        ],
        pageNumber: 2,
        pageSize: 2,
      }),
    );

    expect(secondPage).toEqual({
      pagesCount: 2,
      page: 2,
      pageSize: 2,
      totalCount: 3,
      items: [
        {
          sumScore: 3,
          avgScores: 1.5,
          gamesCount: 2,
          winsCount: 0,
          lossesCount: 1,
          drawsCount: 1,
          player: {
            id: bob.id,
            login: bob.login,
          },
        },
      ],
    });
  });

  it('should keep total count when requested page has no items', async () => {
    const alice = await createUser('alice');
    const bob = await createUser('bob');

    await createGameWithScores({
      firstPlayerId: +alice.id,
      secondPlayerId: +bob.id,
      firstPlayerScore: 1,
      secondPlayerScore: 0,
      status: GameStatus.finished,
    });

    const result = await getTopPlayersUseCase.execute(
      new GetTopPlayersQuery({
        sort: [
          [PlayerStatisticSortBy.avgScores, SortDirection.desc],
          [PlayerStatisticSortBy.sumScore, SortDirection.desc],
        ],
        pageNumber: 2,
        pageSize: 10,
      }),
    );

    expect(result).toEqual({
      pagesCount: 1,
      page: 2,
      pageSize: 10,
      totalCount: 2,
      items: [],
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
