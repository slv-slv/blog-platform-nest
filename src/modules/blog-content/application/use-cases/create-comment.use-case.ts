import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentViewType, CreateCommentParams, CreateCommentRepoParams } from '../../types/comments.types.js';
import { CommentsRepository } from '../../infrastructure/sql/comments.repository.js';
import { UsersRepository } from '../../../user-accounts/infrastructure/sql/users.repository.js';
import { PostsRepository } from '../../infrastructure/sql/posts.repository.js';
import { createDefaultCommentLikesInfo } from '../../helpers/create-default-comment-likes-info.js';

export class CreateCommentCommand extends Command<CommentViewType> {
  constructor(public readonly params: CreateCommentParams) {
    super();
  }
}

@CommandHandler(CreateCommentCommand)
export class CreateCommentUseCase implements ICommandHandler<CreateCommentCommand> {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly postsRepository: PostsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}
  async execute(command: CreateCommentCommand) {
    const { params } = command;
    const { postId, content, userId } = params;
    await this.postsRepository.checkPostExists(postId);

    const userLogin = await this.usersRepository.getLogin(userId);

    const commentatorInfo = { userId, userLogin };
    const createdAt = new Date().toISOString();

    const repoParams: CreateCommentRepoParams = { postId, content, createdAt, commentatorInfo };
    const newComment = await this.commentsRepository.createComment(repoParams);

    const likesInfo = createDefaultCommentLikesInfo();
    return { ...newComment, likesInfo };
  }
}
