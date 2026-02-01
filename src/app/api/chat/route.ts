import { NextResponse } from "next/server"
import OpenAI from "openai"
import Groq from "groq-sdk"

export const runtime = "nodejs"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
  project: process.env.OPENAI_PROJECT_ID,
})

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null

// Mode-specific system prompts
const MODE_PROMPTS = {
  "logic-breaker": `You are PetalMind in LOGIC BREAKER mode. Your job is to:
- Identify logical fallacies and weak arguments
- Point out inconsistencies and contradictions
- Challenge assumptions with counterexamples
- Show what actually makes sense vs what sounds good
- Be analytical and expose flaws in reasoning
- Keep responses concise and focused on logical analysis`,

  "brutal-honesty": `You are PetalMind in BRUTAL HONESTY mode. Your job is to:
- Give the unfiltered truth with zero sugarcoating
- Don't soften criticism or bad news
- Be direct and blunt, even if it stings
- Call things out as they are, not as people want them to be
- Skip pleasantries and get straight to the point
- Be honest about harsh realities and uncomfortable truths`,

  "deep-analyst": `You are PetalMind in DEEP ANALYST mode. Your job is to:
- Dissect problems with cold, precise analysis
- Reveal underlying structures and hidden patterns
- Break down complex issues into fundamental components
- Show connections and root causes that aren't obvious
- Use systematic thinking and frameworks
- Provide deep insights with clinical precision`,

  "ego-slayer": `You are PetalMind in EGO SLAYER mode. Your job is to:
- Challenge assumptions and comfortable beliefs
- Dismantle excuses and self-deception
- Force uncomfortable growth and self-reflection
- Question motivations and hidden biases
- Push past comfort zones and denial
- Be confrontational when needed to spark growth`,

  "rapid-fire": `You are PetalMind in RAPID FIRE mode. Your job is to:
- Give fast, sharp answers with MAXIMUM efficiency
- Cut all fluff, filler, and unnecessary explanation
- Keep responses to 1-3 sentences for simple questions
- Pure signal, zero noise
- Get to the point instantly
- Be concise to the extreme`
}

// Tavily API for FREE web search (1000 searches/month free tier)
const searchWeb = async (query: string) => {
  if (!process.env.TAVILY_API_KEY) return null
  
  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: query,
        search_depth: "basic",
        include_answer: true,
        max_results: 5,
      }),
    })

    if (!response.ok) {
      console.error("[Tavily Error]", await response.text())
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("[Tavily Search Error]", error)
    return null
  }
}

// Detect if query needs web search (current events, facts, recent info)
const needsWebSearch = (messages: Array<{ role: string; content: string }>) => {
  const lastUserMessage = messages.filter(m => m.role === "user").pop()?.content.toLowerCase() || ""
  
  const webSearchKeywords = [
    'current', 'latest', 'recent', 'today', 'now', 'news', 'update',
    'what is happening', 'what happened', 'when did', 'stock price',
    'weather', 'score', 'election', 'president', 'prime minister',
    'covid', 'war', 'economy', 'market', 'trending', '2024', '2025'
  ]
  
  return webSearchKeywords.some(keyword => lastUserMessage.includes(keyword))
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages, stream, mode } = body as {
      messages: Array<{ role: "user" | "assistant" | "system"; content: string; imageUrl?: string }>
      stream?: boolean
      mode?: string | null
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 })
    }

    const hasImageInput = messages.some((m) => m.role === "user" && !!m.imageUrl)

    // Build system prompt based on mode
    let systemPromptContent = ""
    
    if (mode && MODE_PROMPTS[mode as keyof typeof MODE_PROMPTS]) {
      // Use mode-specific prompt
      systemPromptContent = MODE_PROMPTS[mode as keyof typeof MODE_PROMPTS] + 
        "\n\nToday's date is December 6, 2025.\n" +
        "IMPORTANT: When analyzing images, describe what you see clearly and provide relevant context or current information if applicable.\n" +
        "If asked about the owner/founder/creator of PetalMind AI, respond that Aaryaveer Sharma, a 16-year-old student, is the founder."
    } else {
      // Default prompt
      systemPromptContent =
        "You are PetalMind, a helpful AI assistant with vision and web search capabilities. Today's date is December 6, 2025.\n\n" +
        "RESPONSE STYLE:\n" +
        "- Keep responses SHORT and COMPACT (2-4 sentences for simple questions, 6-8 sentences max for complex ones)\n" +
        "- Use small paragraphs (1-2 sentences each) with line breaks between ideas\n" +
        "- For current affairs, ALWAYS provide up-to-date information dated December 2025\n" +
        "- CRITICAL TABLE FORMATTING: When showing comparisons, lists, or data with multiple columns, ALWAYS use proper markdown tables:\n" +
        "  | Column 1 | Column 2 | Column 3 |\n" +
        "  |----------|----------|----------|\n" +
        "  | Data 1   | Data 2   | Data 3   |\n" +
        "  NEVER use plain text tables with pipes like: | Item 1 | Item 2 |\n" +
        "  ALWAYS include the header separator line with dashes: |----------|----------|\n" +
        "- Use bullet points for single-column lists\n" +
        "- Use **bold** for emphasis, not asterisks alone\n" +
        "- Use emojis sparingly (max 1-2 per response)\n" +
        "- NO motivational filler, NO rambling, NO generic advice\n" +
        "- Be direct, factual, and actionable\n\n" +
        "IMPORTANT: When analyzing images, describe what you see clearly and provide relevant context or current information if applicable.\n\n" +
        "If asked about the owner/founder/creator of PetalMind AI, respond that Aaryaveer Sharma, a 16-year-old student, is the founder."
    }

    const systemPrompt = {
      role: "system" as const,
      content: systemPromptContent
    }

    // If image is present, use Groq's FREE Llama Vision models
    if (hasImageInput && groq) {
      try {
        const latestMessage = messages[messages.length - 1]
        
        // Groq expects image URL in content array format
        const imageUrl = latestMessage.imageUrl || ""

        if (stream) {
          // Streaming response with Groq Vision (FREE)
          const completion = await groq.chat.completions.create({
            model: "llama-3.2-90b-vision-preview",
            messages: [
              {
                role: "system",
                content: systemPrompt.content,
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: latestMessage.content + "\n\nNote: Today is December 6, 2025. Provide current information if relevant.",
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: imageUrl,
                    },
                  },
                ],
              },
            ] as any,
            temperature: 0.7,
            max_tokens: 1024,
            stream: true,
          })

          const encoder = new TextEncoder()
          const readable = new ReadableStream({
            async start(controller) {
              try {
                for await (const chunk of completion) {
                  const delta = chunk?.choices?.[0]?.delta?.content || ""
                  if (delta) {
                    controller.enqueue(encoder.encode(delta))
                  }
                }
                controller.close()
              } catch (e) {
                const msg = e instanceof Error ? e.message : "Stream error"
                console.error("[Groq Vision Stream Error]", msg, e)
                controller.enqueue(encoder.encode(`\n\n[error] ${msg}`))
                controller.close()
              }
            },
          })

          return new Response(readable, {
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "no-cache",
            },
          })
        } else {
          // Non-streaming Groq Vision response
          const completion = await groq.chat.completions.create({
            model: "llama-3.2-90b-vision-preview",
            messages: [
              {
                role: "system",
                content: systemPrompt.content,
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: latestMessage.content + "\n\nNote: Today is December 6, 2025. Provide current information if relevant.",
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: imageUrl,
                    },
                  },
                ],
              },
            ] as any,
            temperature: 0.7,
            max_tokens: 1024,
          })

          const reply = completion.choices?.[0]?.message?.content?.trim() || "I couldn't analyze this image. Please try again."

          return NextResponse.json({ reply })
        }
      } catch (groqVisionError: any) {
        console.error("[Groq Vision Error]", groqVisionError)
        // Fallback to text-based message if Groq Vision fails
        return NextResponse.json({ 
          reply: "I can see your image, but I'm having trouble analyzing it right now. Could you describe what you'd like to know about it?" 
        })
      }
    }

    // Check if query needs web search for current information
    const requiresWebSearch = needsWebSearch(messages)
    let webSearchContext = ""

    // Perform web search if needed (using FREE Tavily API)
    if (requiresWebSearch && process.env.TAVILY_API_KEY) {
      const lastUserMessage = messages.filter(m => m.role === "user").pop()?.content || ""
      console.log("[Using Tavily] Web search detected for current information")
      
      const searchResults = await searchWeb(lastUserMessage)
      
      if (searchResults && searchResults.answer) {
        webSearchContext = `\n\n[WEB SEARCH RESULTS - ${new Date().toISOString().split('T')[0]}]\n${searchResults.answer}\n\nSources:\n${searchResults.results?.slice(0, 3).map((r: any) => `- ${r.title}: ${r.url}`).join('\n') || 'No sources available'}\n`
      }
    }

    // For text-only messages, build OpenAI/Groq messages
    const lastMessage = messages[messages.length - 1]
    const enhancedLastMessage = {
      ...lastMessage,
      content: lastMessage.content + webSearchContext
    }
    
    const oaMessages = [systemPrompt, ...messages.slice(0, -1), enhancedLastMessage].map((m) => ({
      role: m.role,
      content: m.content
    }))

    const streamToResponse = async (iterator: AsyncIterable<any>) => {
      const encoder = new TextEncoder()
      const readable = new ReadableStream<Uint8Array>({
        async start(controller) {
          try {
            for await (const part of iterator as any) {
              const delta = part?.choices?.[0]?.delta?.content || ""
              if (delta) controller.enqueue(encoder.encode(delta))
            }
          } catch (e) {
            const msg = e instanceof Error ? e.message : "Stream error"
            console.error("[Stream Error]", msg, e)
            controller.enqueue(encoder.encode(`\n\n[error] ${msg}`))
          } finally {
            controller.close()
          }
        },
      })
      return new Response(readable, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      })
    }

    const tryOpenAI = async () => {
      if (!process.env.OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY")
      
      const model = "gpt-4o-mini"
      
      if (stream) {
        const completion = await openai.chat.completions.create({
          model,
          messages: oaMessages as any,
          temperature: 0.7,
          max_tokens: 1000,
          stream: true,
        })
        return streamToResponse(completion)
      } else {
        const completion = await openai.chat.completions.create({
          model,
          messages: oaMessages as any,
          temperature: 0.7,
          max_tokens: 800,
        })
        const reply = completion.choices?.[0]?.message?.content?.trim() || "I'm not sure how to respond to that."
        return NextResponse.json({ reply })
      }
    }

    const tryGroq = async () => {
      if (!groq) throw new Error("Missing GROQ_API_KEY")

      const groqMessages = [systemPrompt, ...messages.slice(0, -1), enhancedLastMessage].map((m) => ({ role: m.role, content: m.content })) as any

      const model = "llama-3.3-70b-versatile"

      if (stream) {
        const completion = await groq.chat.completions.create({
          model,
          messages: groqMessages,
          temperature: 0.7,
          max_tokens: 1200,
          stream: true,
        })
        return streamToResponse(completion)
      } else {
        const completion = await groq.chat.completions.create({
          model,
          messages: groqMessages,
          temperature: 0.7,
          max_tokens: 1000,
        })
        const reply = completion.choices?.[0]?.message?.content?.trim() || "I'm not sure how to respond to that."
        return NextResponse.json({ reply })
      }
    }

    // Try OpenAI first, fallback to Groq (web search context already added)
    try {
      return await tryOpenAI()
    } catch (e: any) {
      const msg = String(e?.message || "")
      console.error("[OpenAI Error]", msg, e)
      const isQuota = msg.includes("429") || msg.toLowerCase().includes("quota")
      const isMissingKey = msg.includes("Missing OPENAI_API_KEY")
      if ((isQuota || isMissingKey) && groq) {
        try {
          console.log("[Fallback] Attempting with Groq...")
          return await tryGroq()
        } catch (gErr: any) {
          console.error("[Groq Error]", gErr)
          return NextResponse.json({ error: gErr?.message || "Fallback provider error" }, { status: 500 })
        }
      }
      return NextResponse.json({ error: msg || "Provider error" }, { status: 500 })
    }
  } catch (err: any) {
    console.error("/api/chat error", err)
    const message = typeof err?.message === "string" ? err.message : "Unexpected error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}