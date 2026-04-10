import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionsRepository } from '../../infrastructure/typeorm/questions.repository.js';
import { mapQuestionToViewModel } from '../../mappers/question-view.mapper.js';
import { QuestionViewModel } from '../../types/question.types.js';

export class CreateQuestionCommand extends Command<QuestionViewModel> {
  constructor(
    public readonly body: string,
    public readonly correctAnswers: string[],
  ) {
    super();
  }
}

@CommandHandler(CreateQuestionCommand)
export class CreateQuestionUseCase implements ICommandHandler<CreateQuestionCommand> {
  constructor(private readonly questionsRepository: QuestionsRepository) {}

  async execute(command: CreateQuestionCommand) {
    const { body, correctAnswers } = command;
    const question = await this.questionsRepository.createQuestion(body, correctAnswers);

    return mapQuestionToViewModel(question);
  }
}
