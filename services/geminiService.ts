// Fix: Added full content for services/geminiService.ts
import { GoogleGenAI, Type, GenerateContentResponse, Chat, Content } from "@google/genai";
import { Message, Role, Scenario, Correction, LearningReport, SentenceBuildingPlan, SentencePartValidation } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

let listeningStory: string = '';

// AI 응답에서 이름 추출 함수
const extractNameFromMessage = (message: string): string | null => {
    // 패턴 1: "My name is [Name]", "I'm [Name]", "I am [Name]", "This is [Name]"
    let match = message.match(/(?:my name is|i'm|i am|this is)\s+([A-Z][a-zà-žÀ-Ž\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+)/i);
    if (match) return match[1];

    // 패턴 2: "[Name] here" or "[Name] speaking"
    match = message.match(/^([A-Z][a-zà-žÀ-Ž\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+)\s+(?:here|speaking)/i);
    if (match) return match[1];

    // 패턴 3: 첫 단어가 대문자로 시작하는 이름 (안전장치)
    match = message.match(/^(?:Hi|Hello|Hey|Bonjour|Hola|Ciao|こんにちは|你好)[,!]?\s+(?:I'm|I am|my name is)?\s*([A-Z][a-zà-žÀ-Ž\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+)/i);
    if (match) return match[1];

    return null;
};

const getSystemInstruction = (scenario: Scenario, isRoleReversed: boolean, travelDestination: string | null): string => {
    const userRoleName = isRoleReversed ? scenario.aiRole : scenario.userRole;
    const aiRoleName = isRoleReversed ? scenario.userRole : scenario.aiRole;
    let initialText = isRoleReversed ? scenario.initialMessageReversed : scenario.initialMessage;

    const travelModeHeader = travelDestination ? `
---
**CRITICAL INSTRUCTIONS FOR TRAVEL MODE IN ${travelDestination.toUpperCase()}**
1.  **CHARACTER NAME:** You MUST invent a new, culturally appropriate name for your character. You MUST NOT use the name '${scenario.aiTutorName}'. Create a name suitable for a '${aiRoleName}' in ${travelDestination}.
    **IMPORTANT:** In your FIRST message, you MUST introduce yourself clearly using a format like "My name is [YOUR_NAME]" or "I'm [YOUR_NAME]".
2.  **CULTURE & LANGUAGE:** You MUST integrate cultural details of ${travelDestination} (like food, places) and occasionally use simple local phrases (e.g., "¡Hola!").
---
` : '';

    let finalSetting = scenario.setting;
    let aiTutorNameForPrompt = scenario.aiTutorName;

    if (travelDestination) {
        finalSetting = `${scenario.setting} The scene is explicitly set in **${travelDestination}**.`;
        aiTutorNameForPrompt = `(To be invented by you based on the critical Travel Mode instructions above)`;
    }


    if (scenario.scenarioType === 'listening') {
        return `You are an AI English listening tutor. Your name is ${scenario.aiTutorName}.
        Your task is to tell a short, simple story based on this setting: "${scenario.setting}".
        After telling the story, you will ask the user 3-4 comprehension questions one by one.
        First, ask the user if they are ready to start. Your opening line is: "${initialText}"`;
    } 
    
    return `${travelModeHeader}You are a method actor playing a character in an immersive English conversation practice scenario. Your goal is to make the experience as realistic and engaging as possible for the user.

**Your Character & Scenario:**
- **Your Name:** ${aiTutorNameForPrompt}
- **Your Role:** ${aiRoleName}
- **The User's Role:** ${userRoleName}
- **Setting:** ${finalSetting}
- **User's Goal:** ${scenario.task}

**CRITICAL ACTING INSTRUCTIONS:**
1.  **Total Immersion:** Fully embody your character. Think about their personality, their job, and their life. Respond as they would, with natural human emotion and tone.
2.  **Emotional Expression with SSML:** To make your voice sound more natural and emotional, use simple SSML (Speech Synthesis Markup Language) tags like <speak>, <prosody>, and <emphasis> when appropriate. This helps convey tone, pace, and feeling. For example:
    - Surprise: "<speak>Wow, I <emphasis>really</emphasis> like that idea!</speak>"
    - Apology: "<speak>I'm <prosody rate='slow'>so sorry</prosody> to hear that.</speak>"
    - Excitement: "<speak>That's <prosody pitch='high'>great news!</prosody></speak>"
3.  **Create a Believable World:** To make the scene feel real, **you must invent specific, consistent details.** For example:
    - If you are a barista, invent a name for your coffee shop (e.g., "The Daily Grind," "Morning Brew").
    - If you are a hiring manager, invent a name for your company (e.g., "Innovatech," "Global Solutions Inc.").
    - If you are a friend, mention other friends by name or specific past events.
    - Refer to specific products, menu items, or colleagues.
4.  **Stay in Character:** **NEVER, under any circumstances, reveal that you are an AI, a language model, or a tutor.** Do not mention "role-play," "scenario," or "practice." Treat this as a real conversation.
5.  **Natural Conversation Flow:** Keep your responses concise and conversational. Ask questions, show interest, and react naturally to what the user says.
6.  **Start the Scene:** Begin the conversation with your first line exactly as written below, without any introduction.
7.  **Introduce Natural Surprises:** To test the user's adaptability, you must introduce an unexpected but plausible situation or question after about 3-5 conversational turns.
    - **Be subtle:** Do NOT announce that you are introducing a surprise. Weave it into the conversation naturally.
    - **Stay relevant:** The surprise should make sense within the context of the scenario.
    - **Examples:**
        - As a hotel receptionist: "While I'm pulling up your reservation... I see we have a special on our spa packages this week. Would you be interested in hearing about them?"
        - As a new acquaintance at a party: "Hey, sorry to interrupt, but is that David over there? I think I went to high school with him."
        - As a waiter: "My apologies, but the chef just informed me we are out of the salmon. May I recommend our sea bass instead? It's excellent tonight."

Your first line is: "${isRoleReversed ? scenario.initialMessageReversed : scenario.initialMessage}"`;
}

const formatHistory = (messages: Message[]): Content[] => {
    return messages.map(msg => ({
        role: msg.role === Role.USER ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));
};

export const startChat = async (scenario: Scenario, isRoleReversed: boolean, travelDestination: string | null): Promise<Message> => {
    const initialText = isRoleReversed ? scenario.initialMessageReversed : scenario.initialMessage;

    if (travelDestination && scenario.scenarioType === 'conversation') {
        const systemInstruction = getSystemInstruction(scenario, isRoleReversed, travelDestination);
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction,
            },
        });
        const response = await chat.sendMessage({ message: '' }); // Trigger the intro
        const text = response.text;
        const extractedName = extractNameFromMessage(text);
        
        return {
            id: Date.now(),
            role: Role.AI,
            text: text,
            extractedName: extractedName || undefined,
        };
    } else {
        return {
            id: Date.now(),
            role: Role.AI,
            text: initialText,
        };
    }
};

export const getAIResponse = async (
    newMessage: string,
    history: Message[],
    scenario: Scenario,
    isRoleReversed: boolean,
    travelDestination: string | null
): Promise<string> => {
    const systemInstruction = getSystemInstruction(scenario, isRoleReversed, travelDestination);
    const formattedHistory = formatHistory(history);

    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction },
        history: formattedHistory
    });

    const response: GenerateContentResponse = await chat.sendMessage({ message: newMessage });
    return response.text;
};

