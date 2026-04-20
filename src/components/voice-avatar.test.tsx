import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock useVoiceAvatar hook
vi.mock('@/hooks/use-voice-avatar', () => ({
  useVoiceAvatar: vi.fn((seed: string) => `data:image/svg+xml;base64,avatar-for-${seed}`),
}));

// Mock @base-ui/react/avatar since it's a UI primitive not relevant to our logic
vi.mock('@base-ui/react/avatar', () => ({
  Avatar: {
    Root: ({ children, className, ...props }: React.ComponentProps<'div'>) => (
      <div data-testid="avatar-root" className={className} {...props}>{children}</div>
    ),
    Image: ({ src, alt, className, ...props }: React.ComponentProps<'img'>) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img data-testid="avatar-image" src={src} alt={alt} className={className} {...props} />
    ),
    Fallback: ({ children, className, ...props }: React.ComponentProps<'span'>) => (
      <span data-testid="avatar-fallback" className={className} {...props}>{children}</span>
    ),
  },
}));

// Mock lib/utils cn function
vi.mock('@/lib/utils', () => ({
  cn: (...args: (string | undefined | null | false)[]) => args.filter(Boolean).join(' '),
}));

import { VoiceAvatar } from './voice-avatar';

describe('VoiceAvatar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<VoiceAvatar seed="voice-1" name="Alice" />);
    expect(screen.getByTestId('avatar-root')).toBeInTheDocument();
  });

  it('renders the avatar image with the generated data URI as src', () => {
    render(<VoiceAvatar seed="voice-abc" name="Alice" />);
    const img = screen.getByTestId('avatar-image');
    expect(img).toHaveAttribute('src', 'data:image/svg+xml;base64,avatar-for-voice-abc');
  });

  it('renders the avatar image with the name as alt text', () => {
    render(<VoiceAvatar seed="voice-1" name="Bob Smith" />);
    const img = screen.getByTestId('avatar-image');
    expect(img).toHaveAttribute('alt', 'Bob Smith');
  });

  it('renders the fallback with the first 2 characters of name uppercased', () => {
    render(<VoiceAvatar seed="voice-1" name="alice" />);
    const fallback = screen.getByTestId('avatar-fallback');
    expect(fallback).toHaveTextContent('AL');
  });

  it('renders single-character names in fallback', () => {
    render(<VoiceAvatar seed="voice-1" name="X" />);
    const fallback = screen.getByTestId('avatar-fallback');
    expect(fallback).toHaveTextContent('X');
  });

  it('uppercases the fallback text from lowercase name', () => {
    render(<VoiceAvatar seed="voice-1" name="john doe" />);
    const fallback = screen.getByTestId('avatar-fallback');
    expect(fallback).toHaveTextContent('JO');
  });

  it('applies the default classes to the avatar root', () => {
    render(<VoiceAvatar seed="voice-1" name="Alice" />);
    const root = screen.getByTestId('avatar-root');
    expect(root.className).toContain('size-4');
    expect(root.className).toContain('border-white');
    expect(root.className).toContain('shadow-xs');
  });

  it('applies the additional className when provided', () => {
    render(<VoiceAvatar seed="voice-1" name="Alice" className="custom-class extra" />);
    const root = screen.getByTestId('avatar-root');
    expect(root.className).toContain('custom-class');
    expect(root.className).toContain('extra');
  });

  it('combines default and custom classes', () => {
    render(<VoiceAvatar seed="voice-1" name="Alice" className="my-custom" />);
    const root = screen.getByTestId('avatar-root');
    expect(root.className).toContain('size-4');
    expect(root.className).toContain('my-custom');
  });

  it('works without an optional className', () => {
    expect(() => render(<VoiceAvatar seed="voice-1" name="Alice" />)).not.toThrow();
  });

  it('calls useVoiceAvatar with the provided seed', async () => {
    const { useVoiceAvatar } = await import('@/hooks/use-voice-avatar');
    render(<VoiceAvatar seed="specific-seed-123" name="Test" />);
    expect(useVoiceAvatar).toHaveBeenCalledWith('specific-seed-123');
  });

  it('uses different avatar URLs for different seeds', async () => {
    const { useVoiceAvatar } = await import('@/hooks/use-voice-avatar');
    render(<VoiceAvatar seed="seed-a" name="Voice A" />);
    render(<VoiceAvatar seed="seed-b" name="Voice B" />);

    expect(useVoiceAvatar).toHaveBeenCalledWith('seed-a');
    expect(useVoiceAvatar).toHaveBeenCalledWith('seed-b');
  });
});