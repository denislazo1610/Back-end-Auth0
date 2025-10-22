import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  auth0Id: string;

  @Column({ nullable: true }) // email is now optional
  email?: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  gender?: string;

  @CreateDateColumn()
  createdAt: Date;
}