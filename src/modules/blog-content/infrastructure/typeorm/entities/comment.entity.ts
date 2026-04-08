import {
  Column,
  DeleteDateColumn,
  Entity,
  ForeignKey,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { CommentDislike } from './comment-dislike.entity.js';
import { CommentLike } from './comment-like.entity.js';
import { Post } from './post.entity.js';

@Entity({ name: 'comments' })
export class Comment {
  @PrimaryGeneratedColumn('identity')
  declare id: number;

  @Column()
  @Index()
  declare postId: number;

  @ManyToOne(() => Post, (post) => post.comments)
  @JoinColumn({ name: 'postId' })
  declare post: Relation<Post>;

  @Column()
  @Index()
  @ForeignKey('users', 'id')
  declare userId: number;

  @Column('text')
  declare content: string;

  @Column('timestamptz')
  declare createdAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  declare deletedAt: Date;

  @OneToMany(() => CommentLike, (commentLike) => commentLike.comment)
  declare likes: Relation<CommentLike[]>;

  @OneToMany(() => CommentDislike, (commentDislike) => commentDislike.comment)
  declare dislikes: Relation<CommentDislike[]>;
}
