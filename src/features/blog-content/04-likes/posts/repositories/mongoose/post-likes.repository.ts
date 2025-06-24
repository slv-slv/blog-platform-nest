import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PostLikes } from './post-likes.schemas.js';
import { PostLikesType } from '../../types/post-likes.types.js';
import { Model } from 'mongoose';
import { LikeStatus } from '../../../types/likes.types.js';

@Injectable()
export class PostLikesRepository {
  constructor(@InjectModel(PostLikes.name) private readonly model: Model<PostLikesType>) {}
  async getLikesCount(postId: string): Promise<number> {
    const post = await this.model.findOne({ postId }).lean();
    if (!post) return 0;

    const result = await this.model.aggregate([
      { $match: { postId } },
      { $project: { likesCount: { $size: '$likes' } } },
    ]);
    return result[0].likesCount;
  }

  async getDislikesCount(postId: string): Promise<number> {
    const post = await this.model.findOne({ postId }).lean();
    if (!post) return 0;

    const result = await this.model.aggregate([
      { $match: { postId } },
      { $project: { dislikesCount: { $size: '$dislikes' } } },
    ]);
    return result[0].dislikesCount;
  }

  async getLikeStatus(postId: string, userId: string): Promise<LikeStatus> {
    if (userId === null) return LikeStatus.None;

    const post = await this.model
      .findOne(
        { postId },
        {
          likes: { $elemMatch: { userId } },
          dislikes: { $elemMatch: { userId } },
        },
      )
      .lean();

    if (!post) return LikeStatus.None;

    if (post.likes) return LikeStatus.Like;
    if (post.dislikes) return LikeStatus.Dislike;

    return LikeStatus.None;
  }

  async createEmptyLikesInfo(postId: string): Promise<void> {
    const likesInfo: PostLikesType = {
      postId,
      likes: [],
      dislikes: [],
    };
    await this.model.insertOne(likesInfo);
  }

  // async deleteLikesInfo(postId: string): Promise<void> {
  //   await this.model.deleteOne({ postId });
  // }

  async setLike(postId: string, userId: string, createdAt: Date): Promise<void> {
    const like = { userId, createdAt };

    await this.model.updateOne(
      { postId },
      { $setOnInsert: { postId, likes: [], dislikes: [] } },
      { upsert: true },
    );

    await this.model.updateOne(
      { postId },
      { $push: { likes: like }, $pull: { dislikes: { userId: userId } } },
    );
  }

  async setDislike(postId: string, userId: string, createdAt: Date): Promise<void> {
    const dislike = { userId, createdAt };

    await this.model.updateOne(
      { postId },
      { $setOnInsert: { postId, likes: [], dislikes: [] } },
      { upsert: true },
    );

    await this.model.updateOne(
      { postId },
      { $push: { dislikes: dislike }, $pull: { likes: { userId: userId } } },
    );
  }

  async setNone(postId: string, userId: string): Promise<void> {
    await this.model.updateOne(
      { postId },
      { $pull: { likes: { userId: userId }, dislikes: { userId: userId } } },
    );
  }
}
