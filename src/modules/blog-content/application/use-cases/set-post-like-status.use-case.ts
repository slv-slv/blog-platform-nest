import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LikeStatus, SetPostLikeStatusParams } from '../../types/likes.types.js';
import { PostsRepository } from '../../infrastructure/typeorm/posts.repository.js';
import { PostLikesRepository } from '../../infrastructure/typeorm/post-likes.repository.js';

export class SetPostLikeStatusCommand extends Command<void> {
  constructor(public readonly params: SetPostLikeStatusParams) {
    super();
  }
}

@CommandHandler(SetPostLikeStatusCommand)
export class SetPostLikeStatusUseCase implements ICommandHandler<SetPostLikeStatusCommand> {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly postLikesRepository: PostLikesRepository,
  ) {}

  async execute(command: SetPostLikeStatusCommand) {
    const { params } = command;
    const { postId, userId, likeStatus } = params;
    await this.postsRepository.checkPostExists(postId);

    const currentLikeStatus = (await this.postLikesRepository.getLikeStatus([parseInt(postId)], userId))[0]
      .myStatus;
    if (likeStatus === currentLikeStatus) return;

    const createdAt = new Date();

    switch (likeStatus) {
      case LikeStatus.None:
        await this.postLikesRepository.setNone({ postId, userId });
        break;
      case LikeStatus.Like:
        await this.postLikesRepository.setLike({ postId, userId, createdAt });
        break;
      case LikeStatus.Dislike:
        await this.postLikesRepository.setDislike({ postId, userId, createdAt });
        break;
    }
  }
}
