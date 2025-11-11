
export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface ColoringPage {
  id: string;
  prompt: string;
  imageUrl: string; // Base64 encoded image string
}

export enum AppSection {
  COLORING_BOOK_GENERATOR = 'COLORING_BOOK_GENERATOR',
  CHATBOT = 'CHATBOT',
}
