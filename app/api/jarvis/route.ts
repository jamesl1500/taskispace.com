/**
 * Jarvis AI Bot API Route
 * 
 * This API route handles POST requests to interact with the Jarvis AI Bot.
 * It receives user messages, processes them, and returns AI-generated replies.
 * 
 * @module app/api/jarvis/route
 */
import { NextRequest, NextResponse } from 'next/server'
import { JarvisService } from '@/lib/services/jarvis-service'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    // Initialize Jarvis Service
    const jarvisService = new JarvisService()
    const openai = await jarvisService.openAiClient();

    // Call OpenAI API to get a response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are Jarvis, an AI assistant that helps users with their tasks and productivity.' },
        { role: 'user', content: message },
      ],
    });

    const aiReply = completion.choices[0].message?.content || 'I am sorry, I could not process your request at this time.'

    return NextResponse.json({ reply: aiReply })
  } catch (error) {
    console.error('Error in Jarvis API:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}