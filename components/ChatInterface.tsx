
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AgentMode, Message, MessageRole, ImageFile, TextFile, Chat, CoderAgentSettings, HomeworkAgentSettings, AgentSettings } from '../types';
import { ChatMessage } from './ChatMessage';
import { InputBar } from './InputBar';
import { generateResponseStream, generateGroundedResponse } from '../services/geminiService';
import { PhoneIcon } from './icons/PhoneIcon';
import { PhoneXMarkIcon } from './icons/PhoneXMarkIcon';
import { MoneyAgentOnboarding } from './MoneyAgentOnboarding';
import { CallAnimation } from './CallAnimation';
import { CodePreview } from './CodePreview';


interface ChatInterfaceProps {
  chat: Chat;
  onMessagesUpdate: (messages: Message[], onboardingState?: 'complete') => void;
  isConversationMode: boolean;
  onToggleConversationMode: () => void;
}

const WelcomeMessage: React.FC<{ agentMode: AgentMode, settings: AgentSettings }> = ({ agentMode, settings }) => {
    const getAgentInfo = () => {
        switch(agentMode) {
            case AgentMode.HOMEWORK:
                const hw = settings as HomeworkAgentSettings;
                return { icon: '🎓', title: 'Homework AI', desc: `Ready to help with ${hw.subject} for ${hw.grade}.` };
            case AgentMode.CODER:
                const coder = settings as CoderAgentSettings;
                return { icon: '💻', title: 'Coder Agent', desc: `Ready to assist with your ${coder.language} questions.` };
            case AgentMode.DOCUMENT_ANALYST:
                return { icon: '📄', title: 'Document Analyst', desc: 'Upload a text file to get started.' };
            case AgentMode.SEARCH_ASSISTANT:
                return { icon: '🌐', title: 'Search Assistant', desc: 'Ask me anything about current events or topics.' };
            case AgentMode.TASK_AGENT:
                return { icon: '📋', title: 'Task Agent', desc: 'Ready to help you break down goals and manage tasks.' };
            default:
                return { icon: '✨', title: 'IntelliAgent', desc: 'How can I help you today?' };
        }
    }
    const { icon, title, desc } = getAgentInfo();

    return (
        <div className="text-center p-8">
            <div className="inline-block bg-gray-200 dark:bg-gray-800 p-6 rounded-full mb-4">
                 <span className="text-5xl">{icon}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{desc}</p>
             <p className="text-gray-500 dark:text-gray-500 text-sm mt-4">Start by typing your question below. You can also upload an image or use your voice.</p>
        </div>
    );
}

