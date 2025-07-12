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

@Entity({ name: 'posts' })
export class Post {
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
}
