import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectDataSource } from '@nestjs/typeorm';
import { PlayerAnswerViewModel } from '../../types/player-answer.types.js';
import { GamesRepository } from '../../infrastructure/typeorm/games.repository.js';
import { GameQuestionsRepository } from '../../infrastructure/typeorm/game-questions.repository.js';
import { PlayerAnswersRepository } from '../../infrastructure/typeorm/player-answers.repository.js';
import { AnswerStatus } from '../../infrastructure/typeorm/entities/player-answer.entity.js';
import { NoActivePairDomainException } from '../../../common/exceptions/domain-exceptions.js';
import { mapAnswerToViewModel } from '../../mappers/answer-view.mapper.js';
import { DataSource } from 'typeorm';
import { Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { quizConfig } from '../../../config/quiz.config.js';

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
  async execute(command: SubmitAnswerCommand): Promise<PlayerAnswerViewModel> {
    return this.dataSource.transaction(async (manager) => {
      const game = await this.gamesRepository.findActiveGameWithLock(command.userId, manager);

      if (!game) {
        throw new NoActivePairDomainException();
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
      const submittedAnswer = await this.playerAnswersRepository.submitAnswer(
        game.id.toString(),
        command.userId,
        nextQuestion.questionId.toString(),
        command.answer,
        status,
        manager,
      );

      if (nextQuestion.questionNumber === this.quiz.questionsCount) {
        const anotherPlayerId =
          game.firstPlayerId === +command.userId ? game.secondPlayerId!.toString() : game.firstPlayerId.toString();

        const anotherPlayerAnswersCount = await this.playerAnswersRepository.countAnswersByPlayer(
          game.id.toString(),
          anotherPlayerId,
          manager,
        );

        if (anotherPlayerAnswersCount === this.quiz.questionsCount) {
          game.finishGame();
          await this.gamesRepository.save(game, manager);
        }
      }

      return mapAnswerToViewModel(submittedAnswer);
    });
  }
}
