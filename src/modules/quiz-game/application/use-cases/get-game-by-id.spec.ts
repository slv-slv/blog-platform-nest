import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../../../app.module.js';
import { AccessDeniedDomainException } from '../../../../common/exceptions/domain-exceptions.js';
import { quizConfig } from '../../../../config/quiz.config.js';
import { EmailService } from '../../../notifications/email/email.service.js';
import { UsersRepository } from '../../../user-accounts/infrastructure/typeorm/users.repository.js';
import { QuestionsRepository } from '../../infrastructure/typeorm/questions.repository.js';
import { ConnectUserCommand, ConnectUserUseCase } from './connect-user.use-case.js';
import { GetGameByIdQuery, GetGameByIdUseCase } from './get-game-by-id.use-case.js';
import { SubmitAnswerCommand, SubmitAnswerUseCase } from './submit-answer.use-case.js';

describe('GetGameByIdUseCase Integration', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let usersRepository: UsersRepository;
  let questionsRepository: QuestionsRepository;
  let connectUserUseCase: ConnectUserUseCase;
  let getGameByIdUseCase: GetGameByIdUseCase;
  let submitAnswerUseCase: SubmitAnswerUseCase;
  let questionsCount: number;

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
    connectUserUseCase = app.get(ConnectUserUseCase);
    getGameByIdUseCase = app.get(GetGameByIdUseCase);
    submitAnswerUseCase = app.get(SubmitAnswerUseCase);
    questionsCount = app.get<{ questionsCount: number }>(quizConfig.KEY).questionsCount;
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

  it('should return pending game view model for first player', async () => {
    const firstPlayer = await createUser('first-player');

    const createdGame = await connectUserUseCase.execute(new ConnectUserCommand(firstPlayer.id));

    const result = await getGameByIdUseCase.execute(new GetGameByIdQuery(createdGame.id, firstPlayer.id));

    expect(result).toEqual({
      id: createdGame.id,
      firstPlayerProgress: {
        answers: [],
        player: {
          id: firstPlayer.id,
          login: firstPlayer.login,
        },
        score: 0,
      },
      secondPlayerProgress: null,
      questions: null,
      status: 'PendingSecondPlayer',
      pairCreatedDate: createdGame.pairCreatedDate,
      startGameDate: null,
      finishGameDate: null,
    });
  });

  it('should return active game view model for participant', async () => {
    const firstPlayer = await createUser('first-player');
    const secondPlayer = await createUser('second-player');
    const publishedQuestionBodies = await createPublishedQuestions(questionsCount);

    const pendingGame = await connectUserUseCase.execute(new ConnectUserCommand(firstPlayer.id));
    const startedGame = await connectUserUseCase.execute(new ConnectUserCommand(secondPlayer.id));

    const result = await getGameByIdUseCase.execute(new GetGameByIdQuery(startedGame.id, secondPlayer.id));

    expect(startedGame.id).toBe(pendingGame.id);
    expect(result.id).toBe(startedGame.id);
    expect(result.status).toBe('Active');
    expect(result.firstPlayerProgress).toEqual({
      answers: [],
      player: {
        id: firstPlayer.id,
        login: firstPlayer.login,
      },
      score: 0,
    });
    expect(result.secondPlayerProgress).toEqual({
      answers: [],
      player: {
        id: secondPlayer.id,
        login: secondPlayer.login,
      },
      score: 0,
    });
    expect(result.questions).not.toBeNull();
    expect(result.questions).toHaveLength(questionsCount);
    expect(result.questions!.map((question) => question.body).sort()).toEqual(publishedQuestionBodies.sort());
    expect(result.startGameDate).not.toBeNull();
    expect(result.finishGameDate).toBeNull();
  });

  it('should throw AccessDeniedDomainException for non participant', async () => {
    const firstPlayer = await createUser('first-player');
    const outsider = await createUser('outsider');

    const createdGame = await connectUserUseCase.execute(new ConnectUserCommand(firstPlayer.id));

    await expect(
      getGameByIdUseCase.execute(new GetGameByIdQuery(createdGame.id, outsider.id)),
    ).rejects.toBeInstanceOf(AccessDeniedDomainException);
  });

  it('should return finished game progress with bonus included in score', async () => {
    const firstPlayer = await createUser('first-player');
    const secondPlayer = await createUser('second-player');

    await createPublishedQuestions(questionsCount);

    await connectUserUseCase.execute(new ConnectUserCommand(firstPlayer.id));
    const startedGame = await connectUserUseCase.execute(new ConnectUserCommand(secondPlayer.id));

    const gameAtStart = await getGameByIdUseCase.execute(new GetGameByIdQuery(startedGame.id, secondPlayer.id));
    const orderedQuestionIds = gameAtStart.questions!.map((question) => question.id);

    for (const questionId of orderedQuestionIds) {
      await submitAnswerUseCase.execute(new SubmitAnswerCommand(secondPlayer.id, `answer-${questionId}`));
    }

    for (const questionId of orderedQuestionIds) {
      await submitAnswerUseCase.execute(new SubmitAnswerCommand(firstPlayer.id, `answer-${questionId}`));
    }

    const finishedGame = await getGameByIdUseCase.execute(new GetGameByIdQuery(startedGame.id, secondPlayer.id));

    expect(finishedGame.status).toBe('Finished');
    expect(finishedGame.secondPlayerProgress!.answers.map((answer) => answer.questionId)).toEqual(orderedQuestionIds);
    expect(finishedGame.secondPlayerProgress!.score).toBe(questionsCount + 1);
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

  async function createPublishedQuestions(count: number): Promise<string[]> {
    const bodies: string[] = [];

    for (let index = 1; index <= count; index++) {
      const body = `Question body ${index}`;
      const question = await questionsRepository.createQuestion(body, [`answer-${index}`]);

      question.setPublishedStatus(true);
      await questionsRepository.save(question);

      bodies.push(body);
    }

    return bodies;
  }
});
