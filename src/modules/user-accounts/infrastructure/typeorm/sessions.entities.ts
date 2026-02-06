import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm';
import { User } from './users.entities.js';

@Entity({ name: 'devices' })
export class Device {
  @PrimaryColumn('uuid')
  declare id: string;

  @Column()
  declare userId: number;

  @ManyToOne(() => User, (user) => user.devices)
  @JoinColumn({ name: 'userId' })
  declare user: Relation<User>;

  @Column()
  declare name: string;

  @Column()
  declare ip: string;

  @Column()
  declare iat: number;

  @Column()
  declare exp: number;

  toViewType() {
    return {
      ip: this.ip,
      title: this.name,
      lastActiveDate: new Date(this.iat * 1000).toISOString(),
      deviceId: this.id,
    };
  }
}
