import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeletePostParams } from '../../types/posts.types.js';
import { PostsRepository } from '../../infrastructure/typeorm/posts.repository.js';
import { BlogsRepository } from '../../infrastructure/typeorm/blogs.repository.js';

export class DeletePostCommand extends Command<void> {
  constructor(public readonly params: DeletePostParams) {
    super();
  }
}

@CommandHandler(DeletePostCommand)
export class DeletePostUseCase implements ICommandHandler<DeletePostCommand> {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly blogsRepository: BlogsRepository,
  ) {}
  async execute(command: DeletePostCommand) {
    const { params } = command;
    const { blogId, postId } = params;
    await this.blogsRepository.checkBlogExists(blogId);
    await this.postsRepository.deletePost(postId);
  }
}
