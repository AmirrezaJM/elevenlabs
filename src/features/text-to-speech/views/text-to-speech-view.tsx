"use client";

import { TextInputPanel } from "@/features/text-to-speech/components/text-input-panel";
import { VoicePreviewPlaceholder } from "@/features/text-to-speech/components/voice-preview-placeholder";
import { SettingsPanel } from "@/features/text-to-speech/components/settings-panel";
import {
  TextToSpeechForm,
  defaultTTSValues,
  TTSFormValues
} from "@/features/text-to-speech/components/text-to-speech-form";

export function TextToSpeechView({ initialValues }: { initialValues?: Partial<TTSFormValues> }) {
  return (
    <TextToSpeechForm defaultValues={{ ...defaultTTSValues, ...initialValues }}>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col">
          <TextInputPanel />
          <VoicePreviewPlaceholder />
        </div>
        <SettingsPanel />
      </div>
    </TextToSpeechForm>
  );
};