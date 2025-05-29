import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from './posts.schemas.js';
import { PostsPaginatedType, PostViewType } from '../../types/posts.types.js';
import { ObjectId } from 'mongodb';
import { PagingParamsType } from '../../../../../common/types/paging-params.types.js';
import { PostLikesQueryRepository } from '../../../likes/posts/repositories/mongoose/post-likes.query-repository.js';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectModel(Post.name) private readonly model: Model<Post>,
    private readonly postLikesQueryRepository: PostLikesQueryRepository,
  ) {}

  async findPost(id: string, userId: string): Promise<PostViewType | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    const _id = new ObjectId(id);
    const post = await this.model.findOne({ _id }, { _id: 0 }).lean();
    if (!post) {
      return null;
    }

    const extendedLikesInfo = await this.postLikesQueryRepository.getLikesInfo(id, userId);

    return { id, ...post, extendedLikesInfo };
  }

  async getPosts(
    userId: string,
    pagingParams: PagingParamsType,
    blogId?: string,
  ): Promise<PostsPaginatedType> {
    const { sortBy, sortDirection, pageNumber, pageSize } = pagingParams;

    const filter = blogId ? { blogId } : {};

    const totalCount = await this.model.countDocuments(filter);
    const pagesCount = Math.ceil(totalCount / pageSize);

    const postsWithObjectId = await this.model
      .find(filter)
      .sort({ [sortBy]: sortDirection === 'asc' ? 1 : -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean();

    const posts = await Promise.all(
      postsWithObjectId.map(async (post) => {
        return {
          id: post._id.toString(),
          title: post.title,
          shortDescription: post.shortDescription,
          content: post.content,
          blogId: post.blogId,
          blogName: post.blogName,
          createdAt: post.createdAt,
          extendedLikesInfo: await this.postLikesQueryRepository.getLikesInfo(post._id.toString(), userId),
        };
      }),
    );

    return {
      pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items: posts,
    };
  }
}
