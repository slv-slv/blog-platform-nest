import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';

@Entity({ schema: 'typeorm', name: 'users' })
export class User {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column({ unique: true })
  login: string;

  @Column({ unique: true })
  email: string;

  @Column()
  hash: string;

  @Column('timestamptz')
  createdAt: Date;

  @OneToOne(() => Confirmation, (confirmation) => confirmation.user, { eager: true })
  confirmation: Relation<Confirmation>;

  // @OneToOne(() => Recovery, (recovery) => recovery.user, { eager: true })
  // recovery: Relation<Recovery>;
}

@Entity({ schema: 'typeorm' })
export class Confirmation {
  @PrimaryColumn()
  userId: number;

  @OneToOne(() => User, (user) => user.confirmation)
  @JoinColumn({ name: 'userId' })
  user: Relation<User>;

  @Column()
  status: string;

  @Column()
  code: string;

  @Column('timestamptz')
  expiration: Date;
}
