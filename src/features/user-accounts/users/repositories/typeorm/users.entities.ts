import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'typeorm' })
export class User {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column({ unique: true })
  login: string;

  @Column({ unique: true })
  email: string;

  @Column()
  hash: string;

  @Column('timestamp with time zone')
  createdAt: Date;
}
