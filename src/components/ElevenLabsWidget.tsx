// components/ElevenLabsWidget.tsx
'use client';

import { useEffect } from 'react';

export default function ElevenLabsWidget() {
  useEffect(() => {
    // Load the script
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
    script.async = true;
    script.type = 'text/javascript';
    document.body.appendChild(script);

    return () => {
      // Cleanup on unmount
      document.body.removeChild(script);
    };
  }, []);

  return (
    <elevenlabs-convai agent-id="agent_9201k6q4wxp2f7prkzxzvfwsg3cs"></elevenlabs-convai>
  );
}
