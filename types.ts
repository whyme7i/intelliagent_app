
export enum AgentMode {
  HOMEWORK = 'homework',
  CODER = 'coder',
  DOCUMENT_ANALYST = 'document_analyst',
  IMAGE_GENERATION = 'image_generation',
  IMAGE_EDITOR = 'image_editor',
  MONEY = 'money',
  SEARCH_ASSISTANT = 'search_assistant',
  TASK_AGENT = 'task_agent',
}

export enum MessageRole {
  USER = 'user',
  AI = 'ai',
}

export interface ImageFile {
  base64: string;
  mimeType: string;
}

export interface TextFile {
    content: string;
    name: string;
}

export interface GroundingSource {
    uri: string;
    title: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  image?: ImageFile;
  isStreaming?: boolean;
  sources?: GroundingSource[];
}

export interface HomeworkAgentSettings {
  subject: string;
  grade: string;
}

export interface CoderAgentSettings {
  language: string;
}

export interface DocumentAnalystSettings {}

export interface MoneyAgentSettings {
    income?: string;
    risk?: 'Low' | 'Medium' | 'High';
    goal?: string;
}

export type AgentSettings = HomeworkAgentSettings | CoderAgentSettings | DocumentAnalystSettings | MoneyAgentSettings | {};

export type OnboardingState = 'pending' | 'complete';

export interface Chat {
  id: string;
  title: string;
  timestamp: number;
  agentMode: AgentMode;
  settings: AgentSettings;
  messages: Message[];
  onboardingState?: OnboardingState; // For money agent
}
