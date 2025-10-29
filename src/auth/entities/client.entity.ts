import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  weight: number;

  @Column()
  height: number;

  @Column()
  age: number;

  @Column({ length: 100, nullable: true })
  injury?: string; // notes for trainer

  @Column({ length: 200, nullable: true })
  goal?: string; // e.g. "Mejorar rendimiento"

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_auth0Id', referencedColumnName: 'auth0Id' })
  user: User;
}