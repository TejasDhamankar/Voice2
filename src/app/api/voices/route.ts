import { NextRequest, NextResponse } from "next/server";
const KEY = process.env.ELEVENLABS_API_KEY!;
export const dynamic = "force-dynamic";

// Create agent with knowledge base
export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    name,
    voice_id,
    prompt,
    llm_model = "eleven-multilingual-v1",
    temperature = 0.3,
    language = "en",
    knowledge_documents = [],
    tools = []
  } = body;

  try {
    // 1. First, upload knowledge base documents if provided
    const documentIds = [];
    for (const doc of knowledge_documents) {
      const formData = new FormData();
      if (doc.type === 'file') {
        formData.append('file', doc.file);
      } else if (doc.type === 'url') {
        formData.append('url', doc.url);
      } else if (doc.type === 'text') {
        formData.append('name', doc.name);
        formData.append('content', doc.content);
      }

      const kbRes = await fetch("https://api.elevenlabs.io/v1/convai/knowledge-base", {
        method: "POST",
        headers: { "xi-api-key": KEY },
        body: formData
      });

      if (kbRes.ok) {
        const kbData = await kbRes.json();
        documentIds.push(kbData.document_id);
      }
    }

    // 2. Create the agent
    const agentConfig = {
      name,
      conversation_config: {
        agent: {
          prompt,
          llm: {
            model: llm_model,
            temperature
          },
          language,
          tools,
          knowledge_base: documentIds
        },
        tts: {
          model: "eleven-multilingual-v1",
          voice_id,
          audio_format: {
            format: "pcm",
            sample_rate: 44100
          }
        },
        asr: {
          model: "nova-2-general",
          language: "auto"
        },
        conversation: {
          max_duration_seconds: 1800,
          text_only: false
        }
      }
    };

    const agentRes = await fetch("https://api.elevenlabs.io/v1/convai/agents/create", {
      method: "POST",
      headers: {
        "xi-api-key": KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(agentConfig)
    });

    if (!agentRes.ok) {
      return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
    }

    const agent = await agentRes.json();
    return NextResponse.json({
      agent_id: agent.agent_id,
      name: agent.name,
      knowledge_documents: documentIds
    });

  } catch (error) {
    return NextResponse.json({ error: "Creation failed" }, { status: 500 });
  }
}

// Keep your existing GET for voices
export async function GET() {
  const res = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": KEY }
  });

  if (!res.ok) return NextResponse.json({ voices: [] }, { status: 500 });

  const json = await res.json();
  const safe = json.voices.map((v) => ({
    id: v.voice_id,
    name: v.name,
    tags: v.labels?.accent || "General",
    demo: v.preview_url,
  }));

  return NextResponse.json({ voices: safe });
}
