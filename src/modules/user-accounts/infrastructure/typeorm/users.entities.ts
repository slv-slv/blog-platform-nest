import { Column, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Relation } from 'typeorm';
import { Device } from './sessions.entities.js';
import { Comment } from '../../../blog-content/infrastructure/typeorm/comments.entities.js';
import {
  CommentDislike,
  CommentLike,
} from '../../../blog-content/infrastructure/typeorm/comment-likes.entities.js';
import { PostDislike, PostLike } from '../../../blog-content/infrastructure/typeorm/post-likes.entities.js';
import { CurrentUserType, UserType, UserViewType } from '../../types/users.types.js';

export class ConfirmationInfo {
  @Column()
  declare isConfirmed: boolean;

  @Column({ nullable: true })
  declare code: string;

  @Column('timestamptz', { nullable: true })
  declare expiration: Date;
}

export class PasswordRecoveryInfo {
  @Column({ nullable: true })
  declare code: string;

  @Column('timestamptz', { nullable: true })
  declare expiration: Date;
}

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('identity')
  declare id: number;

  @Column({ unique: true })
  declare login: string;

  @Column({ unique: true })
  declare email: string;

  @Column()
  declare hash: string;

  @Column('timestamptz')
  declare createdAt: Date;

  @Column(() => ConfirmationInfo)
  declare confirmation: ConfirmationInfo;

  @Column(() => PasswordRecoveryInfo)
  declare passwordRecovery: PasswordRecoveryInfo;

  @DeleteDateColumn({ type: 'timestamptz', select: false })
  declare deletedAt: Date;

  @OneToMany(() => Device, (device) => device.user)
  declare devices: Relation<Device[]>;

  @OneToMany(() => Comment, (comment) => comment.user)
  declare comments: Relation<Comment[]>;

  @OneToMany(() => CommentLike, (commentLike) => commentLike.user)
  declare commentLikes: Relation<CommentLike[]>;

  @OneToMany(() => CommentDislike, (commentDislike) => commentDislike.user)
  declare commentDislikes: Relation<CommentDislike[]>;

  @OneToMany(() => PostLike, (postLike) => postLike.user)
  declare postLikes: Relation<PostLike[]>;

  @OneToMany(() => PostDislike, (postDislike) => postDislike.user)
  declare postDislikes: Relation<PostDislike[]>;

  toDto(): UserType {
    return {
      id: this.id.toString(),
      login: this.login,
      email: this.email,
      hash: this.hash,
      createdAt: this.createdAt,
      confirmation: this.confirmation,
      passwordRecovery: this.passwordRecovery,
    };
  }

  toViewType(): UserViewType {
    return {
      id: this.id.toString(),
      login: this.login,
      email: this.email,
      createdAt: this.createdAt.toISOString(),
    };
  }

  toCurrentUserType(): CurrentUserType {
    return {
      email: this.email,
      login: this.login,
      userId: this.id.toString(),
    };
  }
}
