
import React from 'react';
import { Message, MessageRole } from '../types';
import { UserIcon } from './icons/UserIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { MarkdownRenderer } from './MarkdownRenderer';
import { VolumeUpIcon } from './icons/VolumeUpIcon';
import { StopCircleIcon } from './icons/StopCircleIcon';
import { LinkIcon } from './icons/LinkIcon';

interface ChatMessageProps {
  message: Message;
  onExplainCode?: (code: string, language: string) => void;
  onPreviewCode?: (code: string, language: string) => void;
  onPlayAudio: () => void;
  isSpeaking: boolean;
  isUserListening?: boolean;
}

const Avatar: React.FC<{ role: MessageRole; isSpeaking: boolean; isListening?: boolean }> = ({ role, isSpeaking, isListening }) => {
  const isUser = role === MessageRole.USER;
  const bgColor = isUser ? 'bg-indigo-500' : 'bg-teal-500';
  const Icon = isUser ? UserIcon : SparklesIcon;
  const animationClass = isSpeaking ? 'animate-pulse-ring' : (isListening ? 'animate-pulse' : '');

  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${bgColor} flex-shrink-0 shadow-md ${animationClass}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
  );
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onExplainCode, onPreviewCode, onPlayAudio, isSpeaking, isUserListening }) => {
  const isUser = message.role === MessageRole.USER;

  return (
    <div className={`animate-fade-in-up flex items-start gap-4 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && <Avatar role={message.role} isSpeaking={isSpeaking} />}
      <div className={`max-w-2xl w-fit flex flex-col group ${isUser ? 'items-end' : ''}`}>
        <div
          className={`px-5 py-3 rounded-2xl shadow-sm ${
            isUser
              ? 'bg-indigo-600 text-white rounded-br-none'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none'
          }`}
        >
          {message.image && (
            <div className="mb-3">
              <img
                src={`data:${message.image.mimeType};base64,${message.image.base64}`}
                alt="User upload"
                className="rounded-lg max-w-xs max-h-64 object-contain"
              />
            </div>
          )}
          <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-p:text-gray-900 dark:prose-p:text-gray-200">
             <MarkdownRenderer 
                content={message.text} 
                onExplainCode={isUser ? undefined : onExplainCode}
                onPreviewCode={isUser ? undefined : onPreviewCode}
              />
             {message.isStreaming && <span className="blinking-cursor">|</span>}
          </div>
        </div>
        {!isUser && (message.text || (message.sources && message.sources.length > 0)) && !message.isStreaming && (
            <div className="mt-1.5 flex items-center gap-4 self-start opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {message.text && (
                     <button onClick={onPlayAudio} className="flex items-center text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" aria-label={isSpeaking ? "Stop reading" : "Read aloud"}>
                        {isSpeaking ? <StopCircleIcon className="w-4 h-4 mr-1 text-red-500"/> : <VolumeUpIcon className="w-4 h-4 mr-1"/>}
                        {isSpeaking ? 'Stop' : 'Read Aloud'}
                    </button>
                )}
                 {message.sources && message.sources.length > 0 && (
                    <div className="text-xs text-gray-500 flex items-center gap-1"><LinkIcon className="w-4 h-4"/> Sources</div>
                )}
            </div>
        )}
        {message.sources && message.sources.length > 0 && (
            <div className="mt-2 w-full space-y-1.5 self-start">
                {message.sources.map((source, index) => (
                    <a href={source.uri} key={index} target="_blank" rel="noopener noreferrer" className="block text-xs p-2 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 truncate">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{index + 1}. {source.title}</span>
                        <p className="text-gray-500 dark:text-gray-400 truncate">{source.uri}</p>
                    </a>
                ))}
            </div>
        )}
      </div>
      {isUser && <Avatar role={message.role} isSpeaking={false} isListening={isUserListening} />}
    </div>
  );
};
