/**
 * Jarvis AI Bot service
 * 
 * This service module provides functions to interact with the Jarvis AI Bot,
 * including sending messages and receiving AI-generated responses.
 * 
 * @module lib/services/jarvis-service
 */
import { OpenAI } from 'openai';

export class JarvisService {
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    public async openAiClient() {
        return this.openai;
    }
}