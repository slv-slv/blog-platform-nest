import { Column, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Relation } from 'typeorm';
import { Post } from './post.entity.js';

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

  @DeleteDateColumn({ type: 'timestamptz' })
  declare deletedAt: Date;

  @OneToMany(() => Post, (post) => post.blog)
  declare posts: Relation<Post[]>;
}
