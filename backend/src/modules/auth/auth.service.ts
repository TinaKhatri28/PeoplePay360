import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { env } from '../../config/env';
import { authRepository, AuthRepository } from './auth.repository';
import { AuthenticationError, ConflictError, NotFoundError } from '../../shared/errors/app.error';
import { LoginInput, RegisterInput } from './auth.schema';
import { RolePermissionsMap, RoleName } from '../../shared/constants/roles.constant';
import { logger } from '../../shared/logger/logger';

export class AuthService {
  constructor(private readonly repo: AuthRepository = authRepository) {}

  /**
   * Secure password hashing (Argon2 primary, bcrypt fallback)
   */
  async hashPassword(password: string): Promise<string> {
    try {
      return await argon2.hash(password);
    } catch {
      return await bcrypt.hash(password, 10);
    }
  }

  /**
   * Password verification supporting both Argon2 and existing bcrypt hashes
   */
  async verifyPassword(hash: string, plain: string): Promise<boolean> {
    try {
      if (hash.startsWith('$argon2')) {
        return await argon2.verify(hash, plain);
      }
      return await bcrypt.compare(plain, hash);
    } catch (err: any) {
      logger.warn(`Password verify fallback error: ${err.message}`);
      return false;
    }
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private getRoleArray(role: string): string[] {
    if (!role) return [];
    const list = typeof role === 'string' ? role.split(',').map(r => r.trim()).filter(Boolean) : (Array.isArray(role) ? role : []);
    if (list.includes('Admin')) {
      if (!list.includes('HR Payroll Admin')) list.push('HR Payroll Admin');
      if (!list.includes('HR Manager')) list.push('HR Manager');
      if (!list.includes('HR Payroll User')) list.push('HR Payroll User');
    }
    if (list.includes('HR Manager')) {
      if (!list.includes('HR Payroll User')) list.push('HR Payroll User');
    }
    return list;
  }

  generateTokens(user: { id: string; email: string; role: string; organization_id: string; employee_id?: string | null }) {
    const role = user.role as RoleName;
    const permissions = RolePermissionsMap[role] || [];
    const rolesArray = this.getRoleArray(user.role);

    const payload = {
      id: user.id,
      userId: user.id,
      email: user.email,
      role: user.role,
      roles: rolesArray,
      organizationId: user.organization_id,
      employeeId: user.employee_id,
      permissions,
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: '12h',
    });

    const refreshToken = jwt.sign(
      { id: user.id, organizationId: user.organization_id, type: 'refresh' },
      env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: '12h',
    };
  }

  async login(input: LoginInput) {
    const user = await this.repo.findByEmail(input.email);
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    if (user.status !== 'Active') {
      throw new AuthenticationError('Account is disabled or inactive');
    }

    const isValid = await this.verifyPassword(user.password_hash, input.password);
    if (!isValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    const tokens = this.generateTokens(user);
    await this.repo.updateRefreshTokenHash(user.id, this.hashToken(tokens.refreshToken));

    const rolesArray = this.getRoleArray(user.role);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.employee ? `${user.employee.first_name} ${user.employee.last_name}` : user.email.split('@')[0],
        role: user.role,
        roles: rolesArray,
        organizationId: user.organization_id,
        employeeId: user.employee_id,
        permissions: RolePermissionsMap[user.role as RoleName] || [],
      },
      token: tokens.accessToken, // backward-compat key for frontend
      tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as any;
      const user = await this.repo.findById(decoded.id);

      if (!user || !user.refresh_hash) {
        throw new AuthenticationError('Session expired or invalid');
      }

      // Detect refresh token reuse
      const incomingHash = this.hashToken(refreshToken);
      if (user.refresh_hash !== incomingHash) {
        // Compromised session! Invalidate all refresh tokens for this user
        await this.repo.updateRefreshTokenHash(user.id, null);
        logger.warn({ userId: user.id }, 'Potential refresh token reuse detected. Session invalidated.');
        throw new AuthenticationError('Token reuse detected. Please log in again.');
      }

      // Rotate token
      const tokens = this.generateTokens(user);
      await this.repo.updateRefreshTokenHash(user.id, this.hashToken(tokens.refreshToken));

      return {
        token: tokens.accessToken,
        tokens,
      };
    } catch (err: any) {
      if (err instanceof AuthenticationError) throw err;
      throw new AuthenticationError('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await this.repo.updateRefreshTokenHash(userId, null);
    return { success: true, message: 'Logged out successfully' };
  }

  async getMe(userId: string) {
    const user = await this.repo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const rolesArray = this.getRoleArray(user.role);
    return {
      id: user.id,
      email: user.email,
      name: user.employee ? `${user.employee.first_name} ${user.employee.last_name}` : user.email.split('@')[0],
      role: user.role,
      roles: rolesArray,
      organizationId: user.organization_id,
      employeeId: user.employee_id,
      organization: user.organization ? { id: user.organization.id, name: user.organization.name } : null,
      permissions: RolePermissionsMap[user.role as RoleName] || [],
    };
  }
}

export const authService = new AuthService();
