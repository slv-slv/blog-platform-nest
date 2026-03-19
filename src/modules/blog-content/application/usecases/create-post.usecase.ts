import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreatePostParams, CreatePostRepoParams, PostViewType } from '../../types/posts.types.js';
import { PostsRepository } from '../../infrastructure/sql/posts.repository.js';
import { BlogsRepository } from '../../infrastructure/sql/blogs.repository.js';
import { PostLikesService } from '../post-likes.service.js';

export class CreatePostCommand extends Command<PostViewType> {
  constructor(public readonly params: CreatePostParams) {
    super();
  }
}

@CommandHandler(CreatePostCommand)
export class CreatePostUseCase implements ICommandHandler<CreatePostCommand> {
  constructor(
    private readonly blogsRepository: BlogsRepository,
    private readonly postsRepository: PostsRepository,
    private readonly postLikesService: PostLikesService,
  ) {}
  async execute(command: CreatePostCommand): Promise<PostViewType> {
    const { params } = command;
    const { title, shortDescription, content, blogId } = params;
    const blog = await this.blogsRepository.findBlog(blogId);
    const blogName = blog.name;

    const createdAt = new Date().toISOString();
    const repoParams: CreatePostRepoParams = {
      title,
      shortDescription,
      content,
      blogId,
      blogName,
      createdAt,
    };
    const newPost = await this.postsRepository.createPost(repoParams);
    const extendedLikesInfo = this.postLikesService.getDefaultLikesInfo();

    return { ...newPost, extendedLikesInfo };
  }
}
