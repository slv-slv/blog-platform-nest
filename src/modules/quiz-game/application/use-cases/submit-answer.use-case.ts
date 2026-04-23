import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectDataSource } from '@nestjs/typeorm';
import { PlayerAnswerStats, PlayerAnswerViewModel } from '../../types/player-answer.types.js';
import { GamesRepository } from '../../infrastructure/typeorm/games.repository.js';
import { GameQuestionsRepository } from '../../infrastructure/typeorm/game-questions.repository.js';
import { PlayerAnswersRepository } from '../../infrastructure/typeorm/player-answers.repository.js';
import { AnswerStatus } from '../../types/player-answer.types.js';
import { NoActivePairDomainException } from '../../../../common/exceptions/domain-exceptions.js';
import { mapAnswerToViewModel } from '../../mappers/answer-view.mapper.js';
import { DataSource } from 'typeorm';
import { Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { quizConfig } from '../../../../config/quiz.config.js';

export class SubmitAnswerCommand extends Command<PlayerAnswerViewModel> {
  constructor(
    public readonly userId: string,
    public readonly answer: string,
  ) {
    super();
  }
}

@CommandHandler(SubmitAnswerCommand)
export class SubmitAnswerUseCase implements ICommandHandler<SubmitAnswerCommand> {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly gamesRepository: GamesRepository,
    private readonly gameQuestionsRepository: GameQuestionsRepository,
    private readonly playerAnswersRepository: PlayerAnswersRepository,
    @Inject(quizConfig.KEY) private readonly quiz: ConfigType<typeof quizConfig>,
  ) {}
  async execute(command: SubmitAnswerCommand) {
    return this.dataSource.transaction(async (manager) => {
      let anotherPlayerAnswersStats: PlayerAnswerStats;
      const game = await this.gamesRepository.findActiveGameWithLock(command.userId, manager);

      if (!game) {
        throw new NoActivePairDomainException();
      }

      const anotherPlayerId =
        game.firstPlayerId === +command.userId
          ? game.secondPlayerId!.toString()
          : game.firstPlayerId.toString();

      const deadlineDate = await this.gamesRepository.findDeadlineForPlayer(
        game.id.toString(),
        command.userId,
        this.quiz.questionsCount,
        manager,
      );

      if (deadlineDate && deadlineDate < new Date()) {
        const incorrectAnswers = await this.playerAnswersRepository.createRemainingIncorrectAnswers(
          game,
          manager,
        );

        anotherPlayerAnswersStats = await this.playerAnswersRepository.getPlayerAnswerStats(
          game.id.toString(),
          anotherPlayerId,
          manager,
        );

        if (anotherPlayerAnswersStats.correctAnswersCount > 0) {
          await this.playerAnswersRepository.setBonus(
            game.id.toString(),
            anotherPlayerId,
            this.quiz.bonusPoints,
            manager,
          );
        }

        game.finishGame();
        await this.gamesRepository.save(game, manager);
        return mapAnswerToViewModel(incorrectAnswers[0]);
      }

      const nextQuestion = await this.gameQuestionsRepository.getNextQuestion(
        game.id.toString(),
        command.userId,
        manager,
      );

      const isCorrect = nextQuestion.question.correctAnswers.some(
        (correctAnswer) => correctAnswer.answer === command.answer,
      );

      const status = isCorrect ? AnswerStatus.correct : AnswerStatus.incorrect;

      const points = status === AnswerStatus.correct ? 1 : 0;

      const submittedAnswer = await this.playerAnswersRepository.submitAnswer(
        game.id.toString(),
        command.userId,
        nextQuestion.questionId.toString(),
        command.answer,
        status,
        points,
        manager,
      );

      const isCurrentPlayerFinished = nextQuestion.questionNumber === this.quiz.questionsCount;
      if (!isCurrentPlayerFinished) {
        return mapAnswerToViewModel(submittedAnswer);
      }

      anotherPlayerAnswersStats = await this.playerAnswersRepository.getPlayerAnswerStats(
        game.id.toString(),
        anotherPlayerId,
        manager,
      );

      const isAnotherPlayerFinished = anotherPlayerAnswersStats.answersCount === this.quiz.questionsCount;
      if (!isAnotherPlayerFinished) {
        const deadlineDate = new Date();
        deadlineDate.setSeconds(deadlineDate.getSeconds() + 10);
        await this.gamesRepository.setDeadline(game.id.toString(), deadlineDate, manager);

        return mapAnswerToViewModel(submittedAnswer);
      }

      // const currentPlayerAnswerStats = await this.playerAnswersRepository.getPlayerAnswerStats(
      //   game.id.toString(),
      //   command.userId,
      //   manager,
      // );

      // const currentPlayerCandidate = {
      //   userId: command.userId,
      //   stats: currentPlayerAnswerStats,
      // };

      // const anotherPlayerCandidate = {
      //   userId: anotherPlayerId,
      //   stats: anotherPlayerAnswersStats,
      // };

      // const bonusUserId = this.getBonusUserId(currentPlayerCandidate, anotherPlayerCandidate);

      // const bonus = 1;

      // if (bonusUserId) {
      //   await this.playerAnswersRepository.setBonus(game.id.toString(), bonusUserId, bonus, manager);
      // }

      // Ответы на вопросы сериализованы для обоих игроков через пессимистическую блокировку игры, поэтому просто проверяем, что у второго игрока был хотя бы 1 правильный ответ
      if (anotherPlayerAnswersStats.correctAnswersCount > 0) {
        await this.playerAnswersRepository.setBonus(
          game.id.toString(),
          anotherPlayerId,
          this.quiz.bonusPoints,
          manager,
        );
      }

      game.finishGame();
      await this.gamesRepository.save(game, manager);
      return mapAnswerToViewModel(submittedAnswer);
    });
  }

  // private getBonusUserId(firstCandidate: BonusCandidate, secondCandidate: BonusCandidate): string | null {
  //   if (firstCandidate.stats.lastAnswerAt === null || secondCandidate.stats.lastAnswerAt === null) {
  //     return null;
  //   }

  //   const firstCandidateLastAnswerTimestamp = firstCandidate.stats.lastAnswerAt.getTime();
  //   const secondCandidateLastAnswerTimestamp = secondCandidate.stats.lastAnswerAt.getTime();

  //   if (firstCandidateLastAnswerTimestamp === secondCandidateLastAnswerTimestamp) {
  //     return null;
  //   }

  //   if (
  //     firstCandidateLastAnswerTimestamp < secondCandidateLastAnswerTimestamp &&
  //     firstCandidate.stats.correctAnswersCount > 0
  //   ) {
  //     return firstCandidate.userId;
  //   } else if (
  //     secondCandidateLastAnswerTimestamp < firstCandidateLastAnswerTimestamp &&
  //     secondCandidate.stats.correctAnswersCount > 0
  //   ) {
  //     return secondCandidate.userId;
  //   } else {
  //     return null;
  //   }
  // }
}
