import { Injectable } from '@nestjs/common';
import {
  CommentViewType,
  CreateCommentParams,
  CreateCommentRepoParams,
  DeleteCommentParams,
  UpdateCommentParams,
  UpdateCommentRepoParams,
} from '../types/comments.types.js';
import { PostsRepository } from '../infrastructure/sql/posts.repository.js';
import { CommentsRepository } from '../infrastructure/sql/comments.repository.js';
import { UsersRepository } from '../../user-accounts/infrastructure/sql/users.repository.js';
import { AccessDeniedDomainException } from '../../../common/exceptions/domain-exceptions.js';
import { createDefaultCommentLikesInfo } from '../helpers/create-default-comment-likes-info.js';

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly postsRepository: PostsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async createComment(params: CreateCommentParams): Promise<CommentViewType> {
    const { postId, content, userId } = params;
    await this.postsRepository.checkPostExists(postId);

    const userLogin = await this.usersRepository.getLogin(userId);

    const commentatorInfo = { userId, userLogin };
    const createdAt = new Date().toISOString();

    const repoParams: CreateCommentRepoParams = { postId, content, createdAt, commentatorInfo };
    const newComment = await this.commentsRepository.createComment(repoParams);

    // const commentId = newComment.id;
    // await this.commentLikesService.createEmptyLikesInfo(commentId);
    const likesInfo = createDefaultCommentLikesInfo();
    return { ...newComment, likesInfo };
  }

  async updateComment(params: UpdateCommentParams): Promise<void> {
    const { commentId, content, userId } = params;
    const comment = await this.commentsRepository.findComment(commentId);

    const ownerId = comment.commentatorInfo.userId;
    if (userId !== ownerId) throw new AccessDeniedDomainException();

    const repoParams: UpdateCommentRepoParams = { id: commentId, content };
    await this.commentsRepository.updateComment(repoParams);
  }

  async deleteComment(params: DeleteCommentParams): Promise<void> {
    const { commentId, userId } = params;
    const comment = await this.commentsRepository.findComment(commentId);

    const ownerId = comment.commentatorInfo.userId;
    if (userId !== ownerId) throw new AccessDeniedDomainException();

    // await this.commentLikesService.deleteLikesInfo(commentId);
    await this.commentsRepository.deleteComment(commentId);
  }
}
