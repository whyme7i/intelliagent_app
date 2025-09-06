
import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { ImageEditor } from './components/ImageEditor';
import { ImageGenerator } from './components/ImageGenerator';
import { AgentMode, CoderAgentSettings, HomeworkAgentSettings, Chat, AgentSettings, Message } from './types';
import { HOMEWORK_SUBJECTS, HOMEWORK_GRADES, CODER_LANGUAGES } from './constants';
import { Bars3Icon } from './components/icons/Bars3Icon';
import { ConnectionsModal } from './components/ConnectionsModal';
import { WelcomeScreen } from './components/WelcomeScreen';

const App: React.FC = () => {
  const [isAppLoading, setIsAppLoading] = useState<boolean>(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isConversationMode, setIsConversationMode] = useState<boolean>(false);
  const [isConnectionsModalOpen, setIsConnectionsModalOpen] = useState<boolean>(false);
  
  const [chatHistory, setChatHistory] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  useEffect(() => {
    // Longer timeout for the welcome animation
    setTimeout(() => {
      try {
        const savedHistory = localStorage.getItem('chatHistory');
        if (savedHistory) {
          const parsedHistory = JSON.parse(savedHistory);
          setChatHistory(parsedHistory);
          if (parsedHistory.length > 0) {
            setCurrentChatId(parsedHistory[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to load chat history from localStorage", error);
      } finally {
        setIsAppLoading(false);
      }
    }, 4000); // Increased duration for welcome animation
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    } catch (error) {
      console.error("Failed to save chat history to localStorage", error);
    }
  }, [chatHistory]);
  
  const currentChat = chatHistory.find(chat => chat.id === currentChatId);
  const agentMode = currentChat?.agentMode ?? AgentMode.HOMEWORK;

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
  }, [theme]);
  
  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);
  
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const handleSettingsChange = useCallback((key: keyof HomeworkAgentSettings | keyof CoderAgentSettings, value: string) => {
    if (currentChat) {
      let updatedSettings: AgentSettings;

      if (currentChat.agentMode === AgentMode.HOMEWORK && (key === 'subject' || key === 'grade')) {
          updatedSettings = { ...(currentChat.settings as HomeworkAgentSettings), [key]: value };
      } else if (currentChat.agentMode === AgentMode.CODER && key === 'language') {
          updatedSettings = { ...(currentChat.settings as CoderAgentSettings), [key]: value };
      } else {
          console.error("Mismatched agent mode and setting key.");
          return;
      }

      const updatedHistory = chatHistory.map(chat =>
        chat.id === currentChatId ? { ...chat, settings: updatedSettings } : chat
      );
      setChatHistory(updatedHistory);
    }
  }, [chatHistory, currentChat, currentChatId]);

  const handleAgentChange = useCallback((mode: AgentMode) => {
    const newChatId = `chat_${Date.now()}`;
    let newChat: Chat;

    switch(mode) {
        case AgentMode.HOMEWORK:
            newChat = { id: newChatId, title: 'New Homework Chat', timestamp: Date.now(), agentMode: mode, messages: [], settings: { subject: HOMEWORK_SUBJECTS[0], grade: HOMEWORK_GRADES[0] }};
            break;
        case AgentMode.CODER:
            newChat = { id: newChatId, title: 'New Coder Chat', timestamp: Date.now(), agentMode: mode, messages: [], settings: { language: CODER_LANGUAGES[0] }};
            break;
        case AgentMode.MONEY:
            newChat = { id: newChatId, title: 'New Alpha Investor Chat', timestamp: Date.now(), agentMode: mode, messages: [], settings: {}, onboardingState: 'pending' };
            break;
        case AgentMode.IMAGE_GENERATION:
            newChat = { id: newChatId, title: 'New Image Generation', timestamp: Date.now(), agentMode: mode, messages: [], settings: {} };
            break;
        case AgentMode.IMAGE_EDITOR:
             newChat = { id: newChatId, title: 'New Image Edit', timestamp: Date.now(), agentMode: mode, messages: [], settings: {} };
            break;
        case AgentMode.TASK_AGENT:
             newChat = { id: newChatId, title: 'New Task', timestamp: Date.now(), agentMode: mode, messages: [], settings: {} };
            break;
        default:
             newChat = { id: newChatId, title: 'New Chat', timestamp: Date.now(), agentMode: mode, messages: [], settings: {} };
    }
    
    setChatHistory(prev => [newChat, ...prev]);
    setCurrentChatId(newChatId);
  }, []);

  const handleNewChat = useCallback(() => {
    handleAgentChange(agentMode);
  }, [agentMode, handleAgentChange]);
  
  const handleSelectChat = useCallback((id: string) => {
    setCurrentChatId(id);
  }, []);

  const handleDeleteChat = useCallback((id: string) => {
    const newHistory = chatHistory.filter(chat => chat.id !== id);
    setChatHistory(newHistory);
    if (currentChatId === id) {
      setCurrentChatId(newHistory.length > 0 ? newHistory[0].id : null);
    }
  }, [chatHistory, currentChatId]);

  const handleRenameChat = useCallback((id: string, newTitle: string) => {
    const newHistory = chatHistory.map(chat =>
        chat.id === id ? { ...chat, title: newTitle } : chat
    );
    setChatHistory(newHistory);
  }, [chatHistory]);

  const handleExportChat = useCallback((id: string) => {
    const chat = chatHistory.find(c => c.id === id);
    if (!chat) return;
    
    const markdownContent = chat.messages.map(msg => `**${msg.role.toUpperCase()}**: ${msg.text}`).join('\n\n---\n\n');
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${chat.title.replace(/\s/g, '_')}.md`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [chatHistory]);

  const handleUpdateMessages = useCallback((messages: Message[], onboardingState?: 'complete') => {
     if (currentChat) {
      const updatedChat: Chat = { ...currentChat, messages };
      
      if(onboardingState) {
        updatedChat.onboardingState = onboardingState;
      }

      if (currentChat.messages.length === 0 && messages.length > 0 && currentChat.onboardingState !== 'pending') {
        const firstUserMessage = messages.find(m => m.role === 'user');
        if (firstUserMessage) {
          updatedChat.title = firstUserMessage.text.substring(0, 40) + (firstUserMessage.text.length > 40 ? '...' : '');
        }
      }

      const newHistory = chatHistory.map(chat => 
        chat.id === currentChatId ? updatedChat : chat
      );
      setChatHistory(newHistory);
    }
  }, [chatHistory, currentChat, currentChatId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const metaKey = isMac ? event.metaKey : event.ctrlKey;

      if (metaKey && event.key === 'b') {
        event.preventDefault();
        toggleSidebar();
      }
      if (metaKey && event.key === 'n') {
        event.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleSidebar, handleNewChat]);


  const renderMainContent = () => {
    if (!currentChat) {
       return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Welcome to IntelliAgent</h1>
            <p className="text-gray-500">Start a new chat from the sidebar to begin.</p>
          </div>
        </div>
      );
    }
    
    switch(currentChat.agentMode) {
      case AgentMode.IMAGE_GENERATION:
        return <ImageGenerator key={currentChat.id} />;
      case AgentMode.IMAGE_EDITOR:
        return <ImageEditor key={currentChat.id} />;
      default:
        return (
          <ChatInterface 
            key={currentChat.id} 
            chat={currentChat}
            onMessagesUpdate={handleUpdateMessages}
            isConversationMode={isConversationMode}
            onToggleConversationMode={() => setIsConversationMode(p => !p)}
          />
        );
    }
  }

  return (
    <>
      {isAppLoading && <WelcomeScreen />}
      <ConnectionsModal isOpen={isConnectionsModalOpen} onClose={() => setIsConnectionsModalOpen(false)} />
      <div className={`relative h-screen font-sans flex transition-opacity duration-300 ${isAppLoading ? 'opacity-0' : 'opacity-100'}`}>
        <Sidebar
          agentMode={agentMode}
          currentChat={currentChat}
          onAgentChange={handleAgentChange}
          onSettingsChange={handleSettingsChange}
          theme={theme}
          onToggleTheme={toggleTheme}
          isSidebarOpen={isSidebarOpen}
          onClose={toggleSidebar}
          onNewChat={handleNewChat}
          chatHistory={chatHistory}
          currentChatId={currentChatId}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          onRenameChat={handleRenameChat}
          onExportChat={handleExportChat}
          onOpenConnections={() => setIsConnectionsModalOpen(true)}
        />
        <main className="flex-1 flex flex-col h-screen transition-all duration-300 ease-in-out">
          {!isSidebarOpen && (
              <button
                  onClick={toggleSidebar}
                  className="absolute top-4 left-4 z-30 p-2 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                  aria-label="Open sidebar"
              >
                  <Bars3Icon className="w-6 h-6" />
              </button>
          )}
          {renderMainContent()}
        </main>
      </div>
    </>
  );
};

export default App;
