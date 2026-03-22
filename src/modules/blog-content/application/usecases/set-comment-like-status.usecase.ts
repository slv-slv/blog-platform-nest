import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LikeStatus, SetCommentLikeStatusParams } from '../../types/likes.types.js';
import { CommentsRepository } from '../../infrastructure/sql/comments.repository.js';
import { CommentLikesRepository } from '../../infrastructure/sql/comment-likes.repository.js';

export class SetCommentLikeStatusCommand extends Command<void> {
  constructor(public readonly params: SetCommentLikeStatusParams) {
    super();
  }
}

@CommandHandler(SetCommentLikeStatusCommand)
export class SetCommentLikeStatusUseCase implements ICommandHandler<SetCommentLikeStatusCommand> {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly commentLikesRepository: CommentLikesRepository,
  ) {}

  async execute(command: SetCommentLikeStatusCommand) {
    const { params } = command;
    const { commentId, userId, likeStatus } = params;
    await this.commentsRepository.checkCommentExists(commentId);

    const currentLikeStatus = (
      await this.commentLikesRepository.getLikeStatus([parseInt(commentId)], userId)
    )[0].myStatus;
    if (likeStatus === currentLikeStatus) return;

    const createdAt = new Date();

    switch (likeStatus) {
      case LikeStatus.None:
        await this.commentLikesRepository.setNone({ commentId, userId });
        break;
      case LikeStatus.Like:
        await this.commentLikesRepository.setLike({ commentId, userId, createdAt });
        break;
      case LikeStatus.Dislike:
        await this.commentLikesRepository.setDislike({ commentId, userId, createdAt });
        break;
    }
  }
}
