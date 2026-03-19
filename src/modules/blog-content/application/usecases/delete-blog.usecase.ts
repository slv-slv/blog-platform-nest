import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../../infrastructure/sql/blogs.repository.js';

export class DeleteBlogCommand extends Command<void> {
  constructor(public readonly id: string) {
    super();
  }
}

@CommandHandler(DeleteBlogCommand)
export class DeleteBlogUseCase implements ICommandHandler<DeleteBlogCommand> {
  constructor(private readonly blogsRepository: BlogsRepository) {}
  async execute(command: DeleteBlogCommand): Promise<void> {
    const { id } = command;
    await this.blogsRepository.deleteBlog(id);
  }
}
