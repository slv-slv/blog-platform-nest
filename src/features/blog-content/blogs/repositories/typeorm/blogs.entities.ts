import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

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
}
