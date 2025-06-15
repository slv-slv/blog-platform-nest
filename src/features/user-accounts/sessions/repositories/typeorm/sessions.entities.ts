import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm';
import { User } from '../../../users/repositories/typeorm/users.entities.js';

@Entity({ schema: 'typeorm', name: 'devices' })
export class Device {
  @PrimaryColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.devices)
  @JoinColumn()
  user: Relation<User>;

  @Column()
  name: string;

  @Column()
  ip: string;

  @Column()
  iat: number;

  @Column()
  exp: number;
}
