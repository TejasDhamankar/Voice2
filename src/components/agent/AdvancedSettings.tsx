"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Brain, Mic, Phone } from "lucide-react";

interface AdvancedSettingsProps {
  // LLM Settings
  llmModel: string;
  temperature: number;
  maxTokens: number;

  // Conversation Settings
  maxDurationSeconds: number;
  turnTimeout: number;
  silenceEndCallTimeout: number;
  textOnly: boolean;

  // ASR Settings
  asrModel: string;
  asrQuality: string;
  asrLanguage: string;

  // Advanced Features
  ragEnabled: boolean;
  backgroundVoiceDetection: boolean;
  disableFirstMessageInterruptions: boolean;

  // Event handlers
  onLlmModelChange: (value: string) => void;
  onTemperatureChange: (value: number) => void;
  onMaxTokensChange: (value: number) => void;
  onMaxDurationSecondsChange: (value: number) => void;
  onTurnTimeoutChange: (value: number) => void;
  onSilenceEndCallTimeoutChange: (value: number) => void;
  onTextOnlyChange: (value: boolean) => void;
  onAsrModelChange: (value: string) => void;
  onAsrQualityChange: (value: string) => void;
  onAsrLanguageChange: (value: string) => void;
  onRagEnabledChange: (value: boolean) => void;
  onBackgroundVoiceDetectionChange: (value: boolean) => void;
  onDisableFirstMessageInterruptionsChange: (value: boolean) => void;
}

export function AdvancedSettings({
  llmModel,
  temperature,
  maxTokens,
  maxDurationSeconds,
  turnTimeout,
  silenceEndCallTimeout,
  textOnly,
  asrModel,
  asrQuality,
  asrLanguage,
  ragEnabled,
  backgroundVoiceDetection,
  disableFirstMessageInterruptions,
  onLlmModelChange,
  onTemperatureChange,
  onMaxTokensChange,
  onMaxDurationSecondsChange,
  onTurnTimeoutChange,
  onSilenceEndCallTimeoutChange,
  onTextOnlyChange,
  onAsrModelChange,
  onAsrQualityChange,
  onAsrLanguageChange,
  onRagEnabledChange,
  onBackgroundVoiceDetectionChange,
  onDisableFirstMessageInterruptionsChange,
}: AdvancedSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Advanced Configuration
        </CardTitle>
        <CardDescription>
          Professional settings for optimal agent performance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* LLM Configuration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <h3 className="text-lg font-medium">Language Model Settings</h3>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Model</Label>
              <Select value={llmModel} onValueChange={onLlmModelChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o-mini">GPT-4O Mini (Fast)</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4O (Balanced)</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo (Advanced)</SelectItem>
                  <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                  <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Temperature ({temperature})</Label>
              <Input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Max Tokens</Label>
              <Input
                type="number"
                min="-1"
                value={maxTokens}
                onChange={(e) => onMaxTokensChange(parseInt(e.target.value))}
                placeholder="-1 for unlimited"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Conversation Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <h3 className="text-lg font-medium">Conversation Settings</h3>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Max Duration (seconds)</Label>
              <Input
                type="number"
                min="60"
                max="3600"
                value={maxDurationSeconds}
                onChange={(e) => onMaxDurationSecondsChange(parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Turn Timeout (seconds)</Label>
              <Input
                type="number"
                min="1"
                max="30"
                step="0.5"
                value={turnTimeout}
                onChange={(e) => onTurnTimeoutChange(parseFloat(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Silence End Call (seconds)</Label>
              <Input
                type="number"
                min="-1"
                max="300"
                value={silenceEndCallTimeout}
                onChange={(e) => onSilenceEndCallTimeoutChange(parseInt(e.target.value))}
                placeholder="-1 to disable"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Text Only Mode</Label>
                <p className="text-sm text-muted-foreground">Disable voice, use text-only interaction</p>
              </div>
              <Switch checked={textOnly} onCheckedChange={onTextOnlyChange} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Disable First Message Interruptions</Label>
                <p className="text-sm text-muted-foreground">Prevent interruption of the opening message</p>
              </div>
              <Switch
                checked={disableFirstMessageInterruptions}
                onCheckedChange={onDisableFirstMessageInterruptionsChange}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Speech Recognition */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            <h3 className="text-lg font-medium">Speech Recognition (ASR)</h3>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>ASR Model</Label>
              <Select value={asrModel} onValueChange={onAsrModelChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nova-2-general">Nova-2 General</SelectItem>
                  <SelectItem value="nova-2-multilingual">Nova-2 Multilingual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quality</Label>
              <Select value={asrQuality} onValueChange={onAsrQualityChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High Quality</SelectItem>
                  <SelectItem value="low">Low Latency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={asrLanguage} onValueChange={onAsrLanguageChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>RAG (Retrieval Augmented Generation)</Label>
                <p className="text-sm text-muted-foreground">Enhanced knowledge retrieval from documents</p>
              </div>
              <Switch checked={ragEnabled} onCheckedChange={onRagEnabledChange} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Background Voice Detection</Label>
                <p className="text-sm text-muted-foreground">Detect and filter background voices</p>
              </div>
              <Switch
                checked={backgroundVoiceDetection}
                onCheckedChange={onBackgroundVoiceDetectionChange}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
