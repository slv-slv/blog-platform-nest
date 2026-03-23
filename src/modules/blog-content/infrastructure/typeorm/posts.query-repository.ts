import { Inject, Injectable } from '@nestjs/common';
import {
  FindPostRepoQueryParams,
  GetPostsRepoQueryParams,
  PostsPaginatedType,
  PostViewType,
} from '../../types/posts.types.js';
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

  async getPost(params: FindPostRepoQueryParams): Promise<PostViewType | null> {
    const { postId: id, userId } = params;
    const idNum = parseInt(id);
    if (isNaN(idNum)) return null;

    const post = await this.postEntityRepository.findOneBy({ id: idNum });
    if (!post) return null;

    return post.toViewType(userId);
  }

  async getPosts(params: GetPostsRepoQueryParams): Promise<PostsPaginatedType> {
    const { userId, pagingParams, blogId } = params;
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
