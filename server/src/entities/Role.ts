import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('roles')
export class RoleEntity {
  @PrimaryColumn({ length: 64 })
  id!: string;

  @Column({ length: 64, unique: true })
  name!: string;

  @Column({ length: 128 })
  label!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: false })
  isSystem!: boolean;

  @Column({ type: 'simple-json', default: '{}' })
  permissions!: Record<string, boolean>;

  @CreateDateColumn()
  createdAt!: Date;
}
