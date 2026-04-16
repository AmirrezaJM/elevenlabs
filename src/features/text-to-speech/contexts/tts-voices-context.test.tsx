import React from 'react';
import { render, renderHook, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TTSVoicesProvider, useTTSVoices } from './tts-voices-context';

const mockVoice = (overrides: Partial<{
  id: string;
  name: string;
  description: string | null;
  category: string;
  language: string | null;
  variant: string;
}> = {}) => ({
  id: 'voice-1',
  name: 'Test Voice',
  description: null,
  category: 'GENERAL' as const,
  language: 'en',
  variant: 'SYSTEM',
  ...overrides,
});

const mockContextValue = {
  customVoices: [mockVoice({ id: 'custom-1', variant: 'CUSTOM' })],
  systemVoices: [mockVoice({ id: 'system-1', variant: 'SYSTEM' })],
  allVoices: [
    mockVoice({ id: 'custom-1', variant: 'CUSTOM' }),
    mockVoice({ id: 'system-1', variant: 'SYSTEM' }),
  ],
};

describe('TTSVoicesProvider', () => {
  it('provides context value to children', () => {
    const { result } = renderHook(() => useTTSVoices(), {
      wrapper: ({ children }) => (
        <TTSVoicesProvider value={mockContextValue}>
          {children}
        </TTSVoicesProvider>
      ),
    });

    expect(result.current.customVoices).toHaveLength(1);
    expect(result.current.systemVoices).toHaveLength(1);
    expect(result.current.allVoices).toHaveLength(2);
  });

  it('provides correct customVoices data', () => {
    const { result } = renderHook(() => useTTSVoices(), {
      wrapper: ({ children }) => (
        <TTSVoicesProvider value={mockContextValue}>
          {children}
        </TTSVoicesProvider>
      ),
    });

    expect(result.current.customVoices[0].id).toBe('custom-1');
    expect(result.current.customVoices[0].variant).toBe('CUSTOM');
  });

  it('provides correct systemVoices data', () => {
    const { result } = renderHook(() => useTTSVoices(), {
      wrapper: ({ children }) => (
        <TTSVoicesProvider value={mockContextValue}>
          {children}
        </TTSVoicesProvider>
      ),
    });

    expect(result.current.systemVoices[0].id).toBe('system-1');
    expect(result.current.systemVoices[0].variant).toBe('SYSTEM');
  });

  it('renders children', () => {
    render(
      <TTSVoicesProvider value={mockContextValue}>
        <div data-testid="child">Child content</div>
      </TTSVoicesProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('provides empty arrays when given empty voice lists', () => {
    const emptyValue = { customVoices: [], systemVoices: [], allVoices: [] };
    const { result } = renderHook(() => useTTSVoices(), {
      wrapper: ({ children }) => (
        <TTSVoicesProvider value={emptyValue}>
          {children}
        </TTSVoicesProvider>
      ),
    });

    expect(result.current.customVoices).toHaveLength(0);
    expect(result.current.systemVoices).toHaveLength(0);
    expect(result.current.allVoices).toHaveLength(0);
  });
});

describe('useTTSVoices', () => {
  it('throws an error when used outside of TTSVoicesProvider', () => {
    expect(() => {
      renderHook(() => useTTSVoices());
    }).toThrow('useTTSVoices must be used within a TTSVoicesProvider');
  });

  it('returns the exact same context value that was provided', () => {
    const specificValue = {
      customVoices: [mockVoice({ id: 'specific-custom', name: 'Custom Voice' })],
      systemVoices: [],
      allVoices: [mockVoice({ id: 'specific-custom', name: 'Custom Voice' })],
    };

    const { result } = renderHook(() => useTTSVoices(), {
      wrapper: ({ children }) => (
        <TTSVoicesProvider value={specificValue}>
          {children}
        </TTSVoicesProvider>
      ),
    });

    expect(result.current).toEqual(specificValue);
  });

  it('reflects updated context when provider value changes', () => {
    const initialValue = {
      customVoices: [],
      systemVoices: [mockVoice({ id: 'sys-1' })],
      allVoices: [mockVoice({ id: 'sys-1' })],
    };
    const updatedValue = {
      customVoices: [mockVoice({ id: 'cust-1', variant: 'CUSTOM' })],
      systemVoices: [mockVoice({ id: 'sys-1' })],
      allVoices: [
        mockVoice({ id: 'cust-1', variant: 'CUSTOM' }),
        mockVoice({ id: 'sys-1' }),
      ],
    };

    // Use a ref-based approach to update the context value
    let currentValue = initialValue;
    const { result, rerender } = renderHook(() => useTTSVoices(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <TTSVoicesProvider value={currentValue}>
          {children}
        </TTSVoicesProvider>
      ),
    });

    expect(result.current.customVoices).toHaveLength(0);

    currentValue = updatedValue;
    rerender();
    expect(result.current.customVoices).toHaveLength(1);
    expect(result.current.allVoices).toHaveLength(2);
  });
});