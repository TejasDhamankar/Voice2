import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Agent from "@/models/agentModel";
import { getUserFromRequest } from "@/lib/jwt";
import { createAgent } from "@/lib/elevenLabs/agents/createAgent";
import KnowledgeDocument from "@/models/knowledgeModel";


const KEY = process.env.ELEVENLABS_API_KEY!;

/* ───────────────────────── GET ───────────────────────── */

export async function GET(request: NextRequest) {
  try {
    const userData = await getUserFromRequest(request);
    if (!userData) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const agents = await Agent.find({
      userId: typeof userData === "object" ? userData.userId : userData,
    });

    const formatted = agents.map((a) => ({
      _id: a._id,
      agent_id: a.agentId,
      name: a.name,
      description: a.description,
      disabled: a.disabled,
      voice_id: a.voiceId,
      voiceName: a.voiceName,
      usage_minutes: a.usageMinutes,
      last_called_at: a.lastCalledAt,
      template_id: a.templateId,
      template_name: a.templateName,
      llm_model: a.llmModel,
      temperature: a.temperature,
      language: a.language,
      max_duration_seconds: a.maxDurationSeconds,
      knowledge_documents: a.knowledgeDocuments,
      tools: a.tools,
      conversation_config: {
        first_message: a.firstMessage,
        system_prompt: a.systemPrompt,
        enable_summary: true,
      },
    }));

    return NextResponse.json({ agents: formatted });
  } catch (err: any) {
    console.error("Error fetching agents:", err);
    return NextResponse.json(
      { message: "Failed to fetch agents", error: err.message },
      { status: 500 },
    );
  }
}

/* ───────────────────────── POST ───────────────────────── */


// export async function POST(request: NextRequest) {
//   try {
//     const userData = await getUserFromRequest(request);
//     if (!userData) {
//       return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
//     }

//     // Parse multipart/form-data
//     const formData = await request.formData();
//     const agentDataString = formData.get('agentData');
//     if (!agentDataString || typeof agentDataString !== 'string') {
//       return NextResponse.json({ message: "Missing agentData" }, { status: 400 });
//     }
//     const body = JSON.parse(agentDataString);

//     // Reconstruct knowledge_documents with file info
//     formData.forEach((value, key) => {
//         if (key.startsWith('file_') && value instanceof File) {
//             if (!body.knowledge_documents) body.knowledge_documents = [];
//             body.knowledge_documents.push({ type: 'file', name: value.name, file: value });
//         }
//     });

//     const userId = typeof userData === "object" ? userData.userId : userData;

//     await connectDB();

//     // Get existing global knowledge documents
//     const globalDocs = await KnowledgeDocument.find({ userId, isGlobal: true });
//     let processedKnowledgeDocuments = globalDocs.map(doc => ({
//       document_id: doc.elevenLabsDocumentId,
//       name: doc.name,
//       type: doc.type,
//       content: doc.content,
//       url: doc.url,
//       created_at: doc.uploadedAt
//     })).filter(doc => doc.document_id); // Only include docs that have ElevenLabs ID

//     console.log("Found global knowledge documents:", globalDocs.length);

//     // Process any additional knowledge documents provided in the request
//     if (body.knowledge_documents && body.knowledge_documents.length > 0) {
//       console.log("Processing knowledge documents:", body.knowledge_documents.length);

//       const KEY = process.env.ELEVENLABS_API_KEY!;

//       for (const doc of body.knowledge_documents) {
//         try {
//           // Skip empty documents
//           if (!doc.content && !doc.url && !doc.file) {
//             console.log("Skipping empty document");
//             continue;
//           }

//           // Create a new FormData for each upload to ElevenLabs
//           const elevenLabsFormData = new FormData();
//           let elevenLabsDocumentId = null;

//           if (doc.type === 'text' && doc.content) {
//             // For text content, create a temporary file
//             const tempFile = new File([doc.content], "content.txt", { type: "text/plain" });
//             elevenLabsFormData.append("file", tempFile);
//             elevenLabsFormData.append("name", doc.name || "Text Document");
//           } else if (doc.type === 'url' && doc.url) {
//             elevenLabsFormData.append("url", doc.url);
//             elevenLabsFormData.append("name", doc.name || "URL Document");
//           } else if (doc.type === 'file' && doc.file) {
//             // Correctly handle the file object
//             elevenLabsFormData.append("file", doc.file);
//             elevenLabsFormData.append("name", doc.name || "File Document");
//           } else {
//             console.log("Skipping invalid document:", doc);
//             continue;
//           }

//           // Upload to ElevenLabs knowledge base
//           try {
//             const kbRes = await fetch("https://api.elevenlabs.io/v1/convai/knowledge-base", {
//               method: "POST",
//               headers: { "xi-api-key": KEY },
//               body: elevenLabsFormData
//             });