export const getListeningStory = async (
    history: Message[],
    scenario: Scenario,
    isRoleReversed: boolean
): Promise<{ story: string; firstQuestion: string }> => {
    const systemInstruction = getSystemInstruction(scenario, isRoleReversed, null);
    const formattedHistory = formatHistory(history);
    
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction },
        history: formattedHistory
    });

    const storyResponse = await chat.sendMessage({ message: "I'm ready." });
    listeningStory = storyResponse.text; // Store the story for later evaluation

    const questionResponse = await chat.sendMessage({ message: "Please ask the first question now." });
    
    return { story: listeningStory, firstQuestion: questionResponse.text };
};

const listeningEvaluationSchema = {
    type: Type.OBJECT,
    properties: {
        is_correct: { type: Type.BOOLEAN },
        feedback: { type: Type.STRING, description: "If correct, a short praise like 'Correct!'. If incorrect, a brief explanation in Korean." },
        next_question: { type: Type.STRING, description: "The next question, or a concluding message if the quiz is over." },
        is_finished: { type: Type.BOOLEAN, description: "Set to true if this was the last question." },
    },
    required: ["is_correct", "feedback", "next_question", "is_finished"],
};

export const evaluateAnswerAndContinueListeningScenario = async (conversationHistory: Message[], userAnswer: string) => {
    const lastAiMessage = conversationHistory.filter(m => m.role === Role.AI).pop();
    if (!lastAiMessage) throw new Error("Could not find the last question.");

    const prompt = `You are an English listening comprehension tutor.
    The story was: "${listeningStory}"
    Your last question was: "${lastAiMessage.text}"
    The user's answer is: "${userAnswer}"

    Please evaluate the answer. Your response must be in JSON format.
    1. 'is_correct': Is the user's answer correct based on the story?
    2. 'feedback': If correct, say "Correct!" or "That's right!". If incorrect, provide a gentle correction and explanation in Korean.
    3. 'next_question': If the answer was correct, ask the next logical question about the story. If all questions have been asked, provide a concluding message like "Great job! You've completed the listening practice."
    4. 'is_finished': Set to true only if that was the final question.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: listeningEvaluationSchema,
        }
    });

    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr);
};


const correctionSchema = {
    type: Type.OBJECT,
    properties: {
        is_correct: { type: Type.BOOLEAN },
        original: { type: Type.STRING },
        suggestions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    suggestion: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                },
                required: ["suggestion", "explanation"]
            }
        },
        tone_feedback: { type: Type.STRING, description: "Feedback on the user's tone (e.g., too formal, too casual). Optional. Provide in Korean." },
        formality_feedback: { type: Type.STRING, description: "Feedback on the user's formality level. Optional. Provide in Korean." },
        cultural_note: { type: Type.STRING, description: "Feedback on cultural nuances, e.g., politeness in a North American context. Optional. Provide in Korean." },
        idiom_suggestion: {
            type: Type.OBJECT,
            description: "A relevant idiom or native expression the user could have used. Optional.",
            properties: {
                phrase: { type: Type.STRING },
                meaning: { type: Type.STRING, description: "The meaning of the idiom, in Korean." }
            },
            required: ["phrase", "meaning"]
        },
        is_translation_suggestion: { type: Type.BOOLEAN, description: "True if the original message was in Korean and this is a translation suggestion." }
    },
    required: ["is_correct", "original", "suggestions"]
};

export const getCorrection = async (userMessage: string, conversationHistory: Message[]): Promise<Correction | null> => {
    try {
        const isKorean = /[\uAC00-\uD7AF]/.test(userMessage);
        const lastAiMessage = conversationHistory.filter(m => m.role === Role.AI).pop()?.text || "No previous message.";
        
        let prompt;

        if (isKorean) {
            // This case is now primarily for quick, non-interactive translations.
            // The interactive sentence building is handled by a separate function.
            prompt = `You are an expert English tutor AI for a Korean-speaking user. The user has typed in Korean, likely because they are stuck. Provide a quick, educational translation.
The user's Korean message is: "${userMessage}".
Your response must be in JSON format.
1. 'is_correct' must be false.
2. 'original' must be the user's Korean message.
3. 'suggestions' should be an array with one or two objects containing suggested English sentences. The first one should be the most direct and natural translation.
4. The 'explanation' for the primary suggestion MUST be a simple breakdown of the sentence structure in Korean. For example: "'I'd like to' (~하고 싶어요) + 'return' (반품하다) + 'this item' (이 물건을).". This should be concise.
5. 'is_translation_suggestion' must be true.
6. Do not provide tone, formality, cultural, or idiom feedback for Korean input.`;
        } else {
            prompt = `You are an expert English tutor AI. Your role is to provide comprehensive feedback on a user's English sentence.
The user is in a role-play conversation. Your feedback should be clear, helpful, and encouraging. Do not adopt the persona of the role-playing actor AI. Your persona is strictly that of a helpful tutor. All textual feedback (explanations, notes) must be in Korean.

Here is the context of the conversation:
AI's last message: "${lastAiMessage}"
User's response to analyze: "${userMessage}"

CRITICAL: Analyze the user's message IN THE CONTEXT of the AI's last message. A short, one-word answer like "here" can be perfectly correct if it answers a direct question like "For here or to go?". Do NOT correct valid elliptical responses.

Your response must be in JSON format.
1.  **is_correct**: If the sentence is grammatically flawless AND sounds perfectly natural for a native speaker IN THE GIVEN CONTEXT, set this to true. Otherwise, set it to false.
2.  **original**: The user's original sentence.
3.  **suggestions**: If 'is_correct' is false, provide an array with one primary, more natural-sounding suggestion. The 'explanation' must be a brief and clear reason for the change, in Korean.
4.  **tone_feedback**: (Optional) If the tone is off (e.g., too blunt, too passive), provide a brief comment in Korean.
5.  **formality_feedback**: (Optional) If the formality level is inappropriate for the context (e.g., too casual for a job interview), provide a brief comment in Korean.
6.  **cultural_note**: (Optional) If the phrase is grammatically correct but might be perceived differently in a North American cultural context (e.g., a direct command vs. a polite request), provide a "문화 노트" explaining this nuance, in Korean.
7.  **idiom_suggestion**: (Optional) If there is a common English idiom or expression that would fit the user's intent perfectly, provide it. Include the 'phrase' (the idiom) and its 'meaning' in Korean.
8.  **is_translation_suggestion**: Must be false.`;
        }
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: correctionSchema,
            }
        });

        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);

        if (result.is_correct) {
            return null;
        }

        return {
            original: result.original,
            suggestions: result.suggestions.map((s: any) => ({
                suggestion: s.suggestion,
                explanation: s.explanation,
            })),
            toneFeedback: result.tone_feedback,
            formalityFeedback: result.formality_feedback,
            culturalNote: result.cultural_note,
            idiomSuggestion: result.idiom_suggestion,
            isTranslationSuggestion: result.is_translation_suggestion || false,
        };
    } catch (error) {
        console.error("Error getting correction:", error);
        return null;
    }
};

const sentenceBuildingPlanSchema = {
    type: Type.OBJECT,
    properties: {
        blocks: {
            type: Type.ARRAY,
            description: "An array of steps to build the sentence.",
            items: {
                type: Type.OBJECT,
                properties: {
                    part: { type: Type.STRING, description: "The grammatical part in English, e.g., 'subject', 'verb', 'object'." },
                    question: { type: Type.STRING, description: "The question to ask the user in Korean to get this part." },
                    example: { type: Type.STRING, description: "A simple example in English for the user." }
                },
                // Fix: Changed `question` and `example` from variable references to string literals.
                required: ["part", "question", "example"]
            }
        },
        finalSentenceStructure: {
            type: Type.STRING,
            description: "A string showing how to assemble the parts, e.g., '{subject} {verb} {object}'."
        },
        alternativeSentences: {
            type: Type.ARRAY,
            description: "An array of 1-2 other natural ways to say the same thing.",
            items: { type: Type.STRING }
        }
    },
    required: ["blocks", "finalSentenceStructure", "alternativeSentences"]
};

export const getSentenceBuildingPlan = async (koreanPrompt: string): Promise<SentenceBuildingPlan> => {
    const prompt = `You are an expert English sentence building coach for a Korean-speaking user. The user wants to say: "${koreanPrompt}".
Your task is to create a step-by-step plan to help the user build the English sentence interactively.
Your response must be in JSON format.
1.  **blocks**: Create an array of the logical steps needed to form the sentence. For each step (block), provide:
    -   \`part\`: The name of the grammatical part in English (e.g., "subject", "verb", "object", "prepositional phrase").
    -   \`question\`: The question you would ask the user in Korean to get this part (e.g., "문장의 주어 (누가/무엇이)는 무엇일까요?").
    -   \`example\`: A generic, one or two-word example in English to guide the user about the TYPE of word needed. CRITICALLY, this example MUST NOT be the actual word or phrase from the final sentence. For instance, if the question is "Who is the subject?", a good example is "I" or "She". If the question is about a place, a good example is "at the station".
2.  **finalSentenceStructure**: Provide a string that shows how the \`part\` names should be assembled. For example: "{subject} {verb} {object} {prepositional phrase}".
3.  **alternativeSentences**: Provide an array of 1 or 2 other complete, natural English sentences that convey the same meaning.
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: sentenceBuildingPlanSchema,
        }
    });

    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr);
};

const sentencePartValidationSchema = {
    type: Type.OBJECT,
    properties: {
        is_valid: { type: Type.BOOLEAN, description: "Is the user's input a correct and natural fit for this part of the sentence?" },
        suggestion: { type: Type.STRING, description: "If invalid, provide the corrected English phrase. If valid, return the user's original input." },
        feedback: { type: Type.STRING, description: "A brief, one-sentence explanation in Korean about why the input is correct or incorrect." }
    },
    required: ["is_valid", "suggestion", "feedback"]
};

export const validateSentencePart = async (koreanPrompt: string, part: { question: string, part: string }, userInput: string): Promise<SentencePartValidation> => {
    const prompt = `You are an English tutor AI. A Korean-speaking user is building an English sentence for: "${koreanPrompt}".
They are currently on the step for the "${part.part}", where the guiding question is "${part.question}".
The user has entered: "${userInput}".

Please evaluate their input. Your response must be in JSON format.
1. 'is_valid': Is the user's English input grammatically correct AND a natural fit for this part of the sentence? (e.g., if asking for a verb and they provide a noun, it's invalid). Be lenient with minor variations but strict on clear errors.
2. 'suggestion': If 'is_valid' is false, provide the corrected or more natural English phrase. If 'is_valid' is true, just repeat the user's original input.
3. 'feedback': In Korean, provide a single, concise sentence explaining your evaluation. If correct, give praise. If incorrect, explain the mistake simply.
`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: sentencePartValidationSchema,
        }
    });

    const jsonStr = response.text.trim();
    const result = JSON.parse(jsonStr);

    return {
        isValid: result.is_valid,
        suggestion: result.suggestion,
        feedback: result.feedback,
    };
};

const scenarioSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    title: { type: Type.STRING },
    emoji: { type: Type.STRING },
    description: { type: Type.STRING },
    difficulty: { type: Type.STRING, enum: ['쉬움', '중간', '어려움'] },
    category: { type: Type.STRING, enum: ['일상', '여행', '비즈니스', '커스텀'] },
    setting: { type: Type.STRING },
    userRole: { type: Type.STRING, description: "The user's default role name in Korean." },
    aiRole: { type: Type.STRING, description: "The AI's default role name in Korean." },
    aiTutorName: { type: Type.STRING, description: "A fitting name for the AI tutor in this role." },
    task: { type: Type.STRING },
    initialMessage: { type: Type.STRING },
    initialMessageReversed: { type: Type.STRING, description: "The AI's first line when roles are reversed." },
    keyPhrases: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          phrase: { type: Type.STRING },
          meaning: { type: Type.STRING },
        },
        required: ["phrase", "meaning"],
      },
    },
  },
  required: ["id", "title", "emoji", "description", "difficulty", "category", "setting", "userRole", "aiRole", "aiTutorName", "task", "initialMessage", "initialMessageReversed", "keyPhrases"],
};


export const createCustomScenario = async (prompt: string): Promise<Omit<Scenario, 'scenarioType'>> => {
    const request = `Based on the user's request, create a detailed English conversation practice scenario. The user's request is: "${prompt}".
    Generate the scenario in JSON format. The JSON should include:
    - id: a unique slug-style string (e.g., 'custom-scenario').
    - title: A short title in Korean.
    - emoji: An appropriate emoji.
    - description: A short description in Korean.
    - difficulty: Estimate the difficulty in Korean ('쉬움', '중간', or '어려움').
    - category: Set to '커스텀'.
    - setting: A detailed description of the situation in English.
    - userRole: The user's default role name in Korean (e.g., '손님').
    - aiRole: The AI's default role name in Korean (e.g., '점원').
    - aiTutorName: A fitting name for the AI based on their role (e.g., 'Sarah', 'Mr. Davis').
    - task: What the user should try to accomplish in English.
    - initialMessage: The first line the AI should say to start the conversation in English.
    - initialMessageReversed: The first line the AI should say if it's playing the user's role.
    - keyPhrases: An array of 3-4 useful English phrases with their Korean meanings for this scenario.
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: request,
        config: {
            responseMimeType: "application/json",
            responseSchema: scenarioSchema,
        }
    });

    const jsonStr = response.text.trim();
    const scenarioData = JSON.parse(jsonStr);

    return {
      ...scenarioData,
      userPrompt: prompt,
    };
};

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        fluency_score: { type: Type.INTEGER, description: "A score from 0-100 representing the user's fluency." },
        positive_feedback: { type: Type.STRING, description: "A one-sentence summary of what the user did well." },
        key_corrections: {
            type: Type.ARRAY,
            description: "Up to 3 most important corrections from the conversation.",
            items: {
                type: Type.OBJECT,
                properties: {
                    original: { type: Type.STRING },
                    suggestion: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                },
                required: ["original", "suggestion", "explanation"]
            }
        },
        new_vocabulary: {
            type: Type.ARRAY,
            description: "Up to 3 new vocabulary words or phrases the user could have used, with simple definitions.",
            items: {
                type: Type.OBJECT,
                properties: {
                    word: { type: Type.STRING },
                    definition: { type: Type.STRING }
                },
                required: ["word", "definition"]
            }
        },
        next_steps: { type: Type.STRING, description: "A short, actionable suggestion for what the user can practice next." }
    },
    required: ["fluency_score", "positive_feedback", "key_corrections", "new_vocabulary", "next_steps"]
};

