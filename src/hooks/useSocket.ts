// hooks/useSocket.ts (or wherever you placed the file)
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ElevenLabsWebSocketEvent } from '@/app/types/websocket'; // Ensure this path is correct

export const useSocket = (signedUrl: string | null) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ElevenLabsWebSocketEvent[]>([]);
  // Removed internal callStatus state managed by WebSocket messages
  // const [callStatus, setCallStatus] = useState<'idle' | string>('idle'); 
  const audioQueue = useRef<string[]>([]);
  const isPlaying = useRef(false);
  const audioElements = useRef<HTMLAudioElement[]>([]); // To manage multiple audio elements

  // --- Audio Playback Logic (Remains the same) ---
  const processAudioQueue = useCallback(() => {
    if (isPlaying.current || audioQueue.current.length === 0) return;
    
    isPlaying.current = true;
    const audioBase64 = audioQueue.current.shift();

    if (audioBase64) {
      const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`); // Use mp3 for ElevenLabs usually
      const currentAudioElements = audioElements.current; // Capture current state
      currentAudioElements.push(audio); // Add to list
      audioElements.current = currentAudioElements; // Update ref

      const onEnd = () => {
        isPlaying.current = false;
        // Clean up this specific audio element from the ref list
        audioElements.current = audioElements.current.filter(a => a !== audio);
        processAudioQueue(); // Process next item
      };

      audio.onended = onEnd;
      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        onEnd(); // Treat error as end to process next
      };

      audio.play().catch((e) => {
        console.error("Failed to play audio:", e);
        onEnd(); // Treat error as end
      });
    } else {
      isPlaying.current = false; // Queue was empty
    }
  }, []); // No dependencies needed for refs and state setters

  // --- WebSocket Connection Logic (Now inside useEffect) ---
  useEffect(() => {
    // Only attempt connection if we have a URL and are not already connected
    if (signedUrl && !isConnected && !wsRef.current) {
      console.log('Attempting WebSocket connection to:', signedUrl.substring(0, 50) + "...");
      const ws = new WebSocket(signedUrl);
      ws.binaryType = 'arraybuffer'; // Important for receiving audio
      wsRef.current = ws; // Store the WebSocket instance

      ws.onopen = () => {
        console.log('✅ WebSocket Connected. Initializing conversation...');
        setIsConnected(true);
        // Send initial message if required by ElevenLabs Convai API
        ws.send(JSON.stringify({ type: 'conversation_initiation_client_data' })); 
        // Note: You might need to send specific agent/call details here 
        // depending on the exact API requirements when using signed URLs.
        // Check ElevenLabs docs for what the FIRST message should contain.
      };

      ws.onmessage = (event) => {
        let msg: ElevenLabsWebSocketEvent;
        
        // Handle binary audio data
        if (event.data instanceof ArrayBuffer) {
          // Convert ArrayBuffer to Base64 string
           const base64 = btoa(String.fromCharCode(...new Uint8Array(event.data)));
           msg = { type: 'audio', audio_event: { audio_base_64: base64, event_id: Date.now() } };
           console.log("Received audio chunk:", msg.audio_event.event_id); // Log audio receipt
           audioQueue.current.push(base64); // Add to queue
        } 
        // Handle JSON text data
        else {
          try { 
            msg = JSON.parse(event.data); 
            console.log("Received WebSocket message:", msg); // Log text messages
            
             // *** REMOVED callStatus update based on WebSocket message ***
             // The main call status (ringing, connected, failed) is now handled via polling in CallsPage
             // if (msg.type === 'call_status') {
             //   setCallStatus(msg.call_status_event?.status || 'idle');
             // }

             // Handle ping-pong for keep-alive
             if (msg.type === 'ping' && msg.ping_event) {
                 const { event_id, ping_ms } = msg.ping_event;
                 console.log(`Received ping ${event_id}, responding...`);
                 // Respond after a short delay if specified, otherwise immediately
                 setTimeout(() => {
                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                        wsRef.current.send(JSON.stringify({ type: 'pong', event_id }));
                    }
                 }, ping_ms || 0); // Use ping_ms or 0 delay
             }

          } catch (e) { 
            console.warn("Received non-JSON/non-binary WebSocket message:", event.data); 
            return; // Ignore malformed messages
          }
        }

        setMessages(prev => [...prev, msg]); // Add message to history
        
        // Start playing if not already playing and queue has items
        if (!isPlaying.current && audioQueue.current.length > 0) {
          processAudioQueue();
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        // State will be updated via onclose
      };

      ws.onclose = (event) => {
        console.log(`WebSocket disconnected: Code=${event.code}, Reason=${event.reason}`);
        setIsConnected(false);
        wsRef.current = null;
        // Clear audio queue and stop playback on disconnect
        audioQueue.current = [];
        audioElements.current.forEach(a => { a.pause(); a.src = ''; }); // Stop and clear src
        audioElements.current = [];
        isPlaying.current = false;
        // Do NOT reset callStatus here, let CallsPage manage it
      };
    } else if (!signedUrl && wsRef.current) {
        // If the signedUrl prop becomes null (e.g., call ended), explicitly close the connection
        console.log("Signed URL removed, closing WebSocket connection.");
        wsRef.current.close(1000, "Client initiated disconnect"); // 1000 = Normal closure
        // onclose handler will set isConnected to false and clean up refs
    }

    // --- Cleanup function for useEffect ---
    return () => {
      // This runs when the component unmounts OR when signedUrl changes *before* the main effect runs again
      const currentWs = wsRef.current; // Capture ref value at the time effect runs
      if (currentWs) {
        console.log("Cleaning up WebSocket connection...");
        currentWs.close(1000, "Component unmounting or URL change");
        wsRef.current = null; // Clear ref immediately on cleanup start
        setIsConnected(false); // Update state immediately
        audioQueue.current = [];
        audioElements.current.forEach(a => { a.pause(); a.src = ''; });
        audioElements.current = [];
        isPlaying.current = false;
      }
    };
  }, [signedUrl, isConnected, processAudioQueue]); // Dependency array includes signedUrl and isConnected

  // Function to manually stop the connection (used by CallsPage hangup)
  const stopSocket = useCallback(() => {
    if (wsRef.current) {
      console.log("Manually closing WebSocket connection via stopSocket...");
      wsRef.current.close(1000, "Client requested stop");
      // Let the onclose handler manage state updates (isConnected, refs)
    } else {
        // Ensure state is clean even if ref was already null
         setIsConnected(false);
         audioQueue.current = [];
         audioElements.current.forEach(a => { a.pause(); a.src = ''; });
         audioElements.current = [];
         isPlaying.current = false;
    }
  }, []); // No dependencies needed

  // startSocket is kept for potential future use (e.g., manual reconnect button)
  // but is NOT the primary way connection is established anymore.
  const startSocket = useCallback(() => {
       if (signedUrl && !isConnected && !wsRef.current) {
            // This would manually trigger the connection logic if needed,
            // but the useEffect above handles the primary connection now.
            console.warn("Manual startSocket called, but useEffect should handle connection.");
             // You could re-implement the connection logic here if you need a manual trigger
             // separate from the useEffect based on signedUrl prop.
       } else if (isConnected) {
            console.log("Socket already connected.");
       } else if (!signedUrl) {
           console.warn("Cannot start socket: Signed URL is missing.");
       }
  }, [signedUrl, isConnected]);


  // Return state and control functions
  return { 
    isConnected, // True if WebSocket is currently open
    messages,    // Array of received WebSocket messages (text and audio pointers)
    // Removed callStatus from return, handled in CallsPage
    startSocket, // Kept, but connection is mainly automatic now
    stopSocket   // Function to manually close the WebSocket
  };
};