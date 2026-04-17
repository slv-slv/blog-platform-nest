import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../../app.module.js';
import { GameNotFoundDomainException } from '../../../common/exceptions/domain-exceptions.js';
import { quizConfig } from '../../../config/quiz.config.js';
import { UsersRepository } from '../../../modules/user-accounts/infrastructure/typeorm/users.repository.js';
import { EmailService } from '../../../notifications/email/email.service.js';
import { QuestionsRepository } from '../../infrastructure/typeorm/questions.repository.js';
import { ConnectUserCommand, ConnectUserUseCase } from './connect-user.use-case.js';
import { GetCurrentGameQuery, GetCurrentGameUseCase } from './get-current-game.use-case.js';
import { SubmitAnswerCommand, SubmitAnswerUseCase } from './submit-answer.use-case.js';

describe('GetCurrentGameUseCase Integration', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let usersRepository: UsersRepository;
  let questionsRepository: QuestionsRepository;
  let connectUserUseCase: ConnectUserUseCase;
  let getCurrentGameUseCase: GetCurrentGameUseCase;
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
    getCurrentGameUseCase = app.get(GetCurrentGameUseCase);
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

    const result = await getCurrentGameUseCase.execute(new GetCurrentGameQuery(firstPlayer.id));

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

  it('should return active game view model for current player', async () => {
    const firstPlayer = await createUser('first-player');
    const secondPlayer = await createUser('second-player');
    const publishedQuestionBodies = await createPublishedQuestions(questionsCount);

    const pendingGame = await connectUserUseCase.execute(new ConnectUserCommand(firstPlayer.id));
    const startedGame = await connectUserUseCase.execute(new ConnectUserCommand(secondPlayer.id));

    const result = await getCurrentGameUseCase.execute(new GetCurrentGameQuery(secondPlayer.id));

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

  it('should return questions in the same order as they are answered', async () => {
    const firstPlayer = await createUser('first-player');
    const secondPlayer = await createUser('second-player');

    await createPublishedQuestions(questionsCount);

    await connectUserUseCase.execute(new ConnectUserCommand(firstPlayer.id));
    await connectUserUseCase.execute(new ConnectUserCommand(secondPlayer.id));

    const gameBeforeAnswer = await getCurrentGameUseCase.execute(new GetCurrentGameQuery(firstPlayer.id));
    const firstQuestionId = gameBeforeAnswer.questions![0].id;

    const answerResult = await submitAnswerUseCase.execute(
      new SubmitAnswerCommand(firstPlayer.id, `answer-${firstQuestionId}`),
    );

    const gameAfterAnswer = await getCurrentGameUseCase.execute(new GetCurrentGameQuery(firstPlayer.id));

    expect(answerResult.questionId).toBe(firstQuestionId);
    expect(gameAfterAnswer.firstPlayerProgress.answers[0].questionId).toBe(firstQuestionId);
  });

  it('should throw GameNotFoundDomainException when current game does not exist', async () => {
    const user = await createUser('lonely-player');

    await expect(getCurrentGameUseCase.execute(new GetCurrentGameQuery(user.id))).rejects.toBeInstanceOf(
      GameNotFoundDomainException,
    );
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
