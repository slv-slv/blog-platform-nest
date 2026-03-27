import { Inject, Injectable } from '@nestjs/common';
import {
  FindPostRepoQueryParams,
  GetPostsRepoQueryParams,
  PostsPaginatedViewModel,
  PostViewModel,
} from '../../types/posts.types.js';
import { Pool } from 'pg';
import { PostLikesQueryRepository } from './post-likes.query-repository.js';
import { PG_POOL } from '../../../../common/constants.js';
import { PostNotFoundDomainException } from '../../../../common/exceptions/domain-exceptions.js';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly postLikesQueryRepository: PostLikesQueryRepository,
  ) {}

  async checkPostExists(id: string): Promise<void> {
    if (!isPositiveIntegerString(id)) {
      throw new PostNotFoundDomainException();
    }

    const result = await this.pool.query(
      `
        SELECT EXISTS(SELECT 1 FROM posts WHERE id = $1::int) AS exists
      `,
      [id],
    );

    if (result.rows[0].exists === false) {
      throw new PostNotFoundDomainException();
    }
  }

  async getPost(params: FindPostRepoQueryParams): Promise<PostViewModel> {
    const { postId, userId } = params;

    if (!isPositiveIntegerString(postId)) {
      throw new PostNotFoundDomainException();
    }

    const result = await this.pool.query(
      `
        SELECT
          posts.id,
          posts.title,
          posts.short_description,
          posts.content,
          posts.blog_id,
          blogs.name AS blog_name,
          posts.created_at
        FROM posts JOIN blogs
          ON posts.blog_id = blogs.id
        WHERE posts.id = $1::int
      `,
      [postId],
    );

    if (result.rowCount === 0) {
      throw new PostNotFoundDomainException();
    }

    const rawPost = result.rows[0];
    const postIdInt = rawPost.id;

    const post = {
      id: postId,
      title: rawPost.title,
      shortDescription: rawPost.short_description,
      content: rawPost.content,
      blogId: rawPost.blog_id.toString(),
      blogName: rawPost.blog_name,
      createdAt: rawPost.created_at.toISOString(),
    };

    const likesInfoMap = await this.postLikesQueryRepository.getLikesInfo({ postIds: [postIdInt], userId });

    return { ...post, extendedLikesInfo: likesInfoMap.get(postIdInt)! };
  }
  async getPosts(params: GetPostsRepoQueryParams): Promise<PostsPaginatedViewModel> {
    const { pagingParams, userId, blogId } = params;
    const { sortBy, sortDirection, pageNumber, pageSize } = pagingParams;

    if (blogId && !isPositiveIntegerString(blogId)) {
      return {
        pagesCount: 0,
        page: pageNumber,
        pageSize,
        totalCount: 0,
        items: [],
      };
    }

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

    const countResult = await this.pool.query(
      `
        SELECT COUNT(posts.id)::int
        FROM posts
        WHERE ($1::int IS NULL OR posts.blog_id = $1::int)
      `,
      [blogId ?? null],
    );

    const totalCount = countResult.rows[0].count;
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
        WHERE ($1::int IS NULL OR posts.blog_id = $1::int)
        ORDER BY ${orderBy} ${sortDirection}
        LIMIT $2
        OFFSET $3
      `,
      [blogId ?? null, pageSize, skipCount],
    );

    const rawPosts = postsResult.rows;
    const postIdArr = rawPosts.map((post) => post.id);
    const likesInfoMap = await this.postLikesQueryRepository.getLikesInfo({ postIds: postIdArr, userId });

    const posts = rawPosts.map((post) => ({
      id: post.id.toString(),
      title: post.title,
      shortDescription: post.short_description,
      content: post.content,
      blogId: post.blog_id.toString(),
      blogName: post.blog_name,
      createdAt: post.created_at.toISOString(),
      extendedLikesInfo: likesInfoMap.get(post.id)!,
    }));

    return {
      pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items: posts,
    };
  }
}
