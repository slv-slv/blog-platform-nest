import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm';
import { Post } from './posts.entities.js';
import { User } from '../../../user-accounts/infrastructure/typeorm/users.entities.js';

@Entity({ name: 'post_likes' })
export class PostLike {
  @PrimaryColumn()
  declare postId: number;

  @ManyToOne(() => Post, (post) => post.likes)
  @JoinColumn({ name: 'postId' })
  declare post: Relation<Post>;

  @PrimaryColumn()
  declare userId: number;

  @ManyToOne(() => User, (user) => user.postLikes)
  @JoinColumn({ name: 'userId' })
  declare user: Relation<User>;

  @Column('timestamptz')
  declare createdAt: Date;
}

@Entity({ name: 'post_dislikes' })
export class PostDislike {
  @PrimaryColumn()
  declare postId: number;

  @ManyToOne(() => Post, (post) => post.dislikes)
  @JoinColumn({ name: 'postId' })
  declare post: Relation<Post>;

  @PrimaryColumn()
  declare userId: number;

  @ManyToOne(() => User, (user) => user.postDislikes)
  @JoinColumn({ name: 'userId' })
  declare user: Relation<User>;

  @Column('timestamptz')
  declare createdAt: Date;
}
