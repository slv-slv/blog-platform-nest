import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigType } from '@nestjs/config';
import { Repository } from 'typeorm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../../app.module.js';
import { quizConfig } from '../../../config/quiz.config.js';
import {
  AccessDeniedDomainException,
  NotEnoughQuestionsToStartGameDomainException,
} from '../../../common/exceptions/domain-exceptions.js';
import { EmailService } from '../../../notifications/email/email.service.js';
import { UsersRepository } from '../../../modules/user-accounts/infrastructure/typeorm/users.repository.js';
import { ConnectUserCommand, ConnectUserUseCase } from './connect-user.use-case.js';
import { QuestionsRepository } from '../../infrastructure/typeorm/questions.repository.js';
import { Question } from '../../infrastructure/typeorm/entities/question.entity.js';
import { Game } from '../../infrastructure/typeorm/entities/game.entity.js';

describe('ConnectUserUseCase Integration', () => {
  let app: INestApplication;
  let usersRepository: UsersRepository;
  let questionsRepository: QuestionsRepository;
  let questionEntityRepository: Repository<Question>;
  let gameEntityRepository: Repository<Game>;
  let connectUserUseCase: ConnectUserUseCase;
  let quiz: ConfigType<typeof quizConfig>;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue({ sendConfirmationCode: () => {}, sendRecoveryCode: () => {} })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    usersRepository = app.get(UsersRepository);
    questionsRepository = app.get(QuestionsRepository);
    questionEntityRepository = app.get(getRepositoryToken(Question));
    gameEntityRepository = app.get(getRepositoryToken(Game));
    connectUserUseCase = app.get(ConnectUserUseCase);
    quiz = app.get(quizConfig.KEY);
  }, 30000);

  beforeEach(async () => {
    await questionEntityRepository.manager.query(`
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

  it('should create pending game for the first player', async () => {
    const firstUser = await createUser('first-player', 'first-player@example.com');

    const result = await connectUserUseCase.execute(new ConnectUserCommand(firstUser.id));

    const createdGame = await gameEntityRepository.findOneBy({ id: +result.id });

    expect(createdGame).not.toBeNull();
    expect(createdGame!.firstPlayerId).toBe(+firstUser.id);
    expect(createdGame!.secondPlayerId).toBeNull();

    expect(result).toEqual({
      id: expect.any(String),
      firstPlayerProgress: {
        answers: [],
        player: {
          id: firstUser.id,
          login: firstUser.login,
        },
        score: 0,
      },
      secondPlayerProgress: null,
      questions: null,
      status: 'PendingSecondPlayer',
      pairCreatedDate: expect.any(String),
      startGameDate: null,
      finishGameDate: null,
    });
  });

  it('should connect second player to pending game and start active game', async () => {
    const firstUser = await createUser('first-player', 'first-player@example.com');
    const secondUser = await createUser('second-player', 'second-player@example.com');

    await createPublishedQuestions(quiz.questionsCount);

    await connectUserUseCase.execute(new ConnectUserCommand(firstUser.id));
    const result = await connectUserUseCase.execute(new ConnectUserCommand(secondUser.id));

    const startedGame = await gameEntityRepository.findOne({
      where: { id: +result.id },
      relations: { questionEntries: true },
    });

    expect(startedGame).not.toBeNull();
    expect(startedGame!.firstPlayerId).toBe(+firstUser.id);
    expect(startedGame!.secondPlayerId).toBe(+secondUser.id);
    expect(startedGame!.questionEntries).toHaveLength(quiz.questionsCount);
    expect(startedGame!.startGameDate).not.toBeNull();

    expect(result.firstPlayerProgress).toEqual({
      answers: [],
      player: {
        id: firstUser.id,
        login: firstUser.login,
      },
      score: 0,
    });
    expect(result.secondPlayerProgress).toEqual({
      answers: [],
      player: {
        id: secondUser.id,
        login: secondUser.login,
      },
      score: 0,
    });
    expect(result.status).toBe('Active');
    expect(result.questions).toHaveLength(quiz.questionsCount);
    expect(result.questions?.every((question) => typeof question.id === 'string')).toBe(true);
    expect(result.questions?.every((question) => typeof question.body === 'string')).toBe(true);
    expect(result.startGameDate).toEqual(expect.any(String));
    expect(result.finishGameDate).toBeNull();
  });

  it('should throw AccessDeniedDomainException when user is already inside active pair', async () => {
    const firstUser = await createUser('first-player', 'first-player@example.com');
    const secondUser = await createUser('second-player', 'second-player@example.com');

    await createPublishedQuestions(quiz.questionsCount);

    await connectUserUseCase.execute(new ConnectUserCommand(firstUser.id));
    await connectUserUseCase.execute(new ConnectUserCommand(secondUser.id));

    await expect(connectUserUseCase.execute(new ConnectUserCommand(firstUser.id))).rejects.toBeInstanceOf(
      AccessDeniedDomainException,
    );
  });

  it('should throw NotEnoughQuestionsToStartGameDomainException when published questions are insufficient', async () => {
    const firstUser = await createUser('first-player', 'first-player@example.com');
    const secondUser = await createUser('second-player', 'second-player@example.com');

    await createPublishedQuestions(quiz.questionsCount - 1);

    await connectUserUseCase.execute(new ConnectUserCommand(firstUser.id));

    await expect(connectUserUseCase.execute(new ConnectUserCommand(secondUser.id))).rejects.toBeInstanceOf(
      NotEnoughQuestionsToStartGameDomainException,
    );
  });

  async function createUser(login: string, email: string) {
    return usersRepository.createUser({
      login,
      email,
      hash: 'hash',
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

  async function createPublishedQuestions(count: number): Promise<void> {
    for (let index = 0; index < count; index++) {
      const question = await questionsRepository.createQuestion(`Question ${index + 1}`, [`answer-${index + 1}`]);
      question.setPublishedStatus(true);
      await questionsRepository.save(question);
    }
  }
});
