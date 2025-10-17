import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Agent from "@/models/agentModel";
import { getUserFromRequest } from "@/lib/jwt";
// --- THIS IS THE CORRECTED IMPORT ---
import  {createAgent}  from "@/lib/elevenLabs/agents/createAgent";
import KnowledgeDocument from "@/models/knowledgeModel";

// Helper function to get template name from ID
function getTemplateName(templateId: string) {
  const templateMap: { [key: string]: string } = {
    "sales-assistant": "Sales Assistant",
    "customer-support": "Customer Support",
    "appointment-scheduler": "Appointment Scheduler",
    "lead-qualification": "Lead Qualification",
    "followup-scheduler": "Followup Scheduler",
    "booking-agent": "Booking Agent"
  };
  return templateMap[templateId] || null;
}

export async function POST(request: NextRequest) {
  try {
    const userData = await getUserFromRequest(request);
    if (!userData) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const agentDataString = formData.get('agentData');
    if (!agentDataString || typeof agentDataString !== 'string') {
      return NextResponse.json({ message: "Missing agentData" }, { status: 400 });
    }
    const body = JSON.parse(agentDataString);

    formData.forEach((value, key) => {
        if (key.startsWith('file_') && value instanceof File) {
            if (!body.knowledge_documents) body.knowledge_documents = [];
            body.knowledge_documents.push({ type: 'file', name: value.name, file: value });
        }
    });

    const userId = typeof userData === "object" ? userData.userId : userData;

    await connectDB();

    const globalDocs = await KnowledgeDocument.find({ userId, isGlobal: true });
    let processedKnowledgeDocuments = globalDocs.map(doc => ({
      document_id: doc.elevenLabsDocumentId,
      name: doc.name,
      type: doc.type,
      content: doc.content,
      url: doc.url,
      created_at: doc.uploadedAt
    })).filter(doc => doc.document_id);

    if (body.knowledge_documents && body.knowledge_documents.length > 0) {
      const KEY = process.env.ELEVENLABS_API_KEY!;
      for (const doc of body.knowledge_documents) {
        if (!doc.content && !doc.url && !doc.file) continue;

        const elevenLabsFormData = new FormData();
        let elevenLabsDocumentId = null;

        if (doc.type === 'text' && doc.content) {
          const tempFile = new File([doc.content], "content.txt", { type: "text/plain" });
          elevenLabsFormData.append("file", tempFile);
          elevenLabsFormData.append("name", doc.name || "Text Document");
        } else if (doc.type === 'url' && doc.url) {
          elevenLabsFormData.append("url", doc.url);
          elevenLabsFormData.append("name", doc.name || "URL Document");
        } else if (doc.type === 'file' && doc.file) {
          elevenLabsFormData.append("file", doc.file);
          elevenLabsFormData.append("name", doc.name || "File Document");
        } else {
          continue;
        }

        try {
          const kbRes = await fetch("https://api.elevenlabs.io/v1/convai/knowledge-base", {
            method: "POST",
            headers: { "xi-api-key": KEY },
            body: elevenLabsFormData
          });
          if (kbRes.ok) {
            const kbData = await kbRes.json();
            elevenLabsDocumentId = kbData.id || kbData.document_id;
          } else {
            console.error("Failed to upload knowledge document to ElevenLabs:", await kbRes.text());
          }
        } catch (elevenLabsError) {
          console.error("ElevenLabs upload error:", elevenLabsError);
        }

        const documentData = {
          document_id: elevenLabsDocumentId,
          name: doc.name || 'Document',
          type: doc.type,
          content: doc.type === 'text' ? doc.content : undefined,
          url: doc.type === 'url' ? doc.url : undefined,
          created_at: new Date()
        };
        processedKnowledgeDocuments.push(documentData);

        try {
          const knowledgeDoc = new KnowledgeDocument({
            userId,
            name: documentData.name,
            type: documentData.type,
            content: documentData.content,
            url: documentData.url,
            elevenLabsDocumentId: elevenLabsDocumentId,
            isGlobal: false,
          });
          await knowledgeDoc.save();
        } catch (dbError) {
          console.error("Error saving knowledge document to database:", dbError);
        }
      }
    }

    const { getDefaultSystemTools } = await import('@/lib/systemTools');
    const agentData = {
      userId,
      name: body.name,
      description: body.description || "", // from frontend
      voiceId: body.voiceId, // from frontend
      firstMessage: body.firstMessage, // from frontend
      systemPrompt: body.systemPrompt, // from frontend
      templateId: body.templateId, // from frontend
      template_name: body.template_id ? getTemplateName(body.template_id) : null,
      llm_model: body.llm_model || "gpt-4o-mini",
      temperature: body.temperature || 0.3,
      language: body.language || "en",
      max_duration_seconds: body.max_duration_seconds || 1800,
      knowledge_documents: processedKnowledgeDocuments,
      tools: body.tools || [],
      systemTools: getDefaultSystemTools()
    };
    
    const result = await createAgent(agentData);

    try {
      const createdAgent = await Agent.findOne({ agentId: result.agent_id });
      if (createdAgent) {
        await KnowledgeDocument.updateMany(
          {
            userId,
            elevenLabsDocumentId: { $in: processedKnowledgeDocuments.map(doc => doc.document_id).filter(Boolean) },
            agentIds: { $ne: createdAgent._id }
          },
          { $push: { agentIds: createdAgent._id } }
        );
      }
    } catch (updateError) {
      console.error("Error updating knowledge documents with agent reference:", updateError);
    }

    return NextResponse.json({
      agent_id: result.agent_id,  
      name: result.name,
      message: result.message
    });

  } catch (err: any) {
    // Log the full error object to see the stack trace and more details
    console.error("FULL ERROR IN ROUTE:", err); 
    return NextResponse.json(
      { message: "Failed to create agent", error: err.message },
      { status: 500 }
    );
  }
}
