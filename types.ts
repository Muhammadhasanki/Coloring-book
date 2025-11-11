
export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface ColoringPage {
  id: string;
  prompt: string;
  imageUrl?: string; // Base64 encoded image string, now optional
  error?: string; // Added for per-page error messages
  isGenerating: boolean; // Added for per-page loading state
}

export enum AppSection {
  COLORING_BOOK_GENERATOR = 'COLORING_BOOK_GENERATOR',
  CHATBOT = 'CHATBOT',
}