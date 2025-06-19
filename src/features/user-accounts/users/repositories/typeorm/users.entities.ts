import { Column, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Relation } from 'typeorm';
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
import { CurrentUserType, UserType, UserViewType } from '../../types/users.types.js';

class ConfirmationInfo {
  @Column()
  isConfirmed: boolean;

  @Column({ nullable: true })
  code: string;

  @Column('timestamptz', { nullable: true })
  expiration: Date;
}

class PasswordRecoveryInfo {
  @Column({ nullable: true })
  code: string;

  @Column('timestamptz', { nullable: true })
  expiration: Date;
}

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

  @Column(() => ConfirmationInfo)
  confirmation: ConfirmationInfo;

  @Column(() => PasswordRecoveryInfo)
  passwordRecovery: PasswordRecoveryInfo;

  @DeleteDateColumn({ select: false })
  deletedAt: Date | null;

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

  toUserType(): UserType {
    return {
      id: this.id.toString(),
      login: this.login,
      email: this.email,
      hash: this.hash,
      createdAt: this.createdAt.toISOString(),
      confirmation: {
        isConfirmed: this.confirmation.isConfirmed,
        code: this.confirmation.code,
        expiration: this.confirmation.expiration
          ? this.confirmation.expiration.toISOString()
          : this.confirmation.expiration,
      },
      passwordRecovery: {
        code: this.passwordRecovery.code,
        expiration: this.confirmation.expiration
          ? this.confirmation.expiration.toISOString()
          : this.confirmation.expiration,
      },
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
