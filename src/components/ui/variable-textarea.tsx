import React, { useState, useRef, useEffect } from "react";
import { Textarea } from "./textarea";
import { Button } from "./button";
import { Badge } from "./badge";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Plus, Variable, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface VariableTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  availableVariables?: { name: string; description: string }[];
  showVariableHelper?: boolean;
}

const DEFAULT_VARIABLES = [
  { name: "contact_name", description: "The name of the person being called" },
  { name: "company_name", description: "Your company name" },
  { name: "agent_name", description: "The name of this AI agent" },
  { name: "current_date", description: "Today's date" },
  { name: "current_time", description: "Current time" },
];

export function VariableTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  className,
  availableVariables = DEFAULT_VARIABLES,
  showVariableHelper = true,
}: VariableTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);

  // Extract variables from text
  const extractedVariables = React.useMemo(() => {
    const matches = value.match(/\{[^}]+\}/g);
    return matches ? [...new Set(matches)] : [];
  }, [value]);

  const insertVariable = (variableName: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const variableText = `{{${variableName}}}`;

    const newValue = value.substring(0, start) + variableText + value.substring(end);
    onChange(newValue);

    // Set cursor position after the inserted variable
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variableText.length, start + variableText.length);
    }, 0);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onSelect={(e) => {
            const target = e.target as HTMLTextAreaElement;
            setCursorPosition(target.selectionStart);
          }}
          placeholder={placeholder}
          rows={rows}
          className={cn("pr-12", className)}
        />

        {showVariableHelper && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-8 w-8 p-0"
              >
                <Variable className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Variable className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-sm">Insert Variables</h4>
                </div>

                <div className="grid gap-2">
                  {availableVariables.map((variable) => (
                    <Button
                      key={variable.name}
                      type="button"
                      variant="ghost"
                      className="justify-start h-auto p-2 text-left"
                      onClick={() => insertVariable(variable.name)}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-1 rounded">
                            {`{{${variable.name}}}`}
                          </code>
                          <Plus className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {variable.description}
                        </p>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Show extracted variables */}
      {extractedVariables.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Info className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Variables used:</span>
          {extractedVariables.map((variable, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {variable}
            </Badge>
          ))}
        </div>
      )}

      {showVariableHelper && (
        <p className="text-xs text-muted-foreground">
          Use variables like <code className="bg-muted px-1 rounded">{`{contact_name}`}</code> to personalize messages.
          Click the <Variable className="inline h-3 w-3 mx-1" /> button to insert variables.
        </p>
      )}
    </div>
  );
}
