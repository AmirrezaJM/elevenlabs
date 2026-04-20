import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock the form component to capture defaultValues
const mockTextToSpeechForm = vi.fn(({ children, defaultValues }: {
  children: React.ReactNode;
  defaultValues?: Record<string, unknown>;
}) => (
  <div data-testid="tts-form" data-values={JSON.stringify(defaultValues)}>
    {children}
  </div>
));

vi.mock('@/features/text-to-speech/components/text-to-speech-form', () => ({
  TextToSpeechForm: (props: Parameters<typeof mockTextToSpeechForm>[0]) =>
    mockTextToSpeechForm(props),
  defaultTTSValues: {
    text: '',
    voiceId: '',
    temperature: 0.8,
    topP: 0.95,
    topK: 1000,
    repetitionPenalty: 1.2,
  },
}));

vi.mock('@/features/text-to-speech/components/text-input-panel', () => ({
  TextInputPanel: () => <div data-testid="text-input-panel" />,
}));

vi.mock('@/features/text-to-speech/components/voice-preview-placeholder', () => ({
  VoicePreviewPlaceholder: () => <div data-testid="voice-preview-placeholder" />,
}));

vi.mock('@/features/text-to-speech/components/settings-panel', () => ({
  SettingsPanel: () => <div data-testid="settings-panel" />,
}));

import { TextToSpeechView } from './text-to-speech-view';

describe('TextToSpeechView', () => {
  it('renders without crashing', () => {
    render(<TextToSpeechView />);
    expect(screen.getByTestId('tts-form')).toBeInTheDocument();
  });

  it('renders the TextInputPanel', () => {
    render(<TextToSpeechView />);
    expect(screen.getByTestId('text-input-panel')).toBeInTheDocument();
  });

  it('renders the VoicePreviewPlaceholder', () => {
    render(<TextToSpeechView />);
    expect(screen.getByTestId('voice-preview-placeholder')).toBeInTheDocument();
  });

  it('renders the SettingsPanel', () => {
    render(<TextToSpeechView />);
    expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
  });

  it('uses defaultTTSValues when no initialValues provided', () => {
    render(<TextToSpeechView />);
    const form = screen.getByTestId('tts-form');
    const values = JSON.parse(form.getAttribute('data-values') ?? '{}');
    expect(values.text).toBe('');
    expect(values.voiceId).toBe('');
    expect(values.temperature).toBe(0.8);
    expect(values.topP).toBe(0.95);
    expect(values.topK).toBe(1000);
    expect(values.repetitionPenalty).toBe(1.2);
  });

  it('merges initialValues with defaultTTSValues when initialValues provided', () => {
    render(<TextToSpeechView initialValues={{ text: 'Hello World', voiceId: 'voice-123' }} />);
    const form = screen.getByTestId('tts-form');
    const values = JSON.parse(form.getAttribute('data-values') ?? '{}');
    expect(values.text).toBe('Hello World');
    expect(values.voiceId).toBe('voice-123');
    // Other defaults should remain
    expect(values.temperature).toBe(0.8);
    expect(values.topP).toBe(0.95);
  });

  it('initialValues override defaultTTSValues for provided fields only', () => {
    render(<TextToSpeechView initialValues={{ temperature: 0.5 }} />);
    const form = screen.getByTestId('tts-form');
    const values = JSON.parse(form.getAttribute('data-values') ?? '{}');
    expect(values.temperature).toBe(0.5);
    // Other defaults should remain unchanged
    expect(values.text).toBe('');
    expect(values.voiceId).toBe('');
    expect(values.topP).toBe(0.95);
    expect(values.topK).toBe(1000);
    expect(values.repetitionPenalty).toBe(1.2);
  });

  it('only sets voiceId when only voiceId initialValue is provided', () => {
    render(<TextToSpeechView initialValues={{ voiceId: 'only-voice-id' }} />);
    const form = screen.getByTestId('tts-form');
    const values = JSON.parse(form.getAttribute('data-values') ?? '{}');
    expect(values.voiceId).toBe('only-voice-id');
    expect(values.text).toBe('');
  });

  it('works with empty initialValues object', () => {
    render(<TextToSpeechView initialValues={{}} />);
    const form = screen.getByTestId('tts-form');
    const values = JSON.parse(form.getAttribute('data-values') ?? '{}');
    // Should still have all defaults
    expect(values.text).toBe('');
    expect(values.voiceId).toBe('');
    expect(values.temperature).toBe(0.8);
  });

  it('passes all merged values to TextToSpeechForm', () => {
    render(
      <TextToSpeechView
        initialValues={{
          text: 'Test speech',
          voiceId: 'voice-abc',
          temperature: 0.6,
        }}
      />
    );

    expect(mockTextToSpeechForm).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultValues: expect.objectContaining({
          text: 'Test speech',
          voiceId: 'voice-abc',
          temperature: 0.6,
          topP: 0.95,
          topK: 1000,
          repetitionPenalty: 1.2,
        }),
      })
    );
  });
});