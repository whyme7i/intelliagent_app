
import React, { useState, useEffect } from 'react';
import { AgentMode, HomeworkAgentSettings, CoderAgentSettings, Chat } from '../types';
import { HOMEWORK_SUBJECTS, HOMEWORK_GRADES, CODER_LANGUAGES } from '../constants';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { CodeBracketIcon } from './icons/CodeBracketIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { PhotoIcon } from './icons/PhotoIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { PlusIcon } from './icons/PlusIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { ChatBubbleLeftRightIcon } from './icons/ChatBubbleLeftRightIcon';
import { TrashIcon } from './icons/TrashIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { DollarSignIcon } from './icons/DollarSignIcon';
import { SearchIcon } from './icons/SearchIcon';
import { LinkIcon } from './icons/LinkIcon';
import { PencilIcon } from './icons/PencilIcon';
import { CheckIcon } from './icons/CheckIcon';
import { ArrowDownTrayIcon } from './icons/ArrowDownTrayIcon';
import { ChecklistIcon } from './icons/ChecklistIcon';

interface SidebarProps {
  agentMode: AgentMode;
  currentChat: Chat | undefined;
  onAgentChange: (mode: AgentMode) => void;
  onSettingsChange: (key: keyof HomeworkAgentSettings | keyof CoderAgentSettings, value: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isSidebarOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  chatHistory: Chat[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onExportChat: (id: string) => void;
  onOpenConnections: () => void;
}

interface SelectProps<T> {
  label: string;
  value: T;
  options: T[];
  onChange: (value: T) => void;
}

const Select = <T extends string,>({ label, value, options, onChange }: SelectProps<T>) => (
  <div className="w-full">
    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      {options.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  </div>
);

const AgentButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
      isActive ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
    }`}
  >
    {icon}
    <span className="ml-3">{label}</span>
  </button>
);

const ChatHistoryItem: React.FC<{
    chat: Chat;
    isCurrent: boolean;
    onSelect: () => void;
    onDelete: () => void;
    onRename: (newTitle: string) => void;
    onExport: () => void;
}> = ({ chat, isCurrent, onSelect, onDelete, onRename, onExport }) => {
    const [isRenaming, setIsRenaming] = useState(false);
    const [title, setTitle] = useState(chat.title);
    const inputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isRenaming) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isRenaming]);

    const handleRenameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (title.trim()) {
            onRename(title.trim());
        }
        setIsRenaming(false);
    };

    return (
        <div className="group flex items-center pr-2" onClick={onSelect}>
             {isRenaming ? (
                <form onSubmit={handleRenameSubmit} className="flex-grow">
                    <input
                        ref={inputRef}
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleRenameSubmit}
                        className="w-full text-sm px-3 py-2 rounded-md bg-indigo-200 dark:bg-indigo-800 border-indigo-400 border"
                        onClick={(e) => e.stopPropagation()}
                    />
                </form>
            ) : (
                <button className={`w-full text-left text-sm px-3 py-2 rounded-md truncate ${isCurrent ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold' : 'hover:bg-gray-200 dark:hover:bg-gray-700/50'}`}>
                    {chat.title}
                </button>
            )}

            <div className={`flex items-center flex-shrink-0 transition-opacity duration-200 ${isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                 {isRenaming ? (
                     <button onClick={handleRenameSubmit} className="p-1 text-gray-400 hover:text-green-500"><CheckIcon className="w-4 h-4" /></button>
                 ) : (
                     <button onClick={(e) => { e.stopPropagation(); setIsRenaming(true); }} className="p-1 text-gray-400 hover:text-indigo-500"><PencilIcon className="w-4 h-4" /></button>
                 )}
                <button onClick={(e) => { e.stopPropagation(); onExport(); }} className="p-1 text-gray-400 hover:text-blue-500"><ArrowDownTrayIcon className="w-4 h-4" /></button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
            </div>
        </div>
    );
};


export const Sidebar: React.FC<SidebarProps> = ({
  agentMode,
  currentChat,
  onAgentChange,
  onSettingsChange,
  theme,
  onToggleTheme,
  isSidebarOpen,
  onClose,
  onNewChat,
  chatHistory,
  currentChatId,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  onExportChat,
  onOpenConnections
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const isCreativeMode = agentMode === AgentMode.IMAGE_EDITOR || agentMode === AgentMode.IMAGE_GENERATION;
  
  const filteredHistory = chatHistory.filter(chat => 
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <aside className={`fixed top-0 left-0 h-full w-72 bg-gray-50 dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out z-40 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div className="flex items-center space-x-2">
                <SparklesIcon className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">IntelliAgent</h1>
            </div>
            <button onClick={onClose} className="p-1 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
                <XMarkIcon className="w-6 h-6" />
            </button>
        </div>
        
        <button onClick={onNewChat} className="flex items-center justify-center w-full gap-2 px-4 py-2 mb-4 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0">
            <PlusIcon className="w-5 h-5"/>
            New Chat
        </button>

        {/* History */}
        <div className="flex-grow overflow-y-auto mb-4 border-t border-b border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-2 sticky top-0 bg-gray-50 dark:bg-gray-800/50">
                <div className="relative">
                    <SearchIcon className="w-4 h-4 absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"/>
                    <input 
                        type="text"
                        placeholder="Search history..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-200 dark:bg-gray-700/50 border-transparent rounded-md pl-9 pr-3 py-1.5 text-sm"
                    />
                </div>
            </div>
            <div className="space-y-1 p-1 flex-grow">
                {filteredHistory.map(chat => (
                    <ChatHistoryItem
                        key={chat.id}
                        chat={chat}
                        isCurrent={currentChatId === chat.id}
                        onSelect={() => onSelectChat(chat.id)}
                        onDelete={() => onDeleteChat(chat.id)}
                        onRename={(newTitle) => onRenameChat(chat.id, newTitle)}
                        onExport={() => onExportChat(chat.id)}
                    />
                ))}
            </div>
        </div>


        <div className="flex-shrink-0 space-y-4">
            <div>
                <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider px-2 mb-2">Agents</h2>
                <div className="space-y-2">
                    <AgentButton label="Homework AI" icon={<BookOpenIcon className="w-5 h-5" />} isActive={agentMode === AgentMode.HOMEWORK} onClick={() => onAgentChange(AgentMode.HOMEWORK)} />
                    <AgentButton label="Coder Agent" icon={<CodeBracketIcon className="w-5 h-5" />} isActive={agentMode === AgentMode.CODER} onClick={() => onAgentChange(AgentMode.CODER)} />
                    <AgentButton label="Document Analyst" icon={<DocumentTextIcon className="w-5 h-5" />} isActive={agentMode === AgentMode.DOCUMENT_ANALYST} onClick={() => onAgentChange(AgentMode.DOCUMENT_ANALYST)} />
                    <AgentButton label="Search Assistant" icon={<SearchIcon className="w-5 h-5" />} isActive={agentMode === AgentMode.SEARCH_ASSISTANT} onClick={() => onAgentChange(AgentMode.SEARCH_ASSISTANT)} />
                    <AgentButton label="Alpha Investor" icon={<DollarSignIcon className="w-5 h-5" />} isActive={agentMode === AgentMode.MONEY} onClick={() => onAgentChange(AgentMode.MONEY)} />
                    <AgentButton label="Task Agent" icon={<ChecklistIcon className="w-5 h-5" />} isActive={agentMode === AgentMode.TASK_AGENT} onClick={() => onAgentChange(AgentMode.TASK_AGENT)} />
                </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider px-2 mb-2">Creative Studio</h2>
                <div className="space-y-2">
                    <AgentButton label="Image Generation" icon={<SparklesIcon className="w-5 h-5" />} isActive={agentMode === AgentMode.IMAGE_GENERATION} onClick={() => onAgentChange(AgentMode.IMAGE_GENERATION)} />
                    <AgentButton label="Image Editor" icon={<PhotoIcon className="w-5 h-5" />} isActive={agentMode === AgentMode.IMAGE_EDITOR} onClick={() => onAgentChange(AgentMode.IMAGE_EDITOR)} />
                </div>
            </div>

            {currentChat && agentMode !== AgentMode.DOCUMENT_ANALYST && !isCreativeMode && agentMode !== AgentMode.MONEY && agentMode !== AgentMode.SEARCH_ASSISTANT && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="space-y-4 px-2">
                        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider">Configuration</h2>
                        {agentMode === AgentMode.HOMEWORK ? (
                            <>
                            <Select label="Subject" value={(currentChat.settings as HomeworkAgentSettings).subject} options={HOMEWORK_SUBJECTS} onChange={(value) => onSettingsChange('subject', value)} />
                            <Select label="Grade Level" value={(currentChat.settings as HomeworkAgentSettings).grade} options={HOMEWORK_GRADES} onChange={(value) => onSettingsChange('grade', value)} />
                            </>
                        ) : agentMode === AgentMode.CODER ? (
                            <Select label="Language" value={(currentChat.settings as CoderAgentSettings).language} options={CODER_LANGUAGES} onChange={(value) => onSettingsChange('language', value)} />
                        ) : null}
                    </div>
                </div>
            )}
        </div>

        <div className="mt-auto flex-shrink-0 space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4 px-2">
            <button onClick={onOpenConnections} className="w-full flex items-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left">
                 <LinkIcon className="w-6 h-6 mr-3 text-gray-500 dark:text-gray-400" />
                <span className="font-semibold text-sm">Connections</span>
            </button>
            <button className="w-full flex items-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left">
                <UserCircleIcon className="w-6 h-6 mr-3 text-gray-500 dark:text-gray-400" />
                <span className="font-semibold text-sm">User Profile</span>
            </button>
            <button onClick={onToggleTheme} className="w-full flex items-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left">
                {theme === 'dark' ? <SunIcon className="w-6 h-6 mr-3 text-gray-500 dark:text-gray-400" /> : <MoonIcon className="w-6 h-6 mr-3 text-gray-500 dark:text-gray-400" />}
                <span className="font-semibold text-sm">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <div className="text-xs text-gray-500 text-center pt-2">Powered by Gemini</div>
        </div>
      </div>
    </aside>
  );
};
