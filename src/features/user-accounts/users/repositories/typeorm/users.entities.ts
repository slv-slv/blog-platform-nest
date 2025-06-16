import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { Device } from '../../../sessions/repositories/typeorm/sessions.entities.js';
import { Comment } from '../../../../blog-content/comments/repositories/typeorm/comments.entities.js';
import {
  CommentDislike,
  CommentLike,
} from '../../../../blog-content/likes/comments/repositories/typeorm/comment-likes.entities.js';
import {
  PostDislike,
  PostLike,
} from '../../../../blog-content/likes/posts/repositories/typeorm/post-likes.entities.js';

@Entity({ schema: 'typeorm', name: 'users' })
export class User {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column({ unique: true })
  login: string;

  @Column({ unique: true })
  email: string;

  @Column()
  hash: string;

  @Column('timestamptz')
  createdAt: Date;

  @OneToOne(() => Confirmation, (confirmation) => confirmation.user, { eager: true })
  confirmation: Relation<Confirmation>;

  @OneToOne(() => Recovery, (recovery) => recovery.user, { eager: true })
  passwordRecovery: Relation<Recovery>;

  @OneToMany(() => Device, (device) => device.user)
  devices: Relation<Device[]>;

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Relation<Comment[]>;

  @OneToMany(() => CommentLike, (commentLike) => commentLike.user)
  commentLikes: Relation<CommentLike[]>;

  @OneToMany(() => CommentDislike, (commentDislike) => commentDislike.user)
  commentDislikes: Relation<CommentDislike[]>;

  @OneToMany(() => PostLike, (postLike) => postLike.user)
  postLikes: Relation<PostLike[]>;

  @OneToMany(() => PostDislike, (postDislike) => postDislike.user)
  postDislikes: Relation<PostDislike[]>;
}

@Entity({ schema: 'typeorm' })
export class Confirmation {
  @PrimaryColumn()
  userId: number;

  @OneToOne(() => User, (user) => user.confirmation)
  @JoinColumn({ name: 'userId' })
  user: Relation<User>;

  @Column()
  status: string;

  @Column({ nullable: true })
  code: string;

  @Column('timestamptz', { nullable: true })
  expiration: Date;
}

@Entity({ schema: 'typeorm' })
export class Recovery {
  @PrimaryColumn()
  userId: number;

  @OneToOne(() => User, (user) => user.passwordRecovery)
  @JoinColumn({ name: 'userId' })
  user: Relation<User>;

  @Column({ nullable: true })
  code: string;

  @Column('timestamptz', { nullable: true })
  expiration: Date;
}
