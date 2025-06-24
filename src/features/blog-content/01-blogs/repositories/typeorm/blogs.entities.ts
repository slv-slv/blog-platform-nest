import { Column, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Relation } from 'typeorm';
import { Post } from '../../../02-posts/repositories/typeorm/posts.entities.js';

@Entity({ schema: 'typeorm', name: 'blogs' })
export class Blog {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  websiteUrl: string;

  @Column('timestamptz')
  createdAt: Date;

  @Column()
  isMembership: boolean;

  @DeleteDateColumn({ type: 'timestamptz', select: false })
  deletedAt: Date;

  @OneToMany(() => Post, (post) => post.blog)
  posts: Relation<Post[]>;
}
