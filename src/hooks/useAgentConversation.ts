'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useVoiceStream } from 'voice-stream';
import type { ElevenLabsWebSocketEvent } from '@/app/types/websocket';

const sendMessage = (websocket: WebSocket, request: object) => {
  if (websocket.readyState !== WebSocket.OPEN) return;
  websocket.send(JSON.stringify(request));
};

export const useAgentConversation = () => {
  const websocketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const audioQueue = useRef<string[]>([]);
  const isPlaying = useRef(false);
  const audioElements = useRef<HTMLAudioElement[]>([]);
  const [messages, setMessages] = useState<ElevenLabsWebSocketEvent[]>([]);

  const { startStreaming, stopStreaming } = useVoiceStream({
    onAudioChunked: (audioData) => {
      if (!websocketRef.current) return;
      sendMessage(websocketRef.current, { user_audio_chunk: audioData });
    },
  });

  // Play audio chunks sequentially
  const processAudioQueue = useCallback(() => {
    if (isPlaying.current || audioQueue.current.length === 0) return;
    isPlaying.current = true;
    const audioBase64 = audioQueue.current.shift();
    if (audioBase64) {
      const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
      audioElements.current.push(audio);
      audio.onended = () => { isPlaying.current = false; processAudioQueue(); };
      audio.onerror = () => { isPlaying.current = false; processAudioQueue(); };
      audio.play().catch(() => { isPlaying.current = false; });
    } else isPlaying.current = false;
  }, []);

  useEffect(() => {
    messages.forEach(msg => {
      if (msg.type === 'audio' && msg.audio_event?.audio_base_64) {
        audioQueue.current.push(msg.audio_event.audio_base_64);
      }
    });
    processAudioQueue();
  }, [messages, processAudioQueue]);

  const startConversation = useCallback(async () => {
    if (isConnected) return;

    // Get signed URL from backend
    const res = await fetch('/api/signed-url');
    if (!res.ok) throw new Error('Failed to fetch signed URL');
    const data = await res.json();
    if (!data.signedUrl) throw new Error('No signed URL returned');

    const ws = new WebSocket(data.signedUrl);
    ws.binaryType = 'arraybuffer';
    websocketRef.current = ws;

    ws.onopen = async () => {
      setIsConnected(true);
      sendMessage(ws, { type: 'conversation_initiation_client_data' });
      await startStreaming();
    };

    ws.onmessage = (event) => {
      let msg: ElevenLabsWebSocketEvent;
      if (event.data instanceof ArrayBuffer) {
        const base64 = btoa(String.fromCharCode(...new Uint8Array(event.data)));
        msg = { type: 'audio', audio_event: { audio_base_64: base64, event_id: Date.now() } };
      } else {
        try { msg = JSON.parse(event.data); } 
        catch { console.warn('Non-JSON message:', event.data); return; }
      }

      // Handle ping-pong
      if (msg.type === 'ping') {
        setTimeout(() => sendMessage(ws, { type: 'pong', event_id: msg.ping_event.event_id }), msg.ping_event.ping_ms || 1000);
      }

      setMessages(prev => [...prev, msg]);
    };

    ws.onerror = (err) => console.error('WebSocket error:', err);
    ws.onclose = () => {
      setIsConnected(false);
      websocketRef.current = null;
      stopStreaming();
    };
  }, [isConnected, startStreaming, stopStreaming]);

  const stopConversation = useCallback(() => {
    if (websocketRef.current) websocketRef.current.close();
    audioElements.current.forEach(a => { a.pause(); a.src = ''; });
    audioElements.current = [];
    setIsConnected(false);
    setMessages([]);
  }, []);

  useEffect(() => {
    return () => { if (websocketRef.current) websocketRef.current.close(); };
  }, []);

  return { startConversation, stopConversation, isConnected, messages };
};
