import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Relation } from 'typeorm';
import { Post } from '../../../posts/repositories/typeorm/posts.entities.js';
import { User } from '../../../../user-accounts/users/repositories/typeorm/users.entities.js';
import { CommentLike } from '../../../likes/comments/repositories/typeorm/comment-likes.entities.js';

@Entity({ schema: 'typeorm', name: 'comments' })
export class Comment {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @ManyToOne(() => Post, (post) => post.comments)
  @JoinColumn()
  post: Relation<Post>;

  @ManyToOne(() => User, (user) => user.comments)
  @JoinColumn()
  user: Relation<User>;

  @Column('text')
  content: string;

  @Column('timestamptz')
  createdAt: Date;

  @OneToMany(() => CommentLike, (commentLike) => commentLike.comment)
  likes: Relation<CommentLike[]>;
}