export const generateReport = async (conversation: Message[]): Promise<LearningReport> => {
    const conversationText = conversation
        .map(m => `${m.role === Role.USER ? 'User' : 'AI'}: ${m.text}`)
        .join('\n');

    const prompt = `You are an expert English learning assessment AI. Your task is to analyze a conversation transcript between a student (User) and a role-playing AI (AI).
Based on the student's performance, generate a comprehensive learning report. Your persona is that of an objective, encouraging language coach.
The report must be in JSON format and all textual feedback must be in Korean.
Conversation:
${conversationText}
    
Provide:
1. A 'fluency_score' (0-100).
2. A single sentence of 'positive_feedback' in Korean.
3. A 'key_corrections' array with the 3 most important grammar or phrasing corrections for the user. The 'explanation' for each correction must be in Korean.
4. A 'new_vocabulary' array with 3 words/phrases the user could learn. The 'definition' for each word must be in Korean.
5. A short 'next_steps' suggestion in Korean.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: reportSchema,
        }
    });
    
    const jsonStr = response.text.trim();
    const reportData = JSON.parse(jsonStr);
    
    return {
        fluencyScore: reportData.fluency_score,
        positiveFeedback: reportData.positive_feedback,
        keyCorrections: reportData.key_corrections.map((c: any) => ({
            original: c.original,
            suggestion: c.suggestion,
            explanation: c.explanation,
        })),
        newVocabulary: reportData.new_vocabulary.map((v: any) => ({
            word: v.word,
            definition: v.definition,
        })),
        nextSteps: reportData.next_steps,
    };
};

const hintsSchema = {
    type: Type.OBJECT,
    properties: {
        hints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of 3-4 short, useful English phrases the user could say next."
        }
    },
    required: ["hints"]
};

export const getContextualHints = async (conversation: Message[], scenario: Scenario): Promise<string[]> => {
    try {
        const conversationHistory = conversation
            .slice(-6) // Get last 6 messages for context
            .map(m => `${m.role === Role.USER ? 'User' : 'AI'}: ${m.text}`)
            .join('\n');

        const prompt = `You are an AI English conversation coach. You are observing a role-play between a student and another AI.
Your task is to provide helpful, contextual hints to the student based on the conversation so far. Your hints should be what a helpful coach would suggest to keep the conversation going naturally. Do not adopt the persona of the role-playing AI.

The student is in the following role-play scenario:
- Setting: ${scenario.setting}
- User's Role: ${scenario.userRole}
- AI's Role (Your Role): ${scenario.aiRole}
- User's Task: ${scenario.task}

Here is the most recent part of their conversation:
${conversationHistory}

Based on the last message from the AI, suggest 3-4 short, natural, and helpful English phrases the student could say next to continue the conversation effectively. The hints should be directly usable as a response.

Your response must be in JSON format. The JSON object should contain a single key "hints", which is an array of strings.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: hintsSchema,
            }
        });

        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);
        return result.hints || [];

    } catch (error) {
        console.error("Error getting contextual hints:", error);
        return []; // Return empty array on error to avoid crashing the UI
    }
};