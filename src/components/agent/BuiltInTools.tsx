"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Wrench } from "lucide-react";

interface BuiltInToolsProps {
  enableEndCall: boolean;
  enableLanguageDetection: boolean;
  enableTransferToAgent: boolean;
  enableTransferToNumber: boolean;
  enableSkipTurn: boolean;
  enableKeypadTouchTone: boolean;
  enableVoicemailDetection: boolean;
  onEnableEndCallChange: (value: boolean) => void;
  onEnableLanguageDetectionChange: (value: boolean) => void;
  onEnableTransferToAgentChange: (value: boolean) => void;
  onEnableTransferToNumberChange: (value: boolean) => void;
  onEnableSkipTurnChange: (value: boolean) => void;
  onEnableKeypadTouchToneChange: (value: boolean) => void;
  onEnableVoicemailDetectionChange: (value: boolean) => void;
}

export function BuiltInTools({
  enableEndCall,
  enableLanguageDetection,
  enableTransferToAgent,
  enableTransferToNumber,
  enableSkipTurn,
  enableKeypadTouchTone,
  enableVoicemailDetection,
  onEnableEndCallChange,
  onEnableLanguageDetectionChange,
  onEnableTransferToAgentChange,
  onEnableTransferToNumberChange,
  onEnableSkipTurnChange,
  onEnableKeypadTouchToneChange,
  onEnableVoicemailDetectionChange,
}: BuiltInToolsProps) {
  const tools = [
    {
      key: "enableEndCall",
      label: "End Call",
      description: "Automatically end calls when appropriate",
      enabled: enableEndCall,
      onChange: onEnableEndCallChange,
      available: true
    },
    {
      key: "enableLanguageDetection",
      label: "Language Detection",
      description: "Automatically detect and adapt to caller's language",
      enabled: enableLanguageDetection,
      onChange: onEnableLanguageDetectionChange,
      available: true
    },
    {
      key: "enableVoicemailDetection",
      label: "Voicemail Detection",
      description: "Detect and handle voicemail systems",
      enabled: enableVoicemailDetection,
      onChange: onEnableVoicemailDetectionChange,
      available: false
    },
    {
      key: "enableTransferToAgent",
      label: "Transfer to Agent",
      description: "Transfer calls to human agents when needed",
      enabled: enableTransferToAgent,
      onChange: onEnableTransferToAgentChange,
      available: false
    },
    {
      key: "enableTransferToNumber",
      label: "Transfer to Number",
      description: "Transfer calls to specific phone numbers",
      enabled: enableTransferToNumber,
      onChange: onEnableTransferToNumberChange,
      available: false
    },
    {
      key: "enableSkipTurn",
      label: "Skip Turn",
      description: "Allow agent to skip its turn in conversation",
      enabled: enableSkipTurn,
      onChange: onEnableSkipTurnChange,
      available: false
    },
    {
      key: "enableKeypadTouchTone",
      label: "Keypad Touch Tone",
      description: "Play DTMF tones for keypad interactions",
      enabled: enableKeypadTouchTone,
      onChange: onEnableKeypadTouchToneChange,
      available: false
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Built-in Tools
        </CardTitle>
        <CardDescription>
          System-level capabilities for professional call handling
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          {tools.map((tool) => (
            <div
              key={tool.key}
              className={`flex items-center justify-between p-3 border rounded-lg ${
                !tool.available ? 'opacity-60' : ''
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Label className="font-medium">{tool.label}</Label>
                  {!tool.available && (
                    <Badge variant="secondary" className="text-xs">
                      Coming Soon
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {tool.description}
                </p>
              </div>
              <Switch
                checked={tool.enabled}
                onCheckedChange={tool.onChange}
                disabled={!tool.available}
              />
            </div>
          ))}
        </div>

        {/* Info note */}
        <div className="mt-6 p-3 bg-muted/50 border rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> Tools marked as "Coming Soon" are currently in development and will be available in future updates.
            They can be configured but won't be active until officially released.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
