import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LikeStatus, SetCommentLikeStatusParams } from '../../types/likes.types.js';
import { CommentsRepository } from '../../infrastructure/typeorm/comments.repository.js';
import { CommentReactionsRepository } from '../../infrastructure/typeorm/comment-reactions.repository.js';

export class SetCommentLikeStatusCommand extends Command<void> {
  constructor(public readonly params: SetCommentLikeStatusParams) {
    super();
  }
}

@CommandHandler(SetCommentLikeStatusCommand)
export class SetCommentLikeStatusUseCase implements ICommandHandler<SetCommentLikeStatusCommand> {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly commentReactionsRepository: CommentReactionsRepository,
  ) {}

  async execute(command: SetCommentLikeStatusCommand) {
    const { params } = command;
    const { commentId, userId, likeStatus } = params;
    await this.commentsRepository.checkCommentExists(commentId);

    const currentLikeStatus = (
      await this.commentReactionsRepository.getLikeStatus([parseInt(commentId)], userId)
    )[0].myStatus;
    if (likeStatus === currentLikeStatus) return;

    const createdAt = new Date();

    switch (likeStatus) {
      case LikeStatus.None:
        await this.commentReactionsRepository.setNone({ commentId, userId });
        break;
      case LikeStatus.Like:
        await this.commentReactionsRepository.setLike({ commentId, userId, createdAt });
        break;
      case LikeStatus.Dislike:
        await this.commentReactionsRepository.setDislike({ commentId, userId, createdAt });
        break;
    }
  }
}
