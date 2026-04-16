import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockToDataUri, mockCreateAvatar } = vi.hoisted(() => {
  const mockToDataUri = vi.fn(() => 'data:image/svg+xml;base64,mock-avatar-data');
  const mockCreateAvatar = vi.fn(() => ({ toDataUri: mockToDataUri }));
  return { mockToDataUri, mockCreateAvatar };
});

vi.mock('@dicebear/core', () => ({
  createAvatar: mockCreateAvatar,
}));

vi.mock('@dicebear/collection', () => ({
  glass: {},
}));

import { useVoiceAvatar } from './use-voice-avatar';

describe('useVoiceAvatar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore default implementations after clearAllMocks wipes call queues
    mockCreateAvatar.mockImplementation(() => ({ toDataUri: mockToDataUri }));
    mockToDataUri.mockReturnValue('data:image/svg+xml;base64,mock-avatar-data');
  });

  it('returns a data URI string for a given seed', () => {
    const { result } = renderHook(() => useVoiceAvatar('seed-abc'));
    expect(result.current).toBe('data:image/svg+xml;base64,mock-avatar-data');
  });

  it('calls createAvatar with the glass style', async () => {
    const { glass } = await import('@dicebear/collection');

    renderHook(() => useVoiceAvatar('my-seed'));
    expect(mockCreateAvatar).toHaveBeenCalledWith(glass, {
      seed: 'my-seed',
      size: 128,
    });
  });

  it('calls createAvatar with size 128', () => {
    renderHook(() => useVoiceAvatar('test-voice-id'));
    const callArg = mockCreateAvatar.mock.calls[0][1];
    expect(callArg.size).toBe(128);
  });

  it('returns the same value when seed does not change (memoization)', () => {
    const { result, rerender } = renderHook(({ seed }) => useVoiceAvatar(seed), {
      initialProps: { seed: 'seed-1' },
    });
    const firstResult = result.current;
    rerender({ seed: 'seed-1' });
    expect(result.current).toBe(firstResult);
    // createAvatar should only be called once due to memoization
    expect(mockCreateAvatar).toHaveBeenCalledTimes(1);
  });

  it('recomputes when seed changes', () => {
    mockToDataUri
      .mockReturnValueOnce('data:image/svg+xml;base64,avatar-1')
      .mockReturnValueOnce('data:image/svg+xml;base64,avatar-2');

    const { result, rerender } = renderHook(({ seed }) => useVoiceAvatar(seed), {
      initialProps: { seed: 'seed-1' },
    });
    expect(result.current).toBe('data:image/svg+xml;base64,avatar-1');

    rerender({ seed: 'seed-2' });
    expect(result.current).toBe('data:image/svg+xml;base64,avatar-2');
    expect(mockCreateAvatar).toHaveBeenCalledTimes(2);
  });

  it('handles an empty seed string', () => {
    const { result } = renderHook(() => useVoiceAvatar(''));
    expect(typeof result.current).toBe('string');
  });

  it('handles a seed with special characters', () => {
    renderHook(() => useVoiceAvatar('voice/id?special=chars&more'));
    expect(mockCreateAvatar).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ seed: 'voice/id?special=chars&more' })
    );
  });
});