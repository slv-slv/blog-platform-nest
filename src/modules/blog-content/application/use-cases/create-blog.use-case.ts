import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogViewType, CreateBlogParams, CreateBlogRepoParams } from '../../types/blogs.types.js';
import { BlogsRepository } from '../../infrastructure/sql/blogs.repository.js';

export class CreateBlogCommand extends Command<BlogViewType> {
  constructor(public readonly params: CreateBlogParams) {
    super();
  }
}

@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase implements ICommandHandler<CreateBlogCommand> {
  constructor(private readonly blogsRepository: BlogsRepository) {}
  async execute(command: CreateBlogCommand) {
    const { params } = command;
    const { name, description, websiteUrl } = params;
    const createdAt = new Date();
    const isMembership = false;
    const repoParams: CreateBlogRepoParams = { name, description, websiteUrl, createdAt, isMembership };

    return await this.blogsRepository.createBlog(repoParams);
  }
}
