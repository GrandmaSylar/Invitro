import {
  Entity,
  PrimaryColumn,
  Column,
  BeforeInsert,
  BeforeUpdate,
  CreateDateColumn,
} from 'typeorm';
import * as bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

@Entity('users')
export class UserEntity {
  @PrimaryColumn({ length: 64 })
  id!: string;

  @Column({ length: 128 })
  fullName!: string;

  @Column({ length: 256, unique: true })
  email!: string;

  @Column({ length: 64, unique: true })
  username!: string;

  /**
   * Stores the bcrypt hash — never the plaintext password.
   * Use `setPassword()` to hash before saving.
   */
  @Column({ length: 256, select: false })
  passwordHash!: string;

  @Column({ length: 32, nullable: true })
  phone?: string;

  @Column({ length: 64 })
  roleId!: string;

  @Column({ type: 'simple-json', default: '{}' })
  permissionOverrides!: Record<string, boolean>;

  @Column({ default: false })
  twoFactorEnabled!: boolean;

  @Column({ length: 16, nullable: true })
  twoFactorMethod?: 'totp' | 'sms' | 'email';

  @Column({ length: 16, default: 'active' })
  status!: 'active' | 'inactive' | 'suspended';

  @Column({ nullable: true })
  lastLogin?: string;

  @CreateDateColumn()
  createdAt!: Date;

  // ── Internal flag — not persisted ──────────────────────────
  private _plainPassword?: string;

  /**
   * Call this instead of setting `passwordHash` directly.
   * The actual hash is computed in the @BeforeInsert / @BeforeUpdate hook.
   */
  public setPassword(plaintext: string): void {
    this._plainPassword = plaintext;
  }

  @BeforeInsert()
  @BeforeUpdate()
  async hashPasswordIfNeeded(): Promise<void> {
    if (this._plainPassword) {
      this.passwordHash = await bcrypt.hash(this._plainPassword, SALT_ROUNDS);
      this._plainPassword = undefined;
    }
  }

  /**
   * Compare a plaintext password against the stored hash.
   * The caller must ensure `passwordHash` was selected in the query.
   */
  public async validatePassword(plaintext: string): Promise<boolean> {
    if (!this.passwordHash) return false;
    return bcrypt.compare(plaintext, this.passwordHash);
  }

  /** Return a safe JSON representation (no passwordHash). */
  public toSafeJSON() {
    const { passwordHash, _plainPassword, ...safe } = this as any;
    return safe;
  }
}
