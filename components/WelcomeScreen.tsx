
import React, { useState, useEffect } from 'react';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { CodeBracketIcon } from './icons/CodeBracketIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { PhotoIcon } from './icons/PhotoIcon';
import { SearchIcon } from './icons/SearchIcon';
import { ChecklistIcon } from './icons/ChecklistIcon';

const features = [
    { icon: BookOpenIcon, text: 'Homework AI' },
    { icon: CodeBracketIcon, text: 'Coder Agent' },
    { icon: SearchIcon, text: 'Search Assistant' },
    { icon: ChecklistIcon, text: 'Task Agent' },
    { icon: SparklesIcon, text: 'Image Generation' },
    { icon: PhotoIcon, text: 'Image Editor' },
];

export const WelcomeScreen: React.FC = () => {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex(prevIndex => (prevIndex + 1) % features.length);
        }, 2000); // Cycle every 2 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-50 text-white overflow-hidden">
             <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
            
            <div className="text-center mb-24">
                 <div className="flex items-center justify-center space-x-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <SparklesIcon className="w-12 h-12 text-indigo-400" />
                    <h1 className="text-5xl font-bold">IntelliAgent</h1>
                 </div>
                 <p className="mt-4 text-lg text-gray-400 animate-fade-in" style={{ animationDelay: '0.3s' }}>Your Intelligent Partner</p>
            </div>

            <div className="absolute bottom-16 w-full">
                <div className="relative h-24 flex items-center justify-center">
                    {features.map((feature, i) => {
                        const isActive = i === activeIndex;
                        let offset = (i - activeIndex) * 150;
                        if (i - activeIndex > features.length / 2) {
                            offset -= features.length * 150;
                        }
                        if (i - activeIndex < -features.length / 2) {
                            offset += features.length * 150;
                        }

                        const Icon = feature.icon;

                        return (
                            <div 
                                key={i} 
                                className={`absolute transition-all duration-500 ease-in-out flex flex-col items-center gap-2`}
                                style={{ 
                                    transform: `translateX(${offset}px) scale(${isActive ? 1.1 : 0.8})`, 
                                    opacity: isActive ? 1 : 0.3,
                                    zIndex: isActive ? 10 : 1,
                                }}
                            >
                               <div className={`p-4 rounded-full transition-colors duration-300 ${isActive ? 'bg-indigo-500' : 'bg-gray-700'}`}>
                                   <Icon className="w-8 h-8" />
                               </div>
                               <span className={`font-semibold text-sm mt-1 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}>{feature.text}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
