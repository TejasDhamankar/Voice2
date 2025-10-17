"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Volume2 } from "lucide-react";

interface VoiceConfigurationProps {
  voiceStability: number;
  voiceSimilarityBoost: number;
  voiceSpeed: number;
  optimizeStreamingLatency: number;
  outputAudioFormat: string;
  onVoiceStabilityChange: (value: number) => void;
  onVoiceSimilarityBoostChange: (value: number) => void;
  onVoiceSpeedChange: (value: number) => void;
  onOptimizeStreamingLatencyChange: (value: number) => void;
  onOutputAudioFormatChange: (value: string) => void;
}

export function VoiceConfiguration({
  voiceStability,
  voiceSimilarityBoost,
  voiceSpeed,
  optimizeStreamingLatency,
  outputAudioFormat,
  onVoiceStabilityChange,
  onVoiceSimilarityBoostChange,
  onVoiceSpeedChange,
  onOptimizeStreamingLatencyChange,
  onOutputAudioFormatChange,
}: VoiceConfigurationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Voice Configuration
        </CardTitle>
        <CardDescription>
          Fine-tune voice characteristics and audio quality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Voice Stability: {voiceStability}</Label>
          <Slider
            value={[voiceStability]}
            onValueChange={(values) => onVoiceStabilityChange(values[0])}
            max={1}
            min={0}
            step={0.1}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">
            Higher values make the voice more consistent, lower values add more variation
          </p>
        </div>

        <div className="space-y-3">
          <Label>Voice Similarity Boost: {voiceSimilarityBoost}</Label>
          <Slider
            value={[voiceSimilarityBoost]}
            onValueChange={(values) => onVoiceSimilarityBoostChange(values[0])}
            max={1}
            min={0}
            step={0.1}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">
            Enhances similarity to the original voice. High values may reduce audio quality
          </p>
        </div>

        <div className="space-y-3">
          <Label>Voice Speed: {voiceSpeed}x</Label>
          <Slider
            value={[voiceSpeed]}
            onValueChange={(values) => onVoiceSpeedChange(values[0])}
            max={4}
            min={0.25}
            step={0.25}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">
            Adjust speaking speed. 1.0 is normal speed
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Streaming Latency</Label>
            <Select
              value={optimizeStreamingLatency.toString()}
              onValueChange={(value) => onOptimizeStreamingLatencyChange(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Highest Quality (1)</SelectItem>
                <SelectItem value="2">High Quality (2)</SelectItem>
                <SelectItem value="3">Balanced (3)</SelectItem>
                <SelectItem value="4">Lowest Latency (4)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Audio Format</Label>
            <Select value={outputAudioFormat} onValueChange={onOutputAudioFormatChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pcm_16000">PCM 16kHz (High Quality)</SelectItem>
                <SelectItem value="ulaw_8000">uLaw 8kHz (Telephony)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
