import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { Blog } from './blogs.entities.js';
import { Comment } from './comments.entities.js';
import { PostDislike, PostLike } from './post-likes.entities.js';

@Entity({ name: 'posts' })
export class Post {
  @PrimaryGeneratedColumn('identity')
  declare id: number;

  @Column()
  @Index()
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

  @DeleteDateColumn({ type: 'timestamptz' })
  declare deletedAt: Date;

  @OneToMany(() => Comment, (comment) => comment.post)
  declare comments: Relation<Comment[]>;

  @OneToMany(() => PostLike, (postLike) => postLike.post)
  declare likes: Relation<PostLike[]>;

  @OneToMany(() => PostDislike, (postDislike) => postDislike.post)
  declare dislikes: Relation<PostDislike[]>;
}
