import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateCommentParams, UpdateCommentRepoParams } from '../../types/comments.types.js';
import { CommentsRepository } from '../../infrastructure/sql/comments.repository.js';
import { AccessDeniedDomainException } from '../../../../common/exceptions/domain-exceptions.js';

export class UpdateCommentCommand extends Command<void> {
  constructor(public readonly params: UpdateCommentParams) {
    super();
  }
}

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentUseCase implements ICommandHandler<UpdateCommentCommand> {
  constructor(private readonly commentsRepository: CommentsRepository) {}
  async execute(command: UpdateCommentCommand) {
    const { params } = command;
    const { commentId, content, userId } = params;
    const comment = await this.commentsRepository.getComment(commentId);

    const ownerId = comment.commentatorInfo.userId;
    if (userId !== ownerId) throw new AccessDeniedDomainException();

    const repoParams: UpdateCommentRepoParams = { id: commentId, content };
    await this.commentsRepository.updateComment(repoParams);
  }
}
