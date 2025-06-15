import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Relation } from 'typeorm';
import { Blog } from '../../../blogs/repositories/typeorm/blogs.entities.js';
import { Comment } from '../../../comments/repositories/typeorm/comments.entities.js';

@Entity({ schema: 'typeorm', name: 'posts' })
export class Post {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @ManyToOne(() => Blog, (blog) => blog.posts)
  @JoinColumn()
  blog: Relation<Blog>;

  @Column()
  title: string;

  @Column()
  shortDescription: string;

  @Column('text')
  content: string;

  @Column('timestamptz')
  createdAt: Date;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Relation<Comment[]>;
}
