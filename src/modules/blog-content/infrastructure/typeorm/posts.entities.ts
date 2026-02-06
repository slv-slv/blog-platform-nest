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
import { Blog } from './blogs.entities.js';
import { Comment } from './comments.entities.js';
import { PostDislike, PostLike } from './post-likes.entities.js';
import { PostLikesQueryRepository } from './post-likes.query-repository.js';
import { PostDtoType, PostViewType } from '../../types/posts.types.js';

@Entity({ name: 'posts' })
export class Post {
  constructor(private readonly postLikesQueryRepository: PostLikesQueryRepository) {}

  @PrimaryGeneratedColumn('identity')
  declare id: number;

  @Column()
  declare blogId: number;

  @ManyToOne(() => Blog, (blog) => blog.posts)
  @JoinColumn({ name: 'blogId' })
  declare blog: Relation<Blog>;

  @Column()
  declare title: string;

  @Column()
  declare shortDescription: string;

  @Column('text')
  declare content: string;

  @Column('timestamptz')
  declare createdAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', select: false })
  declare deletedAt: Date;

  @OneToMany(() => Comment, (comment) => comment.post)
  declare comments: Relation<Comment[]>;

  @OneToMany(() => PostLike, (postLike) => postLike.post)
  declare likes: Relation<PostLike[]>;

  @OneToMany(() => PostDislike, (postDislike) => postDislike.post)
  declare dislikes: Relation<PostDislike[]>;

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
      blogId: this.blogId.toString(),
      blogName: this.blog.name,
      createdAt: this.createdAt.toISOString(),
      extendedLikesInfo: await this.postLikesQueryRepository.getLikesInfo(idStr, userId),
    };
  }
}
