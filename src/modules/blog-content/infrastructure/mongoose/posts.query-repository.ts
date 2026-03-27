import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from './posts.schemas.js';
import {
  FindPostRepoQueryParams,
  GetPostsRepoQueryParams,
  PostsPaginatedViewModel,
  PostViewModel,
} from '../../types/posts.types.js';
import { ObjectId } from 'mongodb';
import { PostLikesQueryRepository } from './post-likes.query-repository.js';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectModel(Post.name) private readonly model: Model<Post>,
    private readonly postLikesQueryRepository: PostLikesQueryRepository,
  ) {}

  async getPost(params: FindPostRepoQueryParams): Promise<PostViewModel | null> {
    const { postId: id, userId } = params;
    if (!ObjectId.isValid(id)) {
      return null;
    }
    const _id = new ObjectId(id);
    const post = await this.model.findOne({ _id }, { _id: 0 }).lean();
    if (!post) {
      return null;
    }

    const likesInfoMap = await this.postLikesQueryRepository.getLikesInfo({ postIds: [id], userId });

    return { id, ...post, extendedLikesInfo: likesInfoMap.get(id)! };
  }

  async getPosts(params: GetPostsRepoQueryParams): Promise<PostsPaginatedViewModel> {
    const { userId, pagingParams, blogId } = params;
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

    const postIds = postsWithObjectId.map((post) => post._id.toString());
    const likesInfoMap = await this.postLikesQueryRepository.getLikesInfo({ postIds, userId });

    const posts = postsWithObjectId.map((post) => {
      const postId = post._id.toString();

      return {
        id: postId,
        title: post.title,
        shortDescription: post.shortDescription,
        content: post.content,
        blogId: post.blogId,
        blogName: post.blogName,
        createdAt: post.createdAt,
        extendedLikesInfo: likesInfoMap.get(postId)!,
      };
    });

    return {
      pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items: posts,
    };
  }
}
