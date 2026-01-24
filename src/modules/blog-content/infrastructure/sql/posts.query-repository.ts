import { Inject, Injectable } from '@nestjs/common';
import { PostsPaginatedType, PostViewType } from '../../types/posts.types.js';
import { Pool } from 'pg';
import { PostLikesQueryRepository } from './post-likes.query-repository.js';
import { PG_POOL } from '../../../../common/constants.js';
import { PagingParamsType } from '../../../../common/types/paging-params.types.js';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly postLikesQueryRepository: PostLikesQueryRepository,
  ) {}

  async findPost(id: string, userId: string | null): Promise<PostViewType | null> {
    const result = await this.pool.query(
      `
        SELECT
          posts.title,
          posts.short_description,
          posts.content,
          posts.blog_id,
          blogs.name AS blog_name,
          posts.created_at
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
  async getPosts(
    userId: string | null,
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
        SELECT COUNT(id)
        FROM posts
        ${whereClause}
      `,
    );

    const totalCount = parseInt(countResult.rows[0].count);
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
        blogId: post.blog_id.toString(),
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
