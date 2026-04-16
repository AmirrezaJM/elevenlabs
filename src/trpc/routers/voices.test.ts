import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';

// Mock @clerk/nextjs/server before importing anything from init
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    cache: (fn: unknown) => fn,
  };
});

// Mock the db module
const mockVoiceFindMany = vi.fn();
const mockVoiceFindUnique = vi.fn();
const mockVoiceDelete = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    voice: {
      findMany: mockVoiceFindMany,
      findUnique: mockVoiceFindUnique,
      delete: mockVoiceDelete,
    },
  },
}));

// Mock r2 module
const mockDeleteAudio = vi.fn();
vi.mock('@/lib/r2', () => ({
  deleteAudio: mockDeleteAudio,
}));

const orgCtx = { userId: 'user_123', orgId: 'org_456' };

async function createCaller(authOverride?: { userId: string | null; orgId: string | null }) {
  const { auth } = await import('@clerk/nextjs/server');
  (auth as ReturnType<typeof vi.fn>).mockResolvedValue(
    authOverride ?? { userId: 'user_123', orgId: 'org_456' }
  );

  const { createCallerFactory } = await import('../init');
  const { voicesRouter } = await import('./voices');
  return createCallerFactory(voicesRouter)(orgCtx);
}

const systemVoice = {
  id: 'sys-voice-1',
  name: 'System Voice',
  description: 'A built-in voice',
  category: 'GENERAL',
  language: 'en',
  variant: 'SYSTEM',
};

const customVoice = {
  id: 'custom-voice-1',
  name: 'My Custom Voice',
  description: 'A custom team voice',
  category: 'CONVERSATIONAL',
  language: 'en',
  variant: 'CUSTOM',
};

