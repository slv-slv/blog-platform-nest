import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionsRepository } from '../../infrastructure/typeorm/questions.repository.js';
import { UpdateQuestionParams } from '../../types/question.types.js';

export class UpdateQuestionCommand extends Command<void> {
  constructor(public readonly params: UpdateQuestionParams) {
    super();
  }
}

@CommandHandler(UpdateQuestionCommand)
export class UpdateQuestionUseCase implements ICommandHandler<UpdateQuestionCommand> {
  constructor(private readonly questionsRepository: QuestionsRepository) {}

  async execute(command: UpdateQuestionCommand) {
    await this.questionsRepository.updateQuestion(command.params);
  }
}
