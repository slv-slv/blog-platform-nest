import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../../../app.module.js';
import { quizConfig } from '../../../../config/quiz.config.js';
import { UsersRepository } from '../../../user-accounts/infrastructure/typeorm/users.repository.js';
import { EmailService } from '../../../notifications/email/email.service.js';
import { Game } from '../../infrastructure/typeorm/entities/game.entity.js';
import { PlayerAnswer } from '../../infrastructure/typeorm/entities/player-answer.entity.js';
import { QuestionsRepository } from '../../infrastructure/typeorm/questions.repository.js';
import { GameStatus } from '../../types/game.types.js';
import { AnswerStatus } from '../../types/player-answer.types.js';
import { ConnectUserCommand, ConnectUserUseCase } from './connect-user.use-case.js';
import { FinishExpiredGamesCommand, FinishExpiredGamesUseCase } from './finish-expired-games.use-case.js';
import { SubmitAnswerCommand, SubmitAnswerUseCase } from './submit-answer.use-case.js';

describe('FinishExpiredGamesUseCase Integration', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let usersRepository: UsersRepository;
  let questionsRepository: QuestionsRepository;
  let gameEntityRepository: Repository<Game>;
  let playerAnswerEntityRepository: Repository<PlayerAnswer>;
  let connectUserUseCase: ConnectUserUseCase;
  let submitAnswerUseCase: SubmitAnswerUseCase;
  let finishExpiredGamesUseCase: FinishExpiredGamesUseCase;
  let questionsCount: number;
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
    playerAnswerEntityRepository = dataSource.getRepository(PlayerAnswer);
    connectUserUseCase = app.get(ConnectUserUseCase);
    submitAnswerUseCase = app.get(SubmitAnswerUseCase);
    finishExpiredGamesUseCase = app.get(FinishExpiredGamesUseCase);
    const quiz = app.get<{ questionsCount: number; bonusPoints: number }>(quizConfig.KEY);
    questionsCount = quiz.questionsCount;
    bonusPoints = quiz.bonusPoints;
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

  it('should finish expired game, create remaining incorrect answers and give bonus to faster player', async () => {
    const { firstPlayer, secondPlayer, gameId, orderedQuestions } = await createActiveGame('bonus');

    await submitAllAnswers(secondPlayer.id, orderedQuestions, 'correct');
    await expireGameDeadline(gameId);

    await finishExpiredGamesUseCase.execute(new FinishExpiredGamesCommand());

    const finishedGame = await gameEntityRepository.findOneBy({ id: +gameId });
    const firstPlayerAnswers = await findPlayerAnswers(gameId, firstPlayer.id);
    const secondPlayerAnswers = await findPlayerAnswers(gameId, secondPlayer.id);

    expect(finishedGame).not.toBeNull();
    expect(finishedGame!.status).toBe(GameStatus.finished);
    expect(finishedGame!.deadlineDate).toBeNull();
    expect(finishedGame!.finishGameDate).not.toBeNull();
    expect(firstPlayerAnswers).toHaveLength(questionsCount);
    expect(firstPlayerAnswers.every((answer) => answer.status === AnswerStatus.incorrect)).toBe(true);
    expect(firstPlayerAnswers.every((answer) => answer.answer === null)).toBe(true);
    expect(firstPlayerAnswers.every((answer) => answer.points === 0)).toBe(true);
    expect(secondPlayerAnswers).toHaveLength(questionsCount);
    expect(secondPlayerAnswers.at(-1)!.points).toBe(1 + bonusPoints);
    expect(getPlayerScore(secondPlayerAnswers)).toBe(questionsCount + bonusPoints);
  });

  it('should finish expired game without bonus when faster player has no correct answers', async () => {
    const { firstPlayer, secondPlayer, gameId, orderedQuestions } = await createActiveGame('no-bonus');

    await submitAllAnswers(secondPlayer.id, orderedQuestions, 'wrong');
    await expireGameDeadline(gameId);

    await finishExpiredGamesUseCase.execute(new FinishExpiredGamesCommand());

    const finishedGame = await gameEntityRepository.findOneBy({ id: +gameId });
    const firstPlayerAnswers = await findPlayerAnswers(gameId, firstPlayer.id);
    const secondPlayerAnswers = await findPlayerAnswers(gameId, secondPlayer.id);

    expect(finishedGame).not.toBeNull();
    expect(finishedGame!.status).toBe(GameStatus.finished);
    expect(finishedGame!.deadlineDate).toBeNull();
    expect(firstPlayerAnswers).toHaveLength(questionsCount);
    expect(firstPlayerAnswers.every((answer) => answer.status === AnswerStatus.incorrect)).toBe(true);
    expect(firstPlayerAnswers.every((answer) => answer.answer === null)).toBe(true);
    expect(getPlayerScore(secondPlayerAnswers)).toBe(0);
    expect(secondPlayerAnswers.at(-1)!.points).toBe(0);
  });

  it('should finish every expired game and keep game with future deadline active', async () => {
    const expiredGameWithBonus = await createActiveGame('expired-bonus');
    const expiredGameWithoutBonus = await createActiveGame('expired-no-bonus');
    const notExpiredGame = await createActiveGame('future-deadline');

    await submitAllAnswers(
      expiredGameWithBonus.secondPlayer.id,
      expiredGameWithBonus.orderedQuestions,
      'correct',
    );
    await submitAllAnswers(
      expiredGameWithoutBonus.secondPlayer.id,
      expiredGameWithoutBonus.orderedQuestions,
      'wrong',
    );
    await submitAllAnswers(notExpiredGame.secondPlayer.id, notExpiredGame.orderedQuestions, 'correct');

    await expireGameDeadline(expiredGameWithBonus.gameId);
    await expireGameDeadline(expiredGameWithoutBonus.gameId);
    await setGameDeadline(notExpiredGame.gameId, 60_000);

    await finishExpiredGamesUseCase.execute(new FinishExpiredGamesCommand());

    const expiredFinishedWithBonus = await gameEntityRepository.findOneBy({
      id: +expiredGameWithBonus.gameId,
    });
    const expiredFinishedWithoutBonus = await gameEntityRepository.findOneBy({
      id: +expiredGameWithoutBonus.gameId,
    });
    const activeGame = await gameEntityRepository.findOneBy({ id: +notExpiredGame.gameId });
    const activeGameFirstPlayerAnswers = await findPlayerAnswers(
      notExpiredGame.gameId,
      notExpiredGame.firstPlayer.id,
    );

    expect(expiredFinishedWithBonus!.status).toBe(GameStatus.finished);
    expect(expiredFinishedWithoutBonus!.status).toBe(GameStatus.finished);
    expect(activeGame!.status).toBe(GameStatus.active);
    expect(activeGame!.deadlineDate).not.toBeNull();
    expect(activeGameFirstPlayerAnswers).toHaveLength(0);
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
      const question = await questionsRepository.createQuestion(`Question body ${index}`, [
        `answer-${index}`,
      ]);

      question.setPublishedStatus(true);
      await questionsRepository.save(question);
    }
  }

  async function createActiveGame(suffix: string) {
    const firstPlayer = await createUser(`first-player-${suffix}`);
    const secondPlayer = await createUser(`second-player-${suffix}`);

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

  async function submitAllAnswers(
    userId: string,
    orderedQuestions: { id: string; correctAnswers: string[] }[],
    answerType: 'correct' | 'wrong',
  ) {
    for (const question of orderedQuestions) {
      const answer = answerType === 'correct' ? question.correctAnswers[0] : 'wrong-answer';
      await submitAnswerUseCase.execute(new SubmitAnswerCommand(userId, answer));
    }
  }

  async function expireGameDeadline(gameId: string) {
    await gameEntityRepository.update({ id: +gameId }, { deadlineDate: new Date(Date.now() - 1_000) });
  }

  async function setGameDeadline(gameId: string, shiftMs: number) {
    await gameEntityRepository.update({ id: +gameId }, { deadlineDate: new Date(Date.now() + shiftMs) });
  }

  async function findPlayerAnswers(gameId: string, userId: string) {
    return playerAnswerEntityRepository.find({
      where: { gameId: +gameId, userId: +userId },
      order: { addedAt: 'ASC', questionId: 'ASC' },
    });
  }

  function getPlayerScore(answers: PlayerAnswer[]): number {
    return answers.reduce((score, answer) => score + answer.points, 0);
  }
});
