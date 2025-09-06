
import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './icons/XMarkIcon';
import { GoogleDriveIcon } from './icons/GoogleDriveIcon';
import { GitHubIcon } from './icons/GitHubIcon';
import { SlackIcon } from './icons/SlackIcon';
import { FacebookIcon } from './icons/FacebookIcon';
import { GoogleCalendarIcon } from './icons/GoogleCalendarIcon';
import { NotionIcon } from './icons/NotionIcon';
import { TrelloIcon } from './icons/TrelloIcon';
import { DiscordIcon } from './icons/DiscordIcon';
import { SpotifyIcon } from './icons/SpotifyIcon';
import { DropboxIcon } from './icons/DropboxIcon';
import { SalesforceIcon } from './icons/SalesforceIcon';
import { ZendeskIcon } from './icons/ZendeskIcon';
import { OutlookIcon } from './icons/OutlookIcon';


interface ConnectionItemProps {
  icon: React.ReactNode;
  name: string;
  description: string;
  isConnected: boolean;
  onToggle: () => void;
}

const ConnectionItem: React.FC<ConnectionItemProps> = ({ icon, name, description, isConnected, onToggle }) => (
    <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">{icon}</div>
        <div className="flex-grow">
            <h3 className="font-semibold">{name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        <button 
            onClick={onToggle}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors w-24 ${
                isConnected 
                ? 'bg-green-600 text-white hover:bg-red-500' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
        >
            {isConnected ? 'Disconnect' : 'Connect'}
        </button>
    </div>
);


export const ConnectionsModal: React.FC<{isOpen: boolean, onClose: () => void}> = ({ isOpen, onClose }) => {
    const [connected, setConnected] = useState<Record<string, boolean>>(() => {
        try {
            const item = window.localStorage.getItem('connections');
            return item ? JSON.parse(item) : {};
        } catch (error) {
            console.error("Failed to parse connections from localStorage", error);
            return {};
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem('connections', JSON.stringify(connected));
        } catch (error) {
            console.error("Failed to save connections to localStorage", error);
        }
    }, [connected]);

    const handleToggleConnection = (name: string) => {
        setConnected(prev => ({...prev, [name]: !prev[name]}));
    };

    if (!isOpen) return null;

    const connectionsList = [
        { icon: <GoogleDriveIcon />, name: "Google Drive", description: "Read and summarize your documents." },
        { icon: <GitHubIcon />, name: "GitHub", description: "Read repositories and create pull requests." },
        { icon: <SlackIcon />, name: "Slack", description: "Send messages and notifications to your team." },
        { icon: <FacebookIcon />, name: "Facebook", description: "Access profile information and post updates." },
        { icon: <GoogleCalendarIcon />, name: "Google Calendar", description: "Read events and schedule new ones." },
        { icon: <NotionIcon />, name: "Notion", description: "Access pages and databases." },
        { icon: <TrelloIcon />, name: "Trello", description: "Manage boards, lists, and cards." },
        { icon: <DiscordIcon />, name: "Discord", description: "Send messages to channels and users." },
        { icon: <SpotifyIcon />, name: "Spotify", description: "Control playback and manage playlists." },
        { icon: <DropboxIcon />, name: "Dropbox", description: "Access and manage files." },
        { icon: <SalesforceIcon />, name: "Salesforce", description: "Access customer data and records." },
        { icon: <ZendeskIcon />, name: "Zendesk", description: "Manage support tickets and users." },
        { icon: <OutlookIcon />, name: "Microsoft Outlook", description: "Read and send emails, manage calendar." },
    ];

    return (
        <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-70 z-50 flex items-center justify-center animate-fade-in-up"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-bold">Connections</h2>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                     <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Connect your accounts to allow IntelliAgent to access information and perform tasks for you.</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {connectionsList.map((item) => (
                            <ConnectionItem 
                                key={item.name}
                                icon={item.icon}
                                name={item.name}
                                description={item.description}
                                isConnected={!!connected[item.name]}
                                onToggle={() => handleToggleConnection(item.name)}
                            />
                        ))}
                     </div>
                </div>
            </div>
        </div>
    );
};