describe('voicesRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('returns custom and system voices', async () => {
      mockVoiceFindMany
        .mockResolvedValueOnce([customVoice])
        .mockResolvedValueOnce([systemVoice]);

      const caller = await createCaller();
      const result = await caller.getAll();

      expect(result).toEqual({
        custom: [customVoice],
        system: [systemVoice],
      });
    });

    it('queries custom voices with CUSTOM variant and orgId filter', async () => {
      mockVoiceFindMany.mockResolvedValue([]);

      const caller = await createCaller();
      await caller.getAll();

      const firstCall = mockVoiceFindMany.mock.calls[0][0];
      expect(firstCall.where.variant).toBe('CUSTOM');
      expect(firstCall.where.orgId).toBe('org_456');
    });

    it('queries system voices with SYSTEM variant only (no orgId filter)', async () => {
      mockVoiceFindMany.mockResolvedValue([]);

      const caller = await createCaller();
      await caller.getAll();

      const secondCall = mockVoiceFindMany.mock.calls[1][0];
      expect(secondCall.where.variant).toBe('SYSTEM');
      expect(secondCall.where.orgId).toBeUndefined();
    });

    it('applies search filter when query is provided', async () => {
      mockVoiceFindMany.mockResolvedValue([]);

      const caller = await createCaller();
      await caller.getAll({ query: 'narrator' });

      const firstCall = mockVoiceFindMany.mock.calls[0][0];
      expect(firstCall.where.OR).toBeDefined();
      expect(firstCall.where.OR).toHaveLength(2);
      expect(firstCall.where.OR[0]).toMatchObject({
        name: { contains: 'narrator', mode: 'insensitive' },
      });
      expect(firstCall.where.OR[1]).toMatchObject({
        description: { contains: 'narrator', mode: 'insensitive' },
      });
    });

    it('does not apply search filter when query is not provided', async () => {
      mockVoiceFindMany.mockResolvedValue([]);

      const caller = await createCaller();
      await caller.getAll();

      const firstCall = mockVoiceFindMany.mock.calls[0][0];
      expect(firstCall.where.OR).toBeUndefined();
    });

    it('does not apply search filter when query is an empty string', async () => {
      mockVoiceFindMany.mockResolvedValue([]);

      const caller = await createCaller();
      await caller.getAll({ query: '' });

      const firstCall = mockVoiceFindMany.mock.calls[0][0];
      expect(firstCall.where.OR).toBeUndefined();
    });

    it('works when input is undefined (optional input)', async () => {
      mockVoiceFindMany.mockResolvedValue([]);

      const caller = await createCaller();
      await expect(caller.getAll(undefined)).resolves.toEqual({
        custom: [],
        system: [],
      });
    });

    it('returns empty arrays when no voices exist', async () => {
      mockVoiceFindMany.mockResolvedValue([]);

      const caller = await createCaller();
      const result = await caller.getAll();

      expect(result.custom).toHaveLength(0);
      expect(result.system).toHaveLength(0);
    });

    it('runs custom and system queries in parallel', async () => {
      let customResolved = false;
      let systemResolved = false;

      mockVoiceFindMany
        .mockImplementationOnce(async () => {
          customResolved = true;
          return [customVoice];
        })
        .mockImplementationOnce(async () => {
          systemResolved = true;
          return [systemVoice];
        });

      const caller = await createCaller();
      await caller.getAll();

      // Both should have been called (Promise.all)
      expect(customResolved).toBe(true);
      expect(systemResolved).toBe(true);
      expect(mockVoiceFindMany).toHaveBeenCalledTimes(2);
    });

    it('orders custom voices by createdAt desc', async () => {
      mockVoiceFindMany.mockResolvedValue([]);

      const caller = await createCaller();
      await caller.getAll();

      const customQuery = mockVoiceFindMany.mock.calls[0][0];
      expect(customQuery.orderBy).toEqual({ createdAt: 'desc' });
    });

    it('orders system voices by createdAt asc', async () => {
      mockVoiceFindMany.mockResolvedValue([]);

      const caller = await createCaller();
      await caller.getAll();

      const systemQuery = mockVoiceFindMany.mock.calls[1][0];
      expect(systemQuery.orderBy).toEqual({ createdAt: 'asc' });
    });

    it('throws UNAUTHORIZED when not authenticated', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: null, orgId: null });

      const { createCallerFactory } = await import('../init');
      const { voicesRouter } = await import('./voices');
      const caller = createCallerFactory(voicesRouter)({});

      await expect(caller.getAll()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    it('throws FORBIDDEN when authenticated but no orgId', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: 'user_123', orgId: null });

      const { createCallerFactory } = await import('../init');
      const { voicesRouter } = await import('./voices');
      const caller = createCallerFactory(voicesRouter)({});

      await expect(caller.getAll()).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });
  });

  describe('delete', () => {
    it('throws NOT_FOUND when voice does not exist', async () => {
      mockVoiceFindUnique.mockResolvedValueOnce(null);

      const caller = await createCaller();
      await expect(caller.delete({ id: 'non-existent-id' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Voice not found',
      });
    });

    it('throws NOT_FOUND when voice belongs to a different org', async () => {
      // Simulates Prisma returning null because orgId doesn't match
      mockVoiceFindUnique.mockResolvedValueOnce(null);

      const caller = await createCaller();
      await expect(caller.delete({ id: 'some-voice-id' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('calls deleteAudio and deletes voice when r2ObjectKey is present', async () => {
      mockVoiceFindUnique.mockResolvedValueOnce({
        id: 'custom-voice-1',
        r2ObjectKey: 'audio/custom-voice-1.mp3',
      });
      mockDeleteAudio.mockResolvedValueOnce(undefined);
      mockVoiceDelete.mockResolvedValueOnce({ id: 'custom-voice-1' });

      const caller = await createCaller();
      const result = await caller.delete({ id: 'custom-voice-1' });

      expect(mockDeleteAudio).toHaveBeenCalledWith('audio/custom-voice-1.mp3');
      expect(mockVoiceDelete).toHaveBeenCalledWith({ where: { id: 'custom-voice-1' } });
      expect(result).toEqual({ success: true });
    });

    it('does not call deleteAudio when r2ObjectKey is null', async () => {
      mockVoiceFindUnique.mockResolvedValueOnce({
        id: 'custom-voice-2',
        r2ObjectKey: null,
      });
      mockVoiceDelete.mockResolvedValueOnce({ id: 'custom-voice-2' });

      const caller = await createCaller();
      const result = await caller.delete({ id: 'custom-voice-2' });

      expect(mockDeleteAudio).not.toHaveBeenCalled();
      expect(mockVoiceDelete).toHaveBeenCalledWith({ where: { id: 'custom-voice-2' } });
      expect(result).toEqual({ success: true });
    });

    it('queries voice with CUSTOM variant and orgId constraint', async () => {
      mockVoiceFindUnique.mockResolvedValueOnce(null);

      const caller = await createCaller();
      await caller.delete({ id: 'some-id' }).catch(() => {});

      expect(mockVoiceFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'some-id',
            variant: 'CUSTOM',
            orgId: 'org_456',
          }),
        })
      );
    });

    it('returns { success: true } on successful deletion', async () => {
      mockVoiceFindUnique.mockResolvedValueOnce({
        id: 'voice-to-delete',
        r2ObjectKey: null,
      });
      mockVoiceDelete.mockResolvedValueOnce({});

      const caller = await createCaller();
      const result = await caller.delete({ id: 'voice-to-delete' });

      expect(result).toEqual({ success: true });
    });

    it('throws UNAUTHORIZED when not authenticated', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: null, orgId: null });

      const { createCallerFactory } = await import('../init');
      const { voicesRouter } = await import('./voices');
      const caller = createCallerFactory(voicesRouter)({});

      await expect(caller.delete({ id: 'any-id' })).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });
});