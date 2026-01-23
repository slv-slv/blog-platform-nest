import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Relation } from 'typeorm';
import { Post } from './posts.entities.js';
import { User } from '../../../user-accounts/infrastructure/typeorm/users.entities.js';
import { CommentDislike, CommentLike } from './comment-likes.entities.js';
import { CommentLikesQueryRepository } from './comment-likes.query-repository.js';
import { CommentDtoType, CommentViewType } from '../../types/comments.types.js';

@Entity({ name: 'comments' })
export class Comment {
  constructor(private readonly commentLikesQueryRepository: CommentLikesQueryRepository) {}

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

  @OneToMany(() => CommentDislike, (commentDislike) => commentDislike.comment)
  dislikes: Relation<CommentDislike[]>;

  toDto(): CommentDtoType {
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

  async toViewType(userId: string | null): Promise<CommentViewType> {
    const idStr = this.id.toString();
    return {
      id: idStr,
      content: this.content,
      commentatorInfo: {
        userId: this.user.id.toString(),
        userLogin: this.user.login,
      },
      createdAt: this.createdAt.toISOString(),
      likesInfo: await this.commentLikesQueryRepository.getLikesInfo(idStr, userId),
    };
  }
}
