import { Column, Entity, ForeignKey, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm';
import { Post } from './posts.entities.js';

@Entity({ name: 'post_likes' })
export class PostLike {
  @PrimaryColumn()
  declare postId: number;

  @ManyToOne(() => Post, (post) => post.likes)
  @JoinColumn({ name: 'postId' })
  declare post: Relation<Post>;

  @PrimaryColumn()
  @ForeignKey('users', 'id')
  declare userId: number;

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
  @ForeignKey('users', 'id')
  declare userId: number;

  @Column('timestamptz')
  declare createdAt: Date;
}
