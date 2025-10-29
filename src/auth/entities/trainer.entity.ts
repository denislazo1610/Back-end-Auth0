import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('trainers')
export class Trainer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  age: number;

  @Column('text', { array: true })
  specialties?: string[]; // Hipertrofia, Pilates, Bajar de Peso

  @Column({ default: false })
  freeClass: boolean; // whether the trainer offers free classes

  @Column('text', { array: true })
  certifications?: string[]; // Trainer certifications

  @Column({ length: 100, nullable: true })
  experience?: string; // Trainer experience

  @Column({ length: 500, nullable: true })
  description?: string; // Trainer description

  @Column('text', { array: true })
  languages?: string[]; // Languages spoken by the trainer

  @Column({ length: 100, nullable: true })
  stateUbication?: string; // Lima, Callao

  @Column({ length: 100, nullable: true })
  city?: string; // La Molina, Surco

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_auth0Id', referencedColumnName: 'auth0Id' })
  user: User;
}