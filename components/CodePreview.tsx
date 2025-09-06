
import React, { useState } from 'react';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { ArrowsPointingOutIcon } from './icons/ArrowsPointingOutIcon';

interface CodePreviewProps {
    code: string;
}

export const CodePreview: React.FC<CodePreviewProps> = ({ code }) => {
    const [iframeKey, setIframeKey] = useState(0);

    const handleRefresh = () => {
        setIframeKey(prev => prev + 1);
    };

    const handlePopOut = () => {
        const newWindow = window.open();
        if (newWindow) {
            newWindow.document.write(code);
            newWindow.document.close();
        }
    };

    return (
        <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-md">
            <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-t-lg border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Live Preview</h3>
                <div className="flex items-center gap-2">
                    <button onClick={handleRefresh} className="p-1 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" aria-label="Refresh preview">
                        <ArrowPathIcon className="w-4 h-4" />
                    </button>
                    <button onClick={handlePopOut} className="p-1 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" aria-label="Open in new tab">
                        <ArrowsPointingOutIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <iframe
                key={iframeKey}
                srcDoc={code}
                title="Live Code Preview"
                sandbox="allow-scripts allow-same-origin"
                className="w-full h-96 bg-white"
            />
        </div>
    );
};
