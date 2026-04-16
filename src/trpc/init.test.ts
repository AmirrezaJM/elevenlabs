import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';

// Must mock before importing init.ts since it calls auth() at module evaluation
const mockAuth = vi.fn();

vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
}));

// Mock react cache to be a pass-through
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    cache: (fn: unknown) => fn,
  };
});

describe('trpc/init', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTRPCContext', () => {
    it('returns an empty object', async () => {
      const { createTRPCContext } = await import('./init');
      const ctx = await createTRPCContext();
      expect(ctx).toEqual({});
    });
  });

  describe('authProcedure middleware', () => {
    it('throws UNAUTHORIZED when userId is not present', async () => {
      mockAuth.mockResolvedValue({ userId: null, orgId: null });
      const { authProcedure, createTRPCRouter, createCallerFactory } = await import('./init');

      const router = createTRPCRouter({
        test: authProcedure.query(() => 'ok'),
      });
      const caller = createCallerFactory(router)({});

      const error = await caller.test().catch((e: TRPCError) => e);
      expect(error).toBeInstanceOf(TRPCError);
      expect(error.code).toBe('UNAUTHORIZED');
    });

    it('passes through with userId in context when userId is present', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_abc', orgId: null });
      const { authProcedure, createTRPCRouter, createCallerFactory } = await import('./init');

      const router = createTRPCRouter({
        test: authProcedure.query(({ ctx }) => ({ userId: ctx.userId })),
      });
      const caller = createCallerFactory(router)({});

      const result = await caller.test();
      expect(result).toEqual({ userId: 'user_abc' });
    });

    it('includes userId in context when authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_xyz', orgId: 'org_123' });
      const { authProcedure, createTRPCRouter, createCallerFactory } = await import('./init');

      let capturedCtx: Record<string, unknown> = {};
      const router = createTRPCRouter({
        test: authProcedure.query(({ ctx }) => {
          capturedCtx = ctx;
          return null;
        }),
      });
      const caller = createCallerFactory(router)({});
      await caller.test();
      expect(capturedCtx.userId).toBe('user_xyz');
    });
  });

  describe('orgProcedure middleware', () => {
    it('throws UNAUTHORIZED when userId is not present', async () => {
      mockAuth.mockResolvedValue({ userId: null, orgId: null });
      const { orgProcedure, createTRPCRouter, createCallerFactory } = await import('./init');

      const router = createTRPCRouter({
        test: orgProcedure.query(() => 'ok'),
      });
      const caller = createCallerFactory(router)({});

      await expect(caller.test()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    it('throws FORBIDDEN when userId is present but orgId is not', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_abc', orgId: null });
      const { orgProcedure, createTRPCRouter, createCallerFactory } = await import('./init');

      const router = createTRPCRouter({
        test: orgProcedure.query(() => 'ok'),
      });
      const caller = createCallerFactory(router)({});

      await expect(caller.test()).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: 'Organization not found',
      });
    });

    it('passes through with userId and orgId in context when both are present', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_abc', orgId: 'org_xyz' });
      const { orgProcedure, createTRPCRouter, createCallerFactory } = await import('./init');

      const router = createTRPCRouter({
        test: orgProcedure.query(({ ctx }) => ({ userId: ctx.userId, orgId: ctx.orgId })),
      });
      const caller = createCallerFactory(router)({});

      const result = await caller.test();
      expect(result).toEqual({ userId: 'user_abc', orgId: 'org_xyz' });
    });

    it('includes both userId and orgId in context', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_123', orgId: 'org_456' });
      const { orgProcedure, createTRPCRouter, createCallerFactory } = await import('./init');

      let capturedCtx: Record<string, unknown> = {};
      const router = createTRPCRouter({
        test: orgProcedure.query(({ ctx }) => {
          capturedCtx = ctx;
          return null;
        }),
      });
      const caller = createCallerFactory(router)({});
      await caller.test();

      expect(capturedCtx.userId).toBe('user_123');
      expect(capturedCtx.orgId).toBe('org_456');
    });

    it('throws UNAUTHORIZED (not FORBIDDEN) when neither userId nor orgId is present', async () => {
      mockAuth.mockResolvedValue({ userId: null, orgId: null });
      const { orgProcedure, createTRPCRouter, createCallerFactory } = await import('./init');

      const router = createTRPCRouter({
        test: orgProcedure.query(() => 'ok'),
      });
      const caller = createCallerFactory(router)({});

      const error = await caller.test().catch((e: TRPCError) => e);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.code).not.toBe('FORBIDDEN');
    });
  });
});