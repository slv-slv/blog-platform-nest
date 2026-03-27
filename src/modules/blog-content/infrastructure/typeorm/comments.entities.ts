import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Relation } from 'typeorm';
import { Post } from './posts.entities.js';
import { User } from '../../../user-accounts/infrastructure/typeorm/users.entities.js';
import { CommentDislike, CommentLike } from './comment-likes.entities.js';
import { CommentLikesQueryRepository } from './comment-likes.query-repository.js';
import { CommentModel, CommentViewModel } from '../../types/comments.types.js';

@Entity({ name: 'comments' })
export class Comment {
  constructor(private readonly commentLikesQueryRepository: CommentLikesQueryRepository) {}

  @PrimaryGeneratedColumn('identity')
  declare id: number;

  @ManyToOne(() => Post, (post) => post.comments)
  @JoinColumn()
  declare post: Relation<Post>;

  @ManyToOne(() => User, (user) => user.comments)
  @JoinColumn()
  declare user: Relation<User>;

  @Column('text')
  declare content: string;

  @Column('timestamptz')
  declare createdAt: Date;

  @OneToMany(() => CommentLike, (commentLike) => commentLike.comment)
  declare likes: Relation<CommentLike[]>;

  @OneToMany(() => CommentDislike, (commentDislike) => commentDislike.comment)
  declare dislikes: Relation<CommentDislike[]>;

  toModel(): CommentModel {
    const idStr = this.id.toString();
    return {
      id: idStr,
      content: this.content,
      commentatorInfo: {
        userId: this.user.id.toString(),
        userLogin: this.user.login,
      },
      createdAt: this.createdAt.toISOString(),
    };
  }

  async toViewModel(userId?: string): Promise<CommentViewModel> {
    const idStr = this.id.toString();
    return {
      id: idStr,
      content: this.content,
      commentatorInfo: {
        userId: this.user.id.toString(),
        userLogin: this.user.login,
      },
      createdAt: this.createdAt.toISOString(),
      likesInfo: await this.commentLikesQueryRepository.getLikesInfo({ commentId: idStr, userId }),
    };
  }
}
