'use client';

import { useCallback, useRef, useState } from 'react';
import { useAgentConversation } from '@/hooks/useAgentConversation';

export function Conversation() {
  const { startConversation, stopConversation, isConnected, messages } = useAgentConversation();

  const audioQueue = useRef<string[]>([]);
  const isPlaying = useRef(false);

  // --- Audio playback queue ---
  const processAudioQueue = useCallback(() => {
    if (isPlaying.current || audioQueue.current.length === 0) return;

    isPlaying.current = true;
    const audioBase64 = audioQueue.current.shift();
    if (!audioBase64) {
      isPlaying.current = false;
      return;
    }

    const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
    audio.onended = () => {
      isPlaying.current = false;
      processAudioQueue();
    };
    audio.onerror = () => {
      isPlaying.current = false;
      processAudioQueue();
    };
    audio.play().catch(() => {
      isPlaying.current = false;
      processAudioQueue();
    });
  }, []);

  // --- Handle start conversation ---
  const handleStart = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await startConversation();
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  }, [startConversation]);

  // --- Push new audio events to queue ---
  messages.forEach((msg) => {
    if (msg.type === 'audio' && msg.audio_event?.audio_base_64) {
      audioQueue.current.push(msg.audio_event.audio_base_64);
      processAudioQueue();
    }
  });

  return (
    <div className="flex flex-col gap-4">
      {/* --- Controls --- */}
      <div className="flex gap-2">
        <button
          onClick={handleStart}
          disabled={isConnected}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Start Conversation
        </button>
        <button
          onClick={stopConversation}
          disabled={!isConnected}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-300"
        >
          Stop Conversation
        </button>
      </div>

      {/* --- Status --- */}
      <p>
        Status:{' '}
        <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </p>

      {/* --- Live Transcript --- */}
      <div className="bg-[#111] p-4 rounded border border-[#333] max-h-64 overflow-y-auto">
        <h3 className="font-bold text-[#F3FFD4] mb-2">Live Transcript</h3>
        <div className="space-y-1 text-[#A7A7A7] text-sm font-mono">
          {messages.length === 0 && (
            <p className="text-gray-500 text-xs">No events yet. Start a conversation.</p>
          )}
          {messages.map((msg, i) => {
            switch (msg.type) {
              case 'user_transcript':
                return (
                  <p key={i}>
                    <strong>You:</strong>{' '}
                    {msg.user_transcript_event?.user_transcript || '[No transcript]'}
                  </p>
                );
              case 'agent_response':
                return (
                  <p key={i}>
                    <strong>Agent:</strong>{' '}
                    {msg.agent_response_event?.agent_response || '[No response]'}
                  </p>
                );
              case 'audio':
                return (
                  <p key={i} className="text-blue-400 text-xs">
                    <em>Audio playing...</em>
                  </p>
                );
              case 'ping':
                return null;
              case 'interruption':
                return (
                  <p key={i} className="text-yellow-400 text-xs">
                    <em>Interruption event</em>
                  </p>
                );
              case 'agent_response_correction':
                return (
                  <p key={i} className="text-green-400 text-xs">
                    <em>Agent response corrected</em>
                  </p>
                );
              default:
                return (
                  <p key={i} className="text-gray-500 text-xs">
                    ({msg.type} event)
                  </p>
                );
            }
          })}
        </div>
      </div>
    </div>
  );
}
