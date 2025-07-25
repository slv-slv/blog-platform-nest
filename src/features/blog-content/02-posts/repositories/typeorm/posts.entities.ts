import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { Blog } from '../../../01-blogs/repositories/typeorm/blogs.entities.js';
import { Comment } from '../../../03-comments/repositories/typeorm/comments.entities.js';
import { PostDislike, PostLike } from '../../../04-likes/posts/repositories/typeorm/post-likes.entities.js';
import { PostLikesQueryRepository } from '../../../04-likes/posts/repositories/postgresql/post-likes.query-repository.js';
import { PostDtoType, PostViewType } from '../../types/posts.types.js';

@Entity({ name: 'posts' })
export class Post {
  constructor(private readonly postLikesQueryRepository: PostLikesQueryRepository) {}

  @PrimaryGeneratedColumn('identity')
  id: number;

  @ManyToOne(() => Blog, (blog) => blog.posts)
  @JoinColumn()
  blog: Relation<Blog>;

  @Column()
  title: string;

  @Column()
  shortDescription: string;

  @Column('text')
  content: string;

  @Column('timestamptz')
  createdAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', select: false })
  deletedAt: Date;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Relation<Comment[]>;

  @OneToMany(() => PostLike, (postLike) => postLike.post)
  likes: Relation<PostLike[]>;

  @OneToMany(() => PostDislike, (postDislike) => postDislike.post)
  dislikes: Relation<PostDislike[]>;

  toDto(): PostDtoType {
    return {
      id: this.id.toString(),
      title: this.title,
      shortDescription: this.shortDescription,
      content: this.content,
      blogId: this.blog.id.toString(),
      blogName: this.blog.name,
      createdAt: this.createdAt.toISOString(),
    };
  }

  async toViewType(userId: string | null): Promise<PostViewType> {
    const idStr = this.id.toString();
    return {
      id: idStr,
      title: this.title,
      shortDescription: this.shortDescription,
      content: this.content,
      blogId: this.blog.id.toString(),
      blogName: this.blog.name,
      createdAt: this.createdAt.toISOString(),
      extendedLikesInfo: await this.postLikesQueryRepository.getLikesInfo(idStr, userId),
    };
  }
}
