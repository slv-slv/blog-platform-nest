import { Injectable } from '@nestjs/common';
import {
  FindPostRepoQueryParams,
  GetPostsRepoQueryParams,
  PostsPaginatedViewModel,
  PostViewModel,
} from '../../types/posts.types.js';
import { PostLikesQueryRepository } from './post-likes.query-repository.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './posts.entities.js';
import { Repository } from 'typeorm';
import { PostNotFoundDomainException } from '../../../../common/exceptions/domain-exceptions.js';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';
import { SortDirection } from '../../../../common/types/paging-params.types.js';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectRepository(Post) private readonly postEntityRepository: Repository<Post>,
    private readonly postLikesQueryRepository: PostLikesQueryRepository,
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

  async getPost(params: FindPostRepoQueryParams): Promise<PostViewModel | null> {
    const { postId: id, userId } = params;
    const idNum = +id;
    if (isNaN(idNum)) return null;

    const post = await this.postEntityRepository.findOne({
      where: { id: idNum },
      relations: { blog: true },
    });
    if (!post) return null;

    return await this.mapToPostViewModel(post, userId);
  }

  async getPosts(params: GetPostsRepoQueryParams): Promise<PostsPaginatedViewModel> {
    const { userId, pagingParams, blogId } = params;
    const { sortBy, sortDirection, pageNumber, pageSize } = pagingParams;

    const qb = this.postEntityRepository.createQueryBuilder('post').innerJoinAndSelect('post.blog', 'blog');
    if (blogId) {
      qb.where('blog.id = :blogId', { blogId: +blogId });
    }

    const direction = sortDirection === SortDirection.asc ? 'ASC' : 'DESC';
    const skipCount = (pageNumber - 1) * pageSize;

    const orderBy = sortBy === 'blogName' ? 'blog.name' : `post.${sortBy}`;

    qb.orderBy(orderBy, direction).take(pageSize).skip(skipCount);

    const totalCount = await qb.getCount();
    const pagesCount = Math.ceil(totalCount / pageSize);

    const postsEntities = await qb.getMany();
    const posts = await Promise.all(
      postsEntities.map(async (postEntity) => await this.mapToPostViewModel(postEntity, userId)),
    );

    return {
      pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items: posts,
    };
  }

  private async mapToPostViewModel(post: Post, userId?: string): Promise<PostViewModel> {
    const idStr = post.id.toString();

    return {
      id: idStr,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId.toString(),
      blogName: post.blog.name,
      createdAt: post.createdAt.toISOString(),
      extendedLikesInfo: await this.postLikesQueryRepository.getLikesInfo({ postId: idStr, userId }),
    };
  }
}
