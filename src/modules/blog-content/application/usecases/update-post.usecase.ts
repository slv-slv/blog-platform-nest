import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdatePostParams, UpdatePostRepoParams } from '../../types/posts.types.js';
import { BlogsRepository } from '../../infrastructure/sql/blogs.repository.js';
import { PostsRepository } from '../../infrastructure/sql/posts.repository.js';

export class UpdatePostCommand extends Command<void> {
  constructor(public readonly params: UpdatePostParams) {
    super();
  }
}

@CommandHandler(UpdatePostCommand)
export class UpdatePostUseCase implements ICommandHandler<UpdatePostCommand> {
  constructor(
    private readonly blogsRepository: BlogsRepository,
    private readonly postsRepository: PostsRepository,
  ) {}
  async execute(command: UpdatePostCommand): Promise<void> {
    const { params } = command;
    const { postId, title, shortDescription, content, blogId } = params;
    await this.blogsRepository.checkBlogExists(blogId);

    const repoParams: UpdatePostRepoParams = { id: postId, title, shortDescription, content };
    await this.postsRepository.updatePost(repoParams);
  }
}
