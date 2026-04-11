import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionsRepository } from '../../infrastructure/typeorm/questions.repository.js';

export class PublishQuestionCommand extends Command<void> {
  constructor(
    public readonly id: string,
    public readonly published: boolean,
  ) {
    super();
  }
}

@CommandHandler(PublishQuestionCommand)
export class PublishQuestionUseCase implements ICommandHandler<PublishQuestionCommand> {
  constructor(private readonly questionsRepository: QuestionsRepository) {}

  async execute(command: PublishQuestionCommand) {
    const question = await this.questionsRepository.getQuestion(command.id);
    await question.setPublishedStatus(command.published);
    await this.questionsRepository.save(question);
  }
}
