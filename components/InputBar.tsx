
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ImageFile, TextFile, AgentMode } from '../types';
import { PaperClipIcon } from './icons/PaperClipIcon';
import { SendIcon } from './icons/SendIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { Spinner } from './Spinner';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
  }

  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: (() => void) | null;
    onend: (() => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    start(): void;
    stop(): void;
  }

  var SpeechRecognition: {
    prototype: SpeechRecognition;
    new (): SpeechRecognition;
  };
}

interface InputBarProps {
  onSubmit: (prompt: string, file?: ImageFile | TextFile) => void;
  isLoading: boolean;
  agentMode: AgentMode;
  isConversationMode: boolean;
  onListeningChange: (isListening: boolean) => void;
}

const fileToImageFile = (file: File): Promise<ImageFile> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = (error) => reject(error);
  });

const fileToTextFile = (file: File): Promise<TextFile> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = () => {
      resolve({ content: reader.result as string, name: file.name });
    };
    reader.onerror = (error) => reject(error);
  });


export const InputBar: React.FC<InputBarProps> = ({ onSubmit, isLoading, agentMode, isConversationMode, onListeningChange }) => {
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');

  const isImageOnly = agentMode === AgentMode.IMAGE_EDITOR || agentMode === AgentMode.IMAGE_GENERATION;
  const acceptedFiles = agentMode === AgentMode.DOCUMENT_ANALYST ? ".txt,.md,.py,.js,.ts,.html,.css,.json" : "image/*,.txt,.md";
  
  const handleSubmit = useCallback(async (e?: React.FormEvent, spokenPrompt?: string) => {
    if (e) e.preventDefault();
    const currentPrompt = spokenPrompt || prompt;
    if (!currentPrompt.trim() || isLoading) return;

    let uploadedFile: (ImageFile | TextFile) | undefined;
    if (file) {
      if(file.type.startsWith('image/')) {
        uploadedFile = await fileToImageFile(file);
      } else {
        uploadedFile = await fileToTextFile(file);
      }
    }
    onSubmit(currentPrompt, uploadedFile);
    setPrompt('');
    finalTranscriptRef.current = '';
    removeFile();
  }, [prompt, file, isLoading, onSubmit]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        onListeningChange(true);
      };
      recognition.onend = () => {
        setIsListening(false);
        onListeningChange(false);
        if (isConversationMode && finalTranscriptRef.current.trim()) {
            handleSubmit(undefined, finalTranscriptRef.current);
        }
      };
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        onListeningChange(false);
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        finalTranscriptRef.current = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscriptRef.current += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        setPrompt(finalTranscriptRef.current + interimTranscript);
      };
      
      recognitionRef.current = recognition;
    }

    return () => {
      recognitionRef.current?.stop();
    };
  }, [isConversationMode, handleSubmit, onListeningChange]);
  
  const handleToggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setPrompt('');
      finalTranscriptRef.current = '';
      recognitionRef.current?.start();
    }
  };


  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 192)}px`; // max-h-48
    }
  }, [prompt]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        setFile(selectedFile);
        if (selectedFile.type.startsWith('image/')) {
            const previewUrl = URL.createObjectURL(selectedFile);
            setFilePreview(previewUrl);
        }
    }
  };

  const removeFile = () => {
    setFile(null);
    if(filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto">
      {file && (
        <div className="relative inline-block mb-2 group">
           {filePreview ? (
             <img src={filePreview} alt="Preview" className="h-20 w-auto object-cover rounded-md" />
           ) : (
             <div className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 p-2 rounded-lg text-sm">
                <DocumentTextIcon className="w-6 h-6 text-gray-600 dark:text-gray-300 flex-shrink-0"/>
                <span className="truncate max-w-xs">{file.name}</span>
             </div>
           )}
          <button
            type="button"
            onClick={removeFile}
            className="absolute -top-2 -right-2 bg-gray-700 dark:bg-gray-800 rounded-full p-0.5 text-gray-300 dark:text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Remove file"
          >
            <XCircleIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="flex items-end bg-gray-100 dark:bg-gray-800 rounded-xl p-2 border border-gray-300 dark:border-gray-700 focus-within:ring-2 focus-within:ring-indigo-500">
        {!isImageOnly && (
        <>
            <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 rounded-full transition-colors"
            aria-label="Attach file"
            >
            <PaperClipIcon className="w-6 h-6" />
            </button>
            <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept={acceptedFiles}
            />
        </>
        )}
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          className="flex-1 bg-transparent resize-none outline-none text-gray-800 dark:text-gray-200 placeholder-gray-500 px-3 max-h-48"
          rows={1}
          disabled={isLoading}
        />
        {recognitionRef.current && (
             <button
                type="button"
                onClick={handleToggleListening}
                className={`p-2 rounded-full transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400'}`}
                aria-label={isListening ? 'Stop listening' : 'Start listening'}
             >
                <MicrophoneIcon className="w-6 h-6" />
            </button>
        )}
        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {isLoading ? (
            <Spinner />
          ) : (
            <SendIcon className="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 group-disabled:group-hover:text-gray-400" />
          )}
        </button>
      </div>
    </form>
  );
};
