import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../../../app.module.js';
import { SortDirection } from '../../../../common/types/paging-params.types.js';
import { quizConfig } from '../../../../config/quiz.config.js';
import { EmailService } from '../../../notifications/email/email.service.js';
import { UsersRepository } from '../../../user-accounts/infrastructure/typeorm/users.repository.js';
import { GameQuestion } from '../../infrastructure/typeorm/entities/game-question.entity.js';
import { Game } from '../../infrastructure/typeorm/entities/game.entity.js';
import { PlayerAnswer } from '../../infrastructure/typeorm/entities/player-answer.entity.js';
import { QuestionsRepository } from '../../infrastructure/typeorm/questions.repository.js';
import { GameStatus, GamesSortBy } from '../../types/game.types.js';
import { AnswerStatus } from '../../types/player-answer.types.js';
import { GetMyGamesQuery, GetMyGamesUseCase } from './get-my-games.use-case.js';

describe('GetMyGamesUseCase Integration', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let usersRepository: UsersRepository;
  let questionsRepository: QuestionsRepository;
  let gameEntityRepository: Repository<Game>;
  let gameQuestionEntityRepository: Repository<GameQuestion>;
  let playerAnswerEntityRepository: Repository<PlayerAnswer>;
  let getMyGamesUseCase: GetMyGamesUseCase;
  let bonusPoints: number;

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
    getMyGamesUseCase = app.get(GetMyGamesUseCase);
    bonusPoints = app.get<{ bonusPoints: number }>(quizConfig.KEY).bonusPoints;
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

  it('should return empty paginated result when user has no games', async () => {
    const user = await createUser('player');

    const result = await getMyGamesUseCase.execute(
      new GetMyGamesQuery(user.id, {
        pagingParams: {
          sortBy: GamesSortBy.pairCreatedDate,
          sortDirection: SortDirection.desc,
          pageNumber: 1,
          pageSize: 10,
        },
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

  it('should return only current user games with pagination and nested progress', async () => {
    const player = await createUser('player');
    const firstOpponent = await createUser('first-opponent');
    const secondOpponent = await createUser('second-opponent');
    const thirdOpponent = await createUser('third-opponent');
    const outsider = await createUser('outsider');

    const [firstQuestion, secondQuestion] = await createQuestions();

    await createGame({
      firstPlayerId: +thirdOpponent.id,
      secondPlayerId: +player.id,
      status: GameStatus.active,
      pairCreatedDate: new Date('2026-01-01T10:00:00.000Z'),
      startGameDate: new Date('2026-01-01T10:01:00.000Z'),
      questions: [firstQuestion, secondQuestion],
      answers: [
        {
          questionId: firstQuestion.id,
          userId: +thirdOpponent.id,
          status: AnswerStatus.correct,
          points: 1,
          addedAt: new Date('2026-01-01T10:02:00.000Z'),
        },
      ],
    });

    const finishedGame = await createGame({
      firstPlayerId: +player.id,
      secondPlayerId: +secondOpponent.id,
      status: GameStatus.finished,
      pairCreatedDate: new Date('2026-01-01T11:00:00.000Z'),
      startGameDate: new Date('2026-01-01T11:01:00.000Z'),
      finishGameDate: new Date('2026-01-01T11:10:00.000Z'),
      questions: [firstQuestion, secondQuestion],
      answers: [
        {
          questionId: firstQuestion.id,
          userId: +player.id,
          status: AnswerStatus.correct,
          points: 1,
          addedAt: new Date('2026-01-01T11:02:00.000Z'),
        },
        {
          questionId: secondQuestion.id,
          userId: +player.id,
          status: AnswerStatus.incorrect,
          points: 0,
          addedAt: new Date('2026-01-01T11:03:00.000Z'),
        },
        {
          questionId: firstQuestion.id,
          userId: +secondOpponent.id,
          status: AnswerStatus.correct,
          points: 2,
          addedAt: new Date('2026-01-01T11:04:00.000Z'),
        },
      ],
    });

    const pendingGame = await createGame({
      firstPlayerId: +player.id,
      secondPlayerId: null,
      status: GameStatus.pending,
      pairCreatedDate: new Date('2026-01-01T12:00:00.000Z'),
    });

    await createGame({
      firstPlayerId: +outsider.id,
      secondPlayerId: +firstOpponent.id,
      status: GameStatus.finished,
      pairCreatedDate: new Date('2026-01-01T13:00:00.000Z'),
      startGameDate: new Date('2026-01-01T13:01:00.000Z'),
      finishGameDate: new Date('2026-01-01T13:10:00.000Z'),
      questions: [firstQuestion],
    });

    const result = await getMyGamesUseCase.execute(
      new GetMyGamesQuery(player.id, {
        pagingParams: {
          sortBy: GamesSortBy.pairCreatedDate,
          sortDirection: SortDirection.desc,
          pageNumber: 1,
          pageSize: 2,
        },
      }),
    );

    expect(result.pagesCount).toBe(2);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(2);
    expect(result.totalCount).toBe(3);
    expect(result.items.map((game) => game.id)).toEqual([
      pendingGame.id.toString(),
      finishedGame.id.toString(),
    ]);

    expect(result.items[0]).toEqual({
      id: pendingGame.id.toString(),
      firstPlayerProgress: {
        answers: [],
        player: {
          id: player.id,
          login: player.login,
        },
        score: 0,
      },
      secondPlayerProgress: null,
      questions: null,
      status: 'PendingSecondPlayer',
      pairCreatedDate: '2026-01-01T12:00:00.000Z',
      startGameDate: null,
      finishGameDate: null,
    });

    expect(result.items[1]).toEqual({
      id: finishedGame.id.toString(),
      firstPlayerProgress: {
        answers: [
          {
            questionId: firstQuestion.id.toString(),
            answerStatus: 'Correct',
            addedAt: '2026-01-01T11:02:00.000Z',
          },
          {
            questionId: secondQuestion.id.toString(),
            answerStatus: 'Incorrect',
            addedAt: '2026-01-01T11:03:00.000Z',
          },
        ],
        player: {
          id: player.id,
          login: player.login,
        },
        score: 1,
      },
      secondPlayerProgress: {
        answers: [
          {
            questionId: firstQuestion.id.toString(),
            answerStatus: 'Correct',
            addedAt: '2026-01-01T11:04:00.000Z',
          },
        ],
        player: {
          id: secondOpponent.id,
          login: secondOpponent.login,
        },
        score: 2,
      },
      questions: [
        {
          id: firstQuestion.id.toString(),
          body: firstQuestion.body,
        },
        {
          id: secondQuestion.id.toString(),
          body: secondQuestion.body,
        },
      ],
      status: 'Finished',
      pairCreatedDate: '2026-01-01T11:00:00.000Z',
      startGameDate: '2026-01-01T11:01:00.000Z',
      finishGameDate: '2026-01-01T11:10:00.000Z',
    });
  });

  it('should finish expired active games before returning my games', async () => {
    const player = await createUser('player');
    const opponent = await createUser('opponent');
    const [firstQuestion, secondQuestion] = await createQuestions();

    const expiredGame = await createGame({
      firstPlayerId: +player.id,
      secondPlayerId: +opponent.id,
      status: GameStatus.active,
      pairCreatedDate: new Date('2026-01-01T10:00:00.000Z'),
      startGameDate: new Date('2026-01-01T10:01:00.000Z'),
      deadlineDate: new Date(Date.now() - 1_000),
      questions: [firstQuestion, secondQuestion],
      answers: [
        {
          questionId: firstQuestion.id,
          userId: +player.id,
          status: AnswerStatus.correct,
          points: 1,
          addedAt: new Date('2026-01-01T10:02:00.000Z'),
        },
        {
          questionId: secondQuestion.id,
          userId: +player.id,
          status: AnswerStatus.correct,
          points: 1,
          addedAt: new Date('2026-01-01T10:03:00.000Z'),
        },
      ],
    });

    const result = await getMyGamesUseCase.execute(
      new GetMyGamesQuery(player.id, {
        pagingParams: {
          sortBy: GamesSortBy.pairCreatedDate,
          sortDirection: SortDirection.desc,
          pageNumber: 1,
          pageSize: 10,
        },
      }),
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe(expiredGame.id.toString());
    expect(result.items[0].status).toBe('Finished');
    expect(result.items[0].finishGameDate).not.toBeNull();
    expect(result.items[0].firstPlayerProgress.score).toBe(2 + bonusPoints);
    expect(result.items[0].secondPlayerProgress!.score).toBe(0);
    expect(result.items[0].secondPlayerProgress!.answers).toHaveLength(2);
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

  async function createQuestions() {
    const firstQuestion = await questionsRepository.createQuestion('First question body', ['first-answer']);
    const secondQuestion = await questionsRepository.createQuestion('Second question body', [
      'second-answer',
    ]);

    return [firstQuestion, secondQuestion];
  }

  async function createGame(params: {
    firstPlayerId: number;
    secondPlayerId: number | null;
    status: GameStatus;
    pairCreatedDate: Date;
    startGameDate?: Date;
    finishGameDate?: Date;
    deadlineDate?: Date;
    questions?: { id: number }[];
    answers?: {
      questionId: number;
      userId: number;
      status: AnswerStatus;
      points: number;
      addedAt: Date;
    }[];
  }) {
    const game = await gameEntityRepository.save(
      gameEntityRepository.create({
        firstPlayerId: params.firstPlayerId,
        secondPlayerId: params.secondPlayerId,
        status: params.status,
        pairCreatedDate: params.pairCreatedDate,
        startGameDate: params.startGameDate ?? null,
        finishGameDate: params.finishGameDate ?? null,
        deadlineDate: params.deadlineDate ?? null,
      }),
    );

    if (params.questions) {
      await gameQuestionEntityRepository.save(
        params.questions.map((question, index) =>
          gameQuestionEntityRepository.create({
            gameId: game.id,
            questionId: question.id,
            questionNumber: index + 1,
          }),
        ),
      );
    }

    if (params.answers) {
      await playerAnswerEntityRepository.save(
        params.answers.map((answer) =>
          playerAnswerEntityRepository.create({
            gameId: game.id,
            questionId: answer.questionId,
            userId: answer.userId,
            answer: 'fixture-answer',
            status: answer.status,
            points: answer.points,
            addedAt: answer.addedAt,
          }),
        ),
      );
    }

    return game;
  }
});
