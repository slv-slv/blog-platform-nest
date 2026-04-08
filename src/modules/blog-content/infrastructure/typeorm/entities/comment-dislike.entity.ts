import { Column, Entity, ForeignKey, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm';
import { Comment } from './comment.entity.js';

@Entity({ name: 'comment_dislikes' })
export class CommentDislike {
  @PrimaryColumn()
  declare commentId: number;

  @ManyToOne(() => Comment, (comment) => comment.dislikes)
  @JoinColumn({ name: 'commentId' })
  declare comment: Relation<Comment>;

  @PrimaryColumn()
  @ForeignKey('users', 'id')
  declare userId: number;

  @Column('timestamptz')
  declare createdAt: Date;
}
