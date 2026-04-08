import { Injectable } from '@nestjs/common';
import {
  FindPostRepoQueryParams,
  GetPostsRepoQueryParams,
  PostsPaginatedViewModel,
  PostViewModel,
} from '../../types/posts.types.js';
import { PostReactionsQueryRepository } from './post-reactions.query-repository.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './entities/post.entity.js';
import { Repository } from 'typeorm';
import { PostNotFoundDomainException } from '../../../../common/exceptions/domain-exceptions.js';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';
import { SortDirection } from '../../../../common/types/paging-params.types.js';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectRepository(Post) private readonly postEntityRepository: Repository<Post>,
    private readonly postReactionsQueryRepository: PostReactionsQueryRepository,
  ) {}

  async checkPostExists(id: string): Promise<void> {
    if (!isPositiveIntegerString(id)) {
      throw new PostNotFoundDomainException();
    }

    const exists = await this.postEntityRepository.existsBy({ id: +id });

    if (!exists) {
      throw new PostNotFoundDomainException();
    }
  }

  async getPost(params: FindPostRepoQueryParams): Promise<PostViewModel> {
    const { postId, userId } = params;

    if (!isPositiveIntegerString(postId)) {
      throw new PostNotFoundDomainException();
    }

    const post = await this.postEntityRepository.findOne({
      where: { id: +postId },
      relations: { blog: true },
    });

    if (!post) {
      throw new PostNotFoundDomainException();
    }

    const likesInfoMap = await this.postReactionsQueryRepository.getLikesInfo({ postIds: [post.id], userId });

    return {
      id: post.id.toString(),
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId.toString(),
      blogName: post.blog.name,
      createdAt: post.createdAt.toISOString(),
      extendedLikesInfo: likesInfoMap.get(post.id)!,
    };
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

    const qb = this.postEntityRepository
      .createQueryBuilder('post')
      .select('post.id', 'id')
      .addSelect('post.title', 'title')
      .addSelect('post.shortDescription', 'shortDescription')
      .addSelect('post.content', 'content')
      .addSelect('post.blogId', 'blogId')
      .addSelect('post.createdAt', 'createdAt')
      .addSelect('blog.name', 'blogName')
      .innerJoin('post.blog', 'blog');

    if (blogId) {
      qb.where('post.blogId = :blogId', { blogId: +blogId });
    }

    const direction = sortDirection === SortDirection.asc ? 'ASC' : 'DESC';
    const skipCount = (pageNumber - 1) * pageSize;
    const orderBy = sortBy === 'blogName' ? 'blog.name' : `post.${sortBy}`;

    const totalCount = await qb.clone().getCount();
    const rawPosts = await qb
      .clone()
      .orderBy(orderBy, direction)
      .offset(skipCount)
      .limit(pageSize)
      .getRawMany<{
        id: number;
        title: string;
        shortDescription: string;
        content: string;
        blogId: number;
        blogName: string;
        createdAt: Date;
      }>();

    const pagesCount = Math.ceil(totalCount / pageSize);
    const postIds = rawPosts.map((post) => post.id);
    const likesInfoMap = await this.postReactionsQueryRepository.getLikesInfo({ postIds, userId });

    const posts = rawPosts.map((post) => ({
      id: post.id.toString(),
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId.toString(),
      blogName: post.blogName,
      createdAt: post.createdAt.toISOString(),
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
