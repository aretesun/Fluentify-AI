// Fix: Added full content for types.ts
export enum Role {
  USER = 'user',
  AI = 'ai',
}

export interface Suggestion {
  suggestion: string;
  explanation: string;
}

export interface Correction {
  original: string;
  suggestions: Suggestion[];
  toneFeedback?: string;
  formalityFeedback?: string;
  culturalNote?: string;
  idiomSuggestion?: { phrase: string; meaning: string; };
  isTranslationSuggestion?: boolean;
}

export interface Message {
  id: number;
  role: Role;
  text: string;
  correction?: Correction | null;
}

export interface KeyPhrase {
  phrase: string;
  meaning: string;
}

export interface Scenario {
  id: string;
  title: string;
  emoji: string;
  description: string;
  difficulty: '쉬움' | '중간' | '어려움';
  category: '일상' | '여행' | '비즈니스' | '듣기' | '커스텀';
  imageUrl: string;
  chatBackgroundImageUrl?: string;
  setting: string;
  userRole: string;
  aiRole: string;
  aiTutorName: string;
  task: string;
  keyPhrases: KeyPhrase[];
  initialMessage: string;
  initialMessageReversed: string;
  scenarioType: 'conversation' | 'listening';
  userPrompt?: string; // for custom scenarios
}

export interface LearningReport {
  fluencyScore: number;
  positiveFeedback: string;
  keyCorrections: {
    original: string;
    suggestion: string;
    explanation: string;
  }[];
  newVocabulary: {
    word: string;
    definition: string;
  }[];
  nextSteps: string;
}

export enum ListeningState {
  READY_TO_LISTEN,
  LISTENING,
  WAITING_FOR_ANSWER,
  EVALUATING,
  FINISHED,
}

export interface SentenceBuildingBlock {
  part: string; // e.g., 'subject', 'verb', 'object'
  question: string; // The question to ask the user in Korean
  example: string; // An example in English, e.g., "I", "a coffee"
}

export interface SentenceBuildingPlan {
  blocks: SentenceBuildingBlock[];
  finalSentenceStructure: string; // e.g., "{subject} {verb} {object}"
  alternativeSentences: string[];
}

export interface SentencePartValidation {
  isValid: boolean;
  suggestion: string;
  feedback: string;
}