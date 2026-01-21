import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm';
import { User } from '../../../01-users/repositories/typeorm/users.entities.js';

@Entity({ name: 'devices' })
export class Device {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.devices)
  @JoinColumn({ name: 'userId' })
  user: Relation<User>;

  @Column()
  name: string;

  @Column()
  ip: string;

  @Column()
  iat: number;

  @Column()
  exp: number;

  toViewType() {
    return {
      ip: this.ip,
      title: this.name,
      lastActiveDate: new Date(this.iat * 1000).toISOString(),
      deviceId: this.id,
    };
  }
}
