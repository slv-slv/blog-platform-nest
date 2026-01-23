import { Inject, Injectable } from '@nestjs/common';
import { PostsPaginatedType, PostViewType } from '../../types/posts.types.js';
import { PagingParamsType } from '../../../common/types/paging-params.types.js';
import { PostLikesQueryRepository } from './post-likes.query-repository.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './posts.entities.js';
import { Repository } from 'typeorm';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectRepository(Post) private readonly postEntityRepository: Repository<Post>,
    private readonly postLikesQueryRepository: PostLikesQueryRepository,
  ) {}

  async findPost(id: string, userId: string | null): Promise<PostViewType | null> {
    const idNum = parseInt(id);
    if (isNaN(idNum)) return null;

    const post = await this.postEntityRepository.findOneBy({ id: idNum });
    if (!post) return null;

    return post.toViewType(userId);
  }

  async getPosts(
    userId: string | null,
    pagingParams: PagingParamsType,
    blogId?: string,
  ): Promise<PostsPaginatedType> {
    const { sortBy, sortDirection, pageNumber, pageSize } = pagingParams;

    const qb = this.postEntityRepository.createQueryBuilder('post');
    if (blogId) {
      qb.innerJoinAndSelect('post.blog', 'blog').where('blog.id = :blogId', { blogId: parseInt(blogId) });
    }

    const direction = sortDirection === 'asc' ? 'ASC' : 'DESC';
    const skipCount = (pageNumber - 1) * pageSize;

    qb.orderBy(`post.${sortBy}`, direction).take(pageSize).skip(skipCount);

    const totalCount = await qb.printSql().getCount();
    const pagesCount = Math.ceil(totalCount / pageSize);

    const postsEntities = await qb.printSql().getMany();
    console.log(postsEntities);
    const posts = await Promise.all(
      postsEntities.map(async (postEntity) => await postEntity.toViewType(userId)),
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
