'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ElevenLabsWebSocketEvent } from '@/app/types/websocket';

export const useSocket = (signedUrl: string | null) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ElevenLabsWebSocketEvent[]>([]);
  const [callStatus, setCallStatus] = useState<'idle' | string>('idle');
  const audioQueue = useRef<string[]>([]);
  const isPlaying = useRef(false);
  const audioElements = useRef<HTMLAudioElement[]>([]);

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
    } else {
      isPlaying.current = false;
    }
  }, []);

  const startSocket = useCallback(() => {
    if (!signedUrl || isConnected || wsRef.current) return;

    const ws = new WebSocket(signedUrl);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ Connection live, initializing conversation...');
      setIsConnected(true);
      ws.send(JSON.stringify({ type: 'conversation_initiation_client_data' }));
    };

    ws.onmessage = (event) => {
      let msg: ElevenLabsWebSocketEvent;
      if (event.data instanceof ArrayBuffer) {
        const base64 = btoa(String.fromCharCode(...new Uint8Array(event.data)));
        msg = { type: 'audio', audio_event: { audio_base_64: base64, event_id: Date.now() } };
      } else {
        try { msg = JSON.parse(event.data); } 
        catch { console.warn("Non-JSON message:", event.data); return; }
      }

      if (msg.type === 'call_status') setCallStatus(msg.call_status_event?.status || 'idle');
      if (msg.type === 'audio' && msg.audio_event?.audio_base_64) audioQueue.current.push(msg.audio_event.audio_base_64);

      setMessages(prev => [...prev, msg]);
      if (!isPlaying.current && audioQueue.current.length > 0) processAudioQueue();
    };

    ws.onerror = (err) => console.error('WebSocket error:', err);
    ws.onclose = () => { setIsConnected(false); wsRef.current = null; setCallStatus('idle'); };
  }, [signedUrl, isConnected, processAudioQueue]);

  const stopSocket = useCallback(() => {
    if (wsRef.current) wsRef.current.close();
    audioElements.current.forEach(a => { a.pause(); a.src = ''; });
    audioElements.current = [];
    setIsConnected(false);
  }, []);

  useEffect(() => () => { if (wsRef.current) wsRef.current.close(); }, []);

  return { isConnected, messages, callStatus, startSocket, stopSocket };
};
