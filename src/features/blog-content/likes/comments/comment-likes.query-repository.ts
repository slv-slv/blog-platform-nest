import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CommentLikes } from './comment-likes.schema.js';
import { Model } from 'mongoose';
import { CommentLikesType } from './comment-likes.types.js';
import { LikesInfoViewType } from '../types/likes.types.js';
import { CommentLikesRepository } from './comment-likes.repository.js';

@Injectable()
export class CommentLikesQueryRepository {
  constructor(
    @InjectModel(CommentLikes.name) private readonly model: Model<CommentLikesType>,
    private readonly commentLikesRepository: CommentLikesRepository,
  ) {}
  async getLikesInfo(commentId: string, userId: string): Promise<LikesInfoViewType> {
    const likesCount = await this.commentLikesRepository.getLikesCount(commentId);
    const dislikesCount = await this.commentLikesRepository.getDislikesCount(commentId);
    const myStatus = await this.commentLikesRepository.getLikeStatus(commentId, userId);

    return { likesCount, dislikesCount, myStatus };
  }
}
