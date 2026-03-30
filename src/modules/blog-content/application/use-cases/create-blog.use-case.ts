import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogViewModel, CreateBlogParams, CreateBlogRepoParams } from '../../types/blogs.types.js';
import { BlogsRepository } from '../../infrastructure/typeorm/blogs.repository.js';

export class CreateBlogCommand extends Command<BlogViewModel> {
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
    const newBlog = await this.blogsRepository.createBlog(repoParams);

    return { ...newBlog, createdAt: newBlog.createdAt.toISOString() };
  }
}
