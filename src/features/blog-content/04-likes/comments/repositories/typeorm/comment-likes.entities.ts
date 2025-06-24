import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm';
import { Comment } from '../../../../03-comments/repositories/typeorm/comments.entities.js';
import { User } from '../../../../../user-accounts/users/repositories/typeorm/users.entities.js';

@Entity({ schema: 'typeorm', name: 'comment_likes' })
export class CommentLike {
  @PrimaryColumn()
  commentId: number;

  @ManyToOne(() => Comment, (comment) => comment.likes)
  @JoinColumn({ name: 'commentId' })
  comment: Relation<Comment>;

  @PrimaryColumn()
  userId: number;

  @ManyToOne(() => User, (user) => user.commentLikes)
  @JoinColumn({ name: 'userId' })
  user: Relation<User>;

  @Column('timestamptz')
  createdAt: Date;
}

@Entity({ schema: 'typeorm', name: 'comment_dislikes' })
export class CommentDislike {
  @PrimaryColumn()
  commentId: number;

  @ManyToOne(() => Comment, (comment) => comment.dislikes)
  @JoinColumn({ name: 'commentId' })
  comment: Relation<Comment>;

  @PrimaryColumn()
  userId: number;

  @ManyToOne(() => User, (user) => user.commentDislikes)
  @JoinColumn({ name: 'userId' })
  user: Relation<User>;

  @Column('timestamptz')
  createdAt: Date;
}
