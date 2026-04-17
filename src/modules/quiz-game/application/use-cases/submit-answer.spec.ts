import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../../../app.module.js';
import {
  NoActivePairDomainException,
  NoRemainingQuestionsDomainException,
} from '../../../../common/exceptions/domain-exceptions.js';
import { quizConfig } from '../../../../config/quiz.config.js';
import { UsersRepository } from '../../../user-accounts/infrastructure/typeorm/users.repository.js';
import { EmailService } from '../../../notifications/email/email.service.js';
import { Game } from '../../infrastructure/typeorm/entities/game.entity.js';
import { PlayerAnswer } from '../../infrastructure/typeorm/entities/player-answer.entity.js';
import { QuestionsRepository } from '../../infrastructure/typeorm/questions.repository.js';
import { GameStatus } from '../../types/game.types.js';
import { AnswerStatus } from '../../types/player-answer.types.js';
import { ConnectUserCommand, ConnectUserUseCase } from './connect-user.use-case.js';
import { SubmitAnswerCommand, SubmitAnswerUseCase } from './submit-answer.use-case.js';

describe('SubmitAnswerUseCase Integration', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let usersRepository: UsersRepository;
  let questionsRepository: QuestionsRepository;
  let gameEntityRepository: Repository<Game>;
  let playerAnswerEntityRepository: Repository<PlayerAnswer>;
  let connectUserUseCase: ConnectUserUseCase;
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
    gameEntityRepository = dataSource.getRepository(Game);
    playerAnswerEntityRepository = dataSource.getRepository(PlayerAnswer);
    connectUserUseCase = app.get(ConnectUserUseCase);
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

  it('should submit correct answer and persist it for the next question', async () => {
    const { firstPlayer, gameId, orderedQuestions } = await createActiveGame();
    const firstQuestion = orderedQuestions[0];

    const result = await submitAnswerUseCase.execute(
      new SubmitAnswerCommand(firstPlayer.id, firstQuestion.correctAnswers[0]),
    );

    const savedAnswer = await playerAnswerEntityRepository.findOneBy({
      gameId: +gameId,
      questionId: +firstQuestion.id,
      userId: +firstPlayer.id,
    });
    const savedGame = await gameEntityRepository.findOneBy({ id: +gameId });

    expect(savedAnswer).not.toBeNull();
    expect(savedAnswer!.answer).toBe(firstQuestion.correctAnswers[0]);
    expect(savedAnswer!.status).toBe(AnswerStatus.correct);
    expect(result).toEqual({
      questionId: firstQuestion.id,
      answerStatus: 'Correct',
      addedAt: savedAnswer!.addedAt.toISOString(),
    });
    expect(savedGame).not.toBeNull();
    expect(savedGame!.status).toBe(GameStatus.active);
    expect(savedGame!.finishGameDate).toBeNull();
  });

  it('should submit incorrect answer and persist incorrect status', async () => {
    const { firstPlayer, gameId, orderedQuestions } = await createActiveGame();
    const firstQuestion = orderedQuestions[0];

    const result = await submitAnswerUseCase.execute(new SubmitAnswerCommand(firstPlayer.id, 'wrong-answer'));

    const savedAnswer = await playerAnswerEntityRepository.findOneBy({
      gameId: +gameId,
      questionId: +firstQuestion.id,
      userId: +firstPlayer.id,
    });

    expect(savedAnswer).not.toBeNull();
    expect(savedAnswer!.answer).toBe('wrong-answer');
    expect(savedAnswer!.status).toBe(AnswerStatus.incorrect);
    expect(result).toEqual({
      questionId: firstQuestion.id,
      answerStatus: 'Incorrect',
      addedAt: savedAnswer!.addedAt.toISOString(),
    });
  });

  it('should throw NoActivePairDomainException when user is not inside active pair', async () => {
    const firstPlayer = await createUser('first-player');

    await connectUserUseCase.execute(new ConnectUserCommand(firstPlayer.id));

    await expect(
      submitAnswerUseCase.execute(new SubmitAnswerCommand(firstPlayer.id, 'answer')),
    ).rejects.toBeInstanceOf(NoActivePairDomainException);
  });

  it('should throw NoRemainingQuestionsDomainException after player answers all questions', async () => {
    const { firstPlayer, gameId, orderedQuestions } = await createActiveGame();

    for (const question of orderedQuestions) {
      await submitAnswerUseCase.execute(new SubmitAnswerCommand(firstPlayer.id, question.correctAnswers[0]));
    }

    const gameAfterLastAnswer = await gameEntityRepository.findOneBy({ id: +gameId });

    expect(gameAfterLastAnswer).not.toBeNull();
    expect(gameAfterLastAnswer!.status).toBe(GameStatus.active);
    expect(gameAfterLastAnswer!.finishGameDate).toBeNull();

    await expect(
      submitAnswerUseCase.execute(new SubmitAnswerCommand(firstPlayer.id, 'extra-answer')),
    ).rejects.toBeInstanceOf(NoRemainingQuestionsDomainException);
  });

  it('should finish game when current player submits the last answer after opponent answered all questions', async () => {
    const { firstPlayer, secondPlayer, gameId, orderedQuestions } = await createActiveGame();

    for (const question of orderedQuestions) {
      await submitAnswerUseCase.execute(new SubmitAnswerCommand(secondPlayer.id, question.correctAnswers[0]));
    }

    for (const question of orderedQuestions.slice(0, -1)) {
      await submitAnswerUseCase.execute(new SubmitAnswerCommand(firstPlayer.id, question.correctAnswers[0]));
    }

    const gameBeforeFinalAnswer = await gameEntityRepository.findOneBy({ id: +gameId });
    const lastQuestion = orderedQuestions.at(-1)!;

    const result = await submitAnswerUseCase.execute(
      new SubmitAnswerCommand(firstPlayer.id, lastQuestion.correctAnswers[0]),
    );

    const finishedGame = await gameEntityRepository.findOneBy({ id: +gameId });
    const totalAnswers = await playerAnswerEntityRepository.countBy({ gameId: +gameId });

    expect(gameBeforeFinalAnswer).not.toBeNull();
    expect(gameBeforeFinalAnswer!.status).toBe(GameStatus.active);
    expect(gameBeforeFinalAnswer!.finishGameDate).toBeNull();
    expect(result.questionId).toBe(lastQuestion.id);
    expect(result.answerStatus).toBe('Correct');
    expect(finishedGame).not.toBeNull();
    expect(finishedGame!.status).toBe(GameStatus.finished);
    expect(finishedGame!.finishGameDate).not.toBeNull();
    expect(totalAnswers).toBe(questionsCount * 2);
  });

  it('should give bonus to the player who finished earlier and has at least one correct answer', async () => {
    const { firstPlayer, secondPlayer, gameId, orderedQuestions } = await createActiveGame();

    for (const question of orderedQuestions) {
      await submitAnswerUseCase.execute(new SubmitAnswerCommand(secondPlayer.id, question.correctAnswers[0]));
    }

    for (const question of orderedQuestions) {
      await submitAnswerUseCase.execute(new SubmitAnswerCommand(firstPlayer.id, question.correctAnswers[0]));
    }

    const secondPlayerAnswers = await playerAnswerEntityRepository.find({
      where: { gameId: +gameId, userId: +secondPlayer.id },
      order: { addedAt: 'ASC' },
    });

    expect(secondPlayerAnswers).toHaveLength(questionsCount);
    expect(secondPlayerAnswers.at(-1)!.points).toBe(2);
    expect(getPlayerScore(secondPlayerAnswers)).toBe(questionsCount + 1);
  });

  it('should not give bonus when the faster player has no correct answers', async () => {
    const { firstPlayer, secondPlayer, gameId, orderedQuestions } = await createActiveGame();

    for (const question of orderedQuestions) {
      await submitAnswerUseCase.execute(new SubmitAnswerCommand(secondPlayer.id, 'wrong-answer'));
    }

    for (const question of orderedQuestions) {
      await submitAnswerUseCase.execute(new SubmitAnswerCommand(firstPlayer.id, question.correctAnswers[0]));
    }

    const firstPlayerAnswers = await playerAnswerEntityRepository.find({
      where: { gameId: +gameId, userId: +firstPlayer.id },
      order: { addedAt: 'ASC' },
    });
    const secondPlayerAnswers = await playerAnswerEntityRepository.find({
      where: { gameId: +gameId, userId: +secondPlayer.id },
      order: { addedAt: 'ASC' },
    });

    expect(getPlayerScore(firstPlayerAnswers)).toBe(questionsCount);
    expect(getPlayerScore(secondPlayerAnswers)).toBe(0);
    expect(firstPlayerAnswers.at(-1)!.points).toBe(1);
    expect(secondPlayerAnswers.at(-1)!.points).toBe(0);
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

  async function createPublishedQuestions(count: number): Promise<void> {
    for (let index = 1; index <= count; index++) {
      const question = await questionsRepository.createQuestion(`Question body ${index}`, [`answer-${index}`]);

      question.setPublishedStatus(true);
      await questionsRepository.save(question);
    }
  }

  async function createActiveGame() {
    const firstPlayer = await createUser('first-player');
    const secondPlayer = await createUser('second-player');

    await createPublishedQuestions(questionsCount);

    await connectUserUseCase.execute(new ConnectUserCommand(firstPlayer.id));
    const startedGame = await connectUserUseCase.execute(new ConnectUserCommand(secondPlayer.id));

    const game = await gameEntityRepository.findOne({
      where: { id: +startedGame.id },
      relations: { questionEntries: { question: { correctAnswers: true } } },
    });

    if (!game) {
      throw new Error('Expected active game to be created');
    }

    const orderedQuestions = game.questionEntries
      .slice()
      .sort((left, right) => left.questionNumber - right.questionNumber)
      .map((entry) => ({
        id: entry.questionId.toString(),
        correctAnswers: entry.question.correctAnswers.map((answer) => answer.answer),
      }));

    return {
      firstPlayer,
      secondPlayer,
      gameId: startedGame.id,
      orderedQuestions,
    };
  }

  function getPlayerScore(answers: PlayerAnswer[]): number {
    return answers.reduce((score, answer) => score + answer.points, 0);
  }
});
