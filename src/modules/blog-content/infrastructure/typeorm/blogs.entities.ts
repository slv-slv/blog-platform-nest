import { Column, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Relation } from 'typeorm';
import { Post } from './posts.entities.js';
import { BlogType } from '../../types/blogs.types.js';

@Entity({ name: 'blogs' })
export class Blog {
  @PrimaryGeneratedColumn('identity')
  declare id: number;

  @Column()
  declare name: string;

  @Column()
  declare description: string;

  @Column()
  declare websiteUrl: string;

  @Column('timestamptz')
  declare createdAt: Date;

  @Column()
  declare isMembership: boolean;

  @DeleteDateColumn({ type: 'timestamptz', select: false })
  declare deletedAt: Date;

  @OneToMany(() => Post, (post) => post.blog)
  declare posts: Relation<Post[]>;

  toDto(): BlogType {
    return {
      id: this.id.toString(),
      name: this.name,
      description: this.description,
      websiteUrl: this.websiteUrl,
      createdAt: this.createdAt.toISOString(),
      isMembership: this.isMembership,
    };
  }
}
