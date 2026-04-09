import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreatePostParams, CreatePostRepoParams, PostViewModel } from '../../types/posts.types.js';
import { PostsRepository } from '../../infrastructure/typeorm/posts.repository.js';
import { BlogsRepository } from '../../infrastructure/typeorm/blogs.repository.js';
import { mapPostToViewModel } from '../../mappers/post-view.mapper.js';

export class CreatePostCommand extends Command<PostViewModel> {
  constructor(public readonly params: CreatePostParams) {
    super();
  }
}

@CommandHandler(CreatePostCommand)
export class CreatePostUseCase implements ICommandHandler<CreatePostCommand> {
  constructor(
    private readonly blogsRepository: BlogsRepository,
    private readonly postsRepository: PostsRepository,
  ) {}
  async execute(command: CreatePostCommand) {
    const { params } = command;
    const { title, shortDescription, content, blogId } = params;
    const blog = await this.blogsRepository.getBlog(blogId);
    const blogName = blog.name;

    const createdAt = new Date();
    const repoParams: CreatePostRepoParams = {
      title,
      shortDescription,
      content,
      blogId,
      blogName,
      createdAt,
    };
    const newPost = await this.postsRepository.createPost(repoParams);

    return mapPostToViewModel(newPost, blogName);
  }
}
