import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm';
import { Post } from './posts.entities.js';
import { User } from './users.entities.js';

@Entity({ name: 'post_likes' })
export class PostLike {
  @PrimaryColumn()
  postId: number;

  @ManyToOne(() => Post, (post) => post.likes)
  @JoinColumn({ name: 'postId' })
  post: Relation<Post>;

  @PrimaryColumn()
  userId: number;

  @ManyToOne(() => User, (user) => user.postLikes)
  @JoinColumn({ name: 'userId' })
  user: Relation<User>;

  @Column('timestamptz')
  createdAt: Date;
}

@Entity({ name: 'post_dislikes' })
export class PostDislike {
  @PrimaryColumn()
  postId: number;

  @ManyToOne(() => Post, (post) => post.dislikes)
  @JoinColumn({ name: 'postId' })
  post: Relation<Post>;

  @PrimaryColumn()
  userId: number;

  @ManyToOne(() => User, (user) => user.postDislikes)
  @JoinColumn({ name: 'userId' })
  user: Relation<User>;

  @Column('timestamptz')
  createdAt: Date;
}
