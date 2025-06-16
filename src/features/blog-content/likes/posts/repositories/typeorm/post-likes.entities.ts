import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm';
import { Post } from '../../../../posts/repositories/typeorm/posts.entities.js';
import { User } from '../../../../../user-accounts/users/repositories/typeorm/users.entities.js';

@Entity({ schema: 'typeorm', name: 'post_likes' })
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

@Entity({ schema: 'typeorm', name: 'post_dislikes' })
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
