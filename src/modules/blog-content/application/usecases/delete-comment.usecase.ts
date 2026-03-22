import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteCommentParams } from '../../types/comments.types.js';
import { CommentsRepository } from '../../infrastructure/sql/comments.repository.js';
import { AccessDeniedDomainException } from '../../../../common/exceptions/domain-exceptions.js';

export class DeleteCommentCommand extends Command<void> {
  constructor(public readonly params: DeleteCommentParams) {
    super();
  }
}

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentUseCase implements ICommandHandler<DeleteCommentCommand> {
  constructor(private readonly commentsRepository: CommentsRepository) {}

  async execute(command: DeleteCommentCommand) {
    const { params } = command;
    const { commentId, userId } = params;
    const comment = await this.commentsRepository.findComment(commentId);

    const ownerId = comment.commentatorInfo.userId;
    if (userId !== ownerId) throw new AccessDeniedDomainException();

    await this.commentsRepository.deleteComment(commentId);
  }
}