//             if (kbRes.ok) {
//               const kbData = await kbRes.json();
//               elevenLabsDocumentId = kbData.id || kbData.document_id;
//               console.log("Knowledge document uploaded to ElevenLabs:", { id: elevenLabsDocumentId, name: doc.name });
//             } else {
//               const errorText = await kbRes.text();
//               console.error("Failed to upload knowledge document to ElevenLabs:", errorText);
//               // Continue without ElevenLabs ID - we can still save to our DB
//             }
//           } catch (elevenLabsError) {
//             console.error("ElevenLabs upload error:", elevenLabsError);
//             // Continue without ElevenLabs ID
//           }

//           // Create the document data for the agent
//           const documentData = {
//             document_id: elevenLabsDocumentId,
//             name: doc.name || 'Document',
//             type: doc.type,
//             content: doc.type === 'text' ? doc.content : undefined,
//             url: doc.type === 'url' ? doc.url : undefined,
//             created_at: new Date()
//           };

//           // Add to processed documents (even if ElevenLabs upload failed)
//           processedKnowledgeDocuments.push(documentData);

//           // Save to our knowledge base database
//           try {
//             const knowledgeDoc = new KnowledgeDocument({
//               userId,
//               name: documentData.name,
//               type: documentData.type,
//               content: documentData.content,
//               url: documentData.url,
//               elevenLabsDocumentId: elevenLabsDocumentId, // Can be null if ElevenLabs upload failed
//               category: doc.category || '',
//               tags: doc.tags || [],
//               description: doc.description || '',
//               isGlobal: false, // New documents are not global by default
//               agentIds: [], // Will be populated after agent is created
//               uploadedAt: new Date(),
//               lastModified: new Date(),
//               usageCount: 0,
//             });

//             const savedDoc = await knowledgeDoc.save();
//             console.log("Knowledge document saved to database:", { id: savedDoc._id, name: savedDoc.name });
//           } catch (dbError) {
//             console.error("Error saving knowledge document to database:", dbError);
//             // Continue with agent creation even if DB save fails
//           }

//         } catch (error) {
//           console.error("Error processing document:", error);
//           // Continue with other documents
//         }
//       }
//     }

//     console.log("Total processed knowledge documents:", processedKnowledgeDocuments.length);


//     console.log("Total processed knowledge documents:", processedKnowledgeDocuments.length);

//     // Import system tools
//     const { getDefaultSystemTools } = await import('@/lib/systemTools');

//     // Create the agent data with system tools
//     const agentData = {
//       userId,
//       name: body.name,
//       description: body.description || "",
//       voice_id: body.voice_id,
//       first_message: body.first_message,
//       system_prompt: body.system_prompt,
//       template_id: body.template_id,
//       template_name: body.template_id ? getTemplateName(body.template_id) : null,
//       llm_model: body.llm_model || "gpt-4o-mini",
//       temperature: body.temperature || 0.3,
//       language: body.language || "en",
//       max_duration_seconds: body.max_duration_seconds || 1800,
//       knowledge_documents: processedKnowledgeDocuments,
//       tools: body.tools || [], // User tools
//       systemTools: getDefaultSystemTools() // System tools
//     };
//     const result = await createAgent(agentData);
//     // After the agent is successfully created, add this:
//     try {
//       const { syncGlobalKnowledgeToAgent } = await import('@/lib/knowledgeSync');
//       await syncGlobalKnowledgeToAgent(result.agentId, userId);
//       console.log('Global documents synced to new agent');
//     } catch (syncError) {
//       console.error('Error syncing global docs to new agent:', syncError);
//     }

//     // After agent is created, update knowledge documents to reference this agent
//     try {
//       const createdAgent = await Agent.findOne({ agentId: result.agentId });
//       if (createdAgent) {
//         // Update knowledge documents that were created for this agent to include agent reference
//         await KnowledgeDocument.updateMany(
//           {
//             userId,
//             elevenLabsDocumentId: { $in: processedKnowledgeDocuments.map(doc => doc.document_id).filter(Boolean) },
//             agentIds: { $ne: createdAgent._id } // Don't duplicate if already exists
//           },
//           { $push: { agentIds: createdAgent._id } }
//         );
//         console.log("Updated knowledge documents with agent reference");
//       }
//     } catch (updateError) {
//       console.error("Error updating knowledge documents with agent reference:", updateError);
//       // Don't fail the agent creation for this
//     }

//     return NextResponse.json({
//       agent_id: result.agentId,
//       name: result.name,
//       knowledge_documents: processedKnowledgeDocuments,
//       message: result.message
//     });

//   } catch (err: any) {
//     console.error("Error creating agent:", err);
//     console.error("Error stack:", err.stack);
//     return NextResponse.json(
//       { message: "Failed to create agent", error: err.message },
//       { status: 500 },
//     );
//   }
// }

// ... rest of the existing code ...


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