const ChatHeader: React.FC<{ chat: Chat; isConversationMode: boolean; onToggleConversationMode: () => void; }> = ({ chat, isConversationMode, onToggleConversationMode }) => {
    const getTitle = () => {
        switch(chat.agentMode) {
            case AgentMode.HOMEWORK: return "Homework AI";
            case AgentMode.CODER: return "Coder Agent";
            case AgentMode.DOCUMENT_ANALYST: return "Document Analyst";
            case AgentMode.MONEY: return "Alpha Investor";
            case AgentMode.SEARCH_ASSISTANT: return "Search Assistant";
            case AgentMode.TASK_AGENT: return "Task Agent";
            default: return "IntelliAgent";
        }
    }

    return (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700/50 relative z-10">
            <h1 className="text-lg font-bold">{getTitle()}</h1>
            <button 
                onClick={onToggleConversationMode}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${
                    isConversationMode 
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
            >
                {isConversationMode ? (
                    <>
                        <PhoneXMarkIcon className="w-5 h-5" /> End Call
                        <span className="relative flex h-2 w-2 ml-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                        </span>
                    </>
                ) : (
                    <>
                        <PhoneIcon className="w-5 h-5" /> Start Call
                    </>
                )}
            </button>
        </div>
    );
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ chat, onMessagesUpdate, isConversationMode, onToggleConversationMode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [caption, setCaption] = useState<{ text: string; highlight: number } | null>(null);
  const [previewContent, setPreviewContent] = useState<{ messageId: string; code: string } | null>(null);
  
  const professionalVoice = useRef<SpeechSynthesisVoice | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { agentMode, settings, messages, onboardingState } = chat;

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  // Speech synthesis setup
  useEffect(() => {
    const setVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            professionalVoice.current = voices.find(v => v.lang.startsWith('en') && (v as any).quality === 'enhanced' && v.localService) 
                                     || voices.find(v => v.lang.startsWith('en') && v.localService)
                                     || voices.find(v => v.lang.startsWith('en-US')) 
                                     || voices[0];
        }
    };
    setVoice();
    window.speechSynthesis.onvoiceschanged = setVoice;
    return () => {
        window.speechSynthesis.cancel();
        window.speechSynthesis.onvoiceschanged = null;
    }
  }, []);

  // Conversation mode side effects (sound, welcome message)
  useEffect(() => {
    if (isConversationMode) {
      // Play connection sound
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioCtx = audioContextRef.current;
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);

      // Speak welcome message
      const welcomeText = "Hello, I'm IntelliAgent. What would you like to talk about? You can also upload a file for us to discuss.";
      handlePlayAudio(welcomeText, 'welcome_message');

    } else {
      window.speechSynthesis.cancel();
      setCurrentlySpeakingId(null);
      setCaption(null);
    }
  }, [isConversationMode]);


  const handlePlayAudio = useCallback((text: string, id: string) => {
    if (currentlySpeakingId === id) {
        window.speechSynthesis.cancel();
        setCurrentlySpeakingId(null);
        setCaption(null);
        return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (professionalVoice.current) {
        utterance.voice = professionalVoice.current;
    }

    utterance.onstart = () => {
      setCaption({ text: text, highlight: 0 });
    };

    utterance.onboundary = (event) => {
      if (event.name === 'sentence') {
        setCaption({ text: text, highlight: event.charIndex });
      }
    };
    
    utterance.onend = () => {
      setCurrentlySpeakingId(null);
      setCaption(null);
    };

    utterance.onerror = (e) => {
        console.error("Speech synthesis error:", e.error);
        setCurrentlySpeakingId(null);
        setCaption(null);
    }
    window.speechSynthesis.speak(utterance);
    setCurrentlySpeakingId(id);
  }, [currentlySpeakingId]);

  const getAiResponse = useCallback(async (prompt: string, image?: ImageFile) => {
    setIsLoading(true);
    setError(null);

    const aiMessageId = `ai_${Date.now()}`;
    let updatedMessages = [...messages];
    
    if (agentMode === AgentMode.SEARCH_ASSISTANT) {
        const loadingMessage: Message = { id: aiMessageId, role: MessageRole.AI, text: 'Searching the web...', isStreaming: true };
        onMessagesUpdate([...updatedMessages, loadingMessage]);
        try {
            const result = await generateGroundedResponse(prompt);
            const finalMessage: Message = { id: aiMessageId, role: MessageRole.AI, text: result.text, sources: result.sources };
            onMessagesUpdate([...updatedMessages, finalMessage]);
            if (isConversationMode) handlePlayAudio(result.text, aiMessageId);
        } catch(err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
            onMessagesUpdate(updatedMessages); 
        } finally {
            setIsLoading(false);
        }
        return;
    }
    
    const initialAiMessage: Message = { id: aiMessageId, role: MessageRole.AI, text: '', isStreaming: true };
    onMessagesUpdate([...updatedMessages, initialAiMessage]);
    updatedMessages.push(initialAiMessage);
    
    let fullResponse = '';
    try {
      const stream = generateResponseStream(prompt, agentMode, settings, image);

      for await (const chunk of stream) {
        fullResponse += chunk;
        const streamingMessages = updatedMessages.map(msg =>
            msg.id === aiMessageId ? { ...msg, text: fullResponse, isStreaming: true } : msg
        );
        onMessagesUpdate(streamingMessages);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      onMessagesUpdate(messages); 
    } finally {
      const finalMessages = updatedMessages.map(msg =>
        msg.id === aiMessageId ? { ...msg, text: fullResponse, isStreaming: false } : msg
      );
      onMessagesUpdate(finalMessages);
      setIsLoading(false);
      if (isConversationMode && fullResponse) {
          handlePlayAudio(fullResponse, aiMessageId);
      }
    }
  }, [agentMode, settings, isConversationMode, handlePlayAudio, messages, onMessagesUpdate]);


  const handleSubmit = useCallback(async (prompt: string, file?: ImageFile | TextFile) => {
    if ((!prompt || !prompt.trim()) && !file || isLoading) return;
    if (isConversationMode) window.speechSynthesis.cancel();
    setPreviewContent(null);


    let fullPrompt = prompt;
    let image: ImageFile | undefined;
    
    if (file) {
      if ('base64' in file) { image = file; } 
      else { fullPrompt = `Based on the following document content, please answer the user's question.\n\nDOCUMENT: "${file.name}"\n---\n${file.content}\n---\n\nQUESTION: ${prompt}`; }
    }
    
    const userMessage: Message = { id: `user_${Date.now()}`, role: MessageRole.USER, text: prompt, image: image };
    onMessagesUpdate([...messages, userMessage]);
    await getAiResponse(fullPrompt, image);

  }, [isLoading, getAiResponse, messages, onMessagesUpdate, isConversationMode]);

  const handleExplainCode = useCallback(async (code: string, language: string) => {
    if (isLoading) return;
    window.speechSynthesis.cancel();
    setCurrentlySpeakingId(null);
    setPreviewContent(null);

    const explainPrompt = `Please explain the following ${language} code snippet. Describe its functionality, its logic, and what each major part of the code does:\n\n\`\`\`${language}\n${code}\n\`\`\``;
    const userMessage: Message = { id: `user_${Date.now()}`, role: MessageRole.USER, text: `Explain this ${language} code snippet.` };
    onMessagesUpdate([...messages, userMessage]);
    await getAiResponse(explainPrompt);
  }, [isLoading, getAiResponse, messages, onMessagesUpdate]);
  
  const handlePreviewCode = useCallback((messageId: string, code: string, language: string) => {
    if (language.toLowerCase() === 'html') {
      setPreviewContent({ messageId, code });
    }
  }, []);

  const handleOnboardingSubmit = (onboardingData: {income: string, risk: string, goal: string}) => {
     const prompt = `My financial situation is as follows: monthly income of ${onboardingData.income}, a ${onboardingData.risk} risk tolerance, and my primary goal is ${onboardingData.goal}. Based on this, provide your initial assessment and suggest the first strategic step I should consider.`;
     const userMessage: Message = { id: `user_${Date.now()}`, role: MessageRole.USER, text: `I've completed the financial assessment.` };
     onMessagesUpdate([userMessage], 'complete');
     getAiResponse(prompt);
  };


  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 relative">
      {isConversationMode && <CallAnimation />}
      <ChatHeader chat={chat} isConversationMode={isConversationMode} onToggleConversationMode={onToggleConversationMode} />
      <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-6 relative z-10">
         {messages.length === 0 && agentMode !== AgentMode.MONEY ? <WelcomeMessage agentMode={agentMode} settings={settings} /> : null}
         {agentMode === AgentMode.MONEY && onboardingState === 'pending' ? <MoneyAgentOnboarding onSubmit={handleOnboardingSubmit} /> : null}
         {messages.map((message) => (
            <React.Fragment key={message.id}>
              <ChatMessage 
                  message={message} 
                  onExplainCode={agentMode === AgentMode.CODER ? handleExplainCode : undefined}
                  onPreviewCode={agentMode === AgentMode.CODER ? (code, lang) => handlePreviewCode(message.id, code, lang) : undefined}
                  onPlayAudio={() => handlePlayAudio(message.text, message.id)}
                  isSpeaking={currentlySpeakingId === message.id}
                  isUserListening={isListening && message.role === MessageRole.USER && message.id === messages[messages.length - 1].id}
              />
              {previewContent?.messageId === message.id && (
                  <div className="flex items-start gap-4 animate-fade-in-up">
                      <div className="w-9 h-9 flex-shrink-0"></div> {/* Spacer to align with avatar */}
                      <div className="max-w-2xl w-full">
                          <CodePreview code={previewContent.code} />
                      </div>
                  </div>
              )}
            </React.Fragment>
         ))}
        <div ref={chatEndRef} />
      </div>

       {error && (
        <div className="px-6 py-2 relative z-10">
            <div className="bg-red-500/20 text-red-400 dark:text-red-300 text-sm p-3 rounded-md">
                <strong>Error:</strong> {error}
            </div>
        </div>
      )}

      {isConversationMode && caption && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-20 pointer-events-none">
            <p className="p-4 bg-black/60 text-white text-center rounded-lg backdrop-blur-sm text-lg font-medium animate-fade-in-up">
              {caption.text}
            </p>
        </div>
      )}

      <div className="p-4 md:p-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700/50 z-10">
        <InputBar 
            onSubmit={handleSubmit} 
            isLoading={isLoading} 
            agentMode={agentMode}
            isConversationMode={isConversationMode}
            onListeningChange={setIsListening}
        />
      </div>
    </div>
  );
};
