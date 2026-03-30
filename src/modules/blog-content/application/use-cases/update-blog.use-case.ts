import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateBlogParams } from '../../types/blogs.types.js';
import { BlogsRepository } from '../../infrastructure/typeorm/blogs.repository.js';

export class UpdateBlogCommand extends Command<void> {
  constructor(public readonly params: UpdateBlogParams) {
    super();
  }
}

@CommandHandler(UpdateBlogCommand)
export class UpdateBlogUseCase implements ICommandHandler<UpdateBlogCommand> {
  constructor(private readonly blogsRepository: BlogsRepository) {}
  async execute(command: UpdateBlogCommand) {
    const { params } = command;
    await this.blogsRepository.updateBlog(params);
  }
}
