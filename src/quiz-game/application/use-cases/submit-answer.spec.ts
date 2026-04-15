import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigType } from '@nestjs/config';
import { Repository } from 'typeorm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../../app.module.js';
import { quizConfig } from '../../../config/quiz.config.js';
import {
  NoActivePairDomainException,
  NoRemainingQuestionsDomainException,
} from '../../../common/exceptions/domain-exceptions.js';
import { EmailService } from '../../../notifications/email/email.service.js';
import { UsersRepository } from '../../../modules/user-accounts/infrastructure/typeorm/users.repository.js';
import { ConnectUserCommand, ConnectUserUseCase } from './connect-user.use-case.js';
import { SubmitAnswerCommand, SubmitAnswerUseCase } from './submit-answer.use-case.js';
import { QuestionsRepository } from '../../infrastructure/typeorm/questions.repository.js';
import { Question } from '../../infrastructure/typeorm/entities/question.entity.js';
import { Game } from '../../infrastructure/typeorm/entities/game.entity.js';
import { GameQuestion } from '../../infrastructure/typeorm/entities/game-question.entity.js';
import { PlayerAnswer } from '../../infrastructure/typeorm/entities/player-answer.entity.js';
import { AnswerStatus } from '../../types/player-answer.types.js';
import { GameStatus } from '../../types/game.types.js';

describe('SubmitAnswerUseCase Integration', () => {
  let app: INestApplication;
  let usersRepository: UsersRepository;
  let questionsRepository: QuestionsRepository;
  let questionEntityRepository: Repository<Question>;
  let gameEntityRepository: Repository<Game>;
  let playerAnswerEntityRepository: Repository<PlayerAnswer>;
  let connectUserUseCase: ConnectUserUseCase;
  let submitAnswerUseCase: SubmitAnswerUseCase;
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
    playerAnswerEntityRepository = app.get(getRepositoryToken(PlayerAnswer));
    connectUserUseCase = app.get(ConnectUserUseCase);
    submitAnswerUseCase = app.get(SubmitAnswerUseCase);
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

  it('should throw NoActivePairDomainException when user is not inside active pair', async () => {
    const user = await createUser('solo-player', 'solo-player@example.com');

    await expect(submitAnswerUseCase.execute(new SubmitAnswerCommand(user.id, 'any-answer'))).rejects.toBeInstanceOf(
      NoActivePairDomainException,
    );
  });

  it('should submit correct answer and persist it', async () => {
    const { firstUser, gameId } = await createActiveGame();
    const gameQuestions = await getOrderedGameQuestions(gameId);
    const firstQuestion = gameQuestions[0];
    const correctAnswer = firstQuestion.question.correctAnswers[0].answer;

    const result = await submitAnswerUseCase.execute(new SubmitAnswerCommand(firstUser.id, correctAnswer));

    const storedAnswer = await playerAnswerEntityRepository.findOneBy({
      gameId: +gameId,
      userId: +firstUser.id,
      questionId: firstQuestion.questionId,
    });

    expect(storedAnswer).not.toBeNull();
    expect(storedAnswer!.status).toBe(AnswerStatus.correct);
    expect(storedAnswer!.answer).toBe(correctAnswer);

    expect(result).toEqual({
      questionId: firstQuestion.questionId.toString(),
      answerStatus: 'Correct',
      addedAt: expect.any(String),
    });
    expect(result.addedAt).toBe(storedAnswer!.addedAt.toISOString());
  });

  it('should submit incorrect answer and persist it', async () => {
    const { firstUser, gameId } = await createActiveGame();
    const gameQuestions = await getOrderedGameQuestions(gameId);
    const firstQuestion = gameQuestions[0];

    const result = await submitAnswerUseCase.execute(new SubmitAnswerCommand(firstUser.id, '__wrong-answer__'));

    const storedAnswer = await playerAnswerEntityRepository.findOneBy({
      gameId: +gameId,
      userId: +firstUser.id,
      questionId: firstQuestion.questionId,
    });

    expect(storedAnswer).not.toBeNull();
    expect(storedAnswer!.status).toBe(AnswerStatus.incorrect);
    expect(storedAnswer!.answer).toBe('__wrong-answer__');

    expect(result).toEqual({
      questionId: firstQuestion.questionId.toString(),
      answerStatus: 'Incorrect',
      addedAt: expect.any(String),
    });
    expect(result.addedAt).toBe(storedAnswer!.addedAt.toISOString());
  });

  it('should throw NoRemainingQuestionsDomainException when player answers all questions', async () => {
    const { firstUser, gameId } = await createActiveGame();
    const gameQuestions = await getOrderedGameQuestions(gameId);

    await answerAllQuestions(firstUser.id, gameQuestions);

    await expect(
      submitAnswerUseCase.execute(new SubmitAnswerCommand(firstUser.id, gameQuestions[0].question.correctAnswers[0].answer)),
    ).rejects.toBeInstanceOf(NoRemainingQuestionsDomainException);
  });

  it('should finish game when second player submits the last remaining answer', async () => {
    const { firstUser, secondUser, gameId } = await createActiveGame();
    const gameQuestions = await getOrderedGameQuestions(gameId);
    const lastQuestion = gameQuestions[quiz.questionsCount - 1];

    await answerAllQuestions(firstUser.id, gameQuestions);
    await answerAllQuestions(secondUser.id, gameQuestions.slice(0, quiz.questionsCount - 1));

    let activeGame = await gameEntityRepository.findOneBy({ id: +gameId });
    expect(activeGame!.status).toBe(GameStatus.active);
    expect(activeGame!.finishGameDate).toBeNull();

    const result = await submitAnswerUseCase.execute(
      new SubmitAnswerCommand(secondUser.id, lastQuestion.question.correctAnswers[0].answer),
    );

    const finishedGame = await gameEntityRepository.findOneBy({ id: +gameId });

    expect(result).toEqual({
      questionId: lastQuestion.questionId.toString(),
      answerStatus: 'Correct',
      addedAt: expect.any(String),
    });
    expect(finishedGame).not.toBeNull();
    expect(finishedGame!.status).toBe(GameStatus.finished);
    expect(finishedGame!.finishGameDate).not.toBeNull();
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

  async function createActiveGame() {
    const firstUser = await createUser('first-player', 'first-player@example.com');
    const secondUser = await createUser('second-player', 'second-player@example.com');

    await createPublishedQuestions(quiz.questionsCount);

    await connectUserUseCase.execute(new ConnectUserCommand(firstUser.id));
    const startedGame = await connectUserUseCase.execute(new ConnectUserCommand(secondUser.id));

    return { firstUser, secondUser, gameId: startedGame.id };
  }

  async function getOrderedGameQuestions(gameId: string): Promise<GameQuestion[]> {
    const game = await gameEntityRepository.findOne({
      where: { id: +gameId },
      relations: { questionEntries: { question: { correctAnswers: true } } },
    });

    expect(game).not.toBeNull();

    return [...game!.questionEntries].sort((left, right) => left.questionNumber - right.questionNumber);
  }

  async function answerAllQuestions(userId: string, questions: GameQuestion[]): Promise<void> {
    for (const question of questions) {
      await submitAnswerUseCase.execute(
        new SubmitAnswerCommand(userId, question.question.correctAnswers[0].answer),
      );
    }
  }
});
