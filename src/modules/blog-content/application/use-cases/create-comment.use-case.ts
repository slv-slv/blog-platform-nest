import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  CommentViewModel,
  CreateCommentParams,
  CreateCommentRepoParams,
} from '../../types/comments.types.js';
import { CommentsRepository } from '../../infrastructure/typeorm/comments.repository.js';
import { UsersRepository } from '../../../user-accounts/infrastructure/typeorm/users.repository.js';
import { PostsRepository } from '../../infrastructure/typeorm/posts.repository.js';
import { mapCommentToViewModel } from '../../mappers/comment-view.mapper.js';

export class CreateCommentCommand extends Command<CommentViewModel> {
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
    const createdAt = new Date();

    const repoParams: CreateCommentRepoParams = { postId, content, createdAt, commentatorInfo };
    const newComment = await this.commentsRepository.createComment(repoParams);

    return mapCommentToViewModel(newComment, userLogin);
  }
}
