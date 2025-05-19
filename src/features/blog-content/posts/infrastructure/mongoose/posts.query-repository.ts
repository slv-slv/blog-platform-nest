import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from './posts.schemas.js';
import { PostsPaginatedType, PostViewType } from '../../posts.types.js';
import { ObjectId } from 'mongodb';
import { PagingParamsType } from '../../../../../common/types/paging-params.types.js';
import { PostLikesQueryRepository } from '../../../likes/posts/infrastructure/mongoose/post-likes.query-repository.js';
import { pool } from '../../../../../common/constants.js';
import { Pool } from 'pg';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectModel(Post.name) private readonly model: Model<Post>,
    @Inject(pool) private readonly pool: Pool,
    private readonly postLikesQueryRepository: PostLikesQueryRepository,
  ) {}

  // async findPost(id: string, userId: string): Promise<PostViewType | null> {
  //   if (!ObjectId.isValid(id)) {
  //     return null;
  //   }
  //   const _id = new ObjectId(id);
  //   const post = await this.model.findOne({ _id }, { _id: 0 }).lean();
  //   if (!post) {
  //     return null;
  //   }

  //   const extendedLikesInfo = await this.postLikesQueryRepository.getLikesInfo(id, userId);

  //   return { id, ...post, extendedLikesInfo };
  // }

  async findPost(id: string, userId: string): Promise<PostViewType | null> {
    const result = await this.pool.query(
      `
        SELECT
          posts.title,
          posts.short_description,
          posts.content,
          posts.blog_id,
          blogs.name AS blog_name,
          posts.created_at,
        FROM posts JOIN blogs
          ON posts.blog_id = blogs.id
        WHERE posts.id = $1
      `,
      [parseInt(id)],
    );

    if (result.rowCount === 0) {
      return null;
    }

    const rawPost = result.rows[0];

    const post = {
      id,
      title: rawPost.title,
      shortDescription: rawPost.short_description,
      content: rawPost.content,
      blogId: rawPost.blog_id.toString(),
      blogName: rawPost.blog_name,
      createdAt: rawPost.created_at,
    };

    const extendedLikesInfo = await this.postLikesQueryRepository.getLikesInfo(id, userId);

    return { ...post, extendedLikesInfo };
  }

  // async getPosts(
  //   userId: string,
  //   pagingParams: PagingParamsType,
  //   blogId?: string,
  // ): Promise<PostsPaginatedType> {
  //   const { sortBy, sortDirection, pageNumber, pageSize } = pagingParams;

  //   const filter = blogId ? { blogId } : {};

  //   const totalCount = await this.model.countDocuments(filter);
  //   const pagesCount = Math.ceil(totalCount / pageSize);

  //   const postsWithObjectId = await this.model
  //     .find(filter)
  //     .sort({ [sortBy]: sortDirection === 'asc' ? 1 : -1 })
  //     .skip((pageNumber - 1) * pageSize)
  //     .limit(pageSize)
  //     .lean();

  //   const posts = await Promise.all(
  //     postsWithObjectId.map(async (post) => {
  //       return {
  //         id: post._id.toString(),
  //         title: post.title,
  //         shortDescription: post.shortDescription,
  //         content: post.content,
  //         blogId: post.blogId,
  //         blogName: post.blogName,
  //         createdAt: post.createdAt,
  //         extendedLikesInfo: await this.postLikesQueryRepository.getLikesInfo(post._id.toString(), userId),
  //       };
  //     }),
  //   );

  //   return {
  //     pagesCount,
  //     page: pageNumber,
  //     pageSize,
  //     totalCount,
  //     items: posts,
  //   };
  // }

  async getPosts(
    userId: string,
    pagingParams: PagingParamsType,
    blogId?: string,
  ): Promise<PostsPaginatedType> {
    const { sortBy, sortDirection, pageNumber, pageSize } = pagingParams;

    let orderBy: string;

    switch (sortBy) {
      case 'shortDescription':
        orderBy = 'short_description';
        break;
      case 'blogId':
        orderBy = 'blog_id';
        break;
      case 'blogName':
        orderBy = 'blogs.name';
        break;
      case 'createdAt':
        orderBy = 'created_at';
        break;
      default:
        orderBy = sortBy;
    }

    const whereClause = blogId ? `WHERE posts.blog_id = ${parseInt(blogId)}` : ``;

    const countResult = await this.pool.query(
      `
        SELECT id
        FROM posts
        ${whereClause}
      `,
    );

    const totalCount = countResult.rowCount!;
    const pagesCount = Math.ceil(totalCount / pageSize);
    const skipCount = (pageNumber - 1) * pageSize;

    const postsResult = await this.pool.query(
      `
        SELECT
          posts.id,
          posts.title,
          posts.short_description,
          posts.content,
          posts.blog_id,
          blogs.name AS blog_name,
          posts.created_at
        FROM posts JOIN blogs ON posts.blog_id = blogs.id
        ${whereClause}
        ORDER BY ${orderBy} ${sortDirection}
        LIMIT $1
        OFFSET $2
      `,
      [pageSize, skipCount],
    );

    const rawPosts = postsResult.rows;

    const posts = await Promise.all(
      rawPosts.map(async (post) => ({
        id: post.id.toString(),
        title: post.title,
        shortDescription: post.short_description,
        content: post.content,
        blogId: post.blog_id,
        blogName: post.blog_name,
        createdAt: post.created_at,
        extendedLikesInfo: await this.postLikesQueryRepository.getLikesInfo(post.id.toString(), userId),
      })),
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
