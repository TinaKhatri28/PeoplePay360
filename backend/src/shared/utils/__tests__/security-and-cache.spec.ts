import { describe, it, expect } from 'vitest';
import { maskBankAccount, sanitizeEmployeePII } from '../masking.util';
import { tokenBlacklistService } from '../token-blacklist.service';
import { cacheService } from '../cache.service';

describe('Security & Masking Utilities', () => {
  describe('maskBankAccount', () => {
    it('masks full bank account preserving last 4 digits', () => {
      expect(maskBankAccount('123456789012')).toBe('**** **** 9012');
      expect(maskBankAccount('US9876543210')).toBe('**** **** 3210');
    });

    it('handles short or empty accounts gracefully', () => {
      expect(maskBankAccount(null)).toBe('N/A');
      expect(maskBankAccount('')).toBe('N/A');
      expect(maskBankAccount('123')).toBe('****');
    });
  });

  describe('sanitizeEmployeePII', () => {
    const employee = {
      id: 'emp_123',
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      bank_account: '987654321098',
    };

    it('masks bank account for unprivileged non-self users', () => {
      const sanitized = sanitizeEmployeePII(employee, false);
      expect(sanitized.bank_account).toBe('**** **** 1098');
      expect(sanitized.first_name).toBe('Jane');
    });

    it('preserves plaintext bank account for privileged or self users', () => {
      const privileged = sanitizeEmployeePII(employee, true);
      expect(privileged.bank_account).toBe('987654321098');
    });
  });

  describe('TokenBlacklistService', () => {
    it('revokes tokens and detects revoked status correctly', async () => {
      const testToken = 'test-jwt-token-xyz-123';
      expect(await tokenBlacklistService.isTokenRevoked(testToken)).toBe(false);

      await tokenBlacklistService.revokeToken(testToken, 60);
      expect(await tokenBlacklistService.isTokenRevoked(testToken)).toBe(true);
    });
  });

  describe('CacheService', () => {
    it('stores and retrieves cached data or falls back to fetchFn', async () => {
      let callCount = 0;
      const fetcher = async () => {
        callCount++;
        return { message: 'hello-world' };
      };

      const key = 'test:cache:key:1';
      await cacheService.del(key);

      const res1 = await cacheService.getOrSet(key, fetcher, 60);
      expect(res1).toEqual({ message: 'hello-world' });
      expect(callCount).toBe(1);

      // Second fetch should use cache without invoking fetcher
      const res2 = await cacheService.getOrSet(key, fetcher, 60);
      expect(res2).toEqual({ message: 'hello-world' });
      expect(callCount).toBe(1);

      // After invalidation, fetcher runs again
      await cacheService.del(key);
      const res3 = await cacheService.getOrSet(key, fetcher, 60);
      expect(res3).toEqual({ message: 'hello-world' });
      expect(callCount).toBe(2);
    });
  });
});
