
import React, { Fragment, useState, useEffect } from 'react';
import { LightBulbIcon } from './icons/LightBulbIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';

interface MarkdownRendererProps {
  content: string;
  onExplainCode?: (code: string, language: string) => void;
  onPreviewCode?: (code: string, language: string) => void;
}

// Simple inline parser for bold text
const parseInlineText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const CodeBlock: React.FC<{ code: string; language: string; onExplainCode?: (code: string, language: string) => void; onPreviewCode?: (code: string, language: string) => void; }> = ({ code, language, onExplainCode, onPreviewCode }) => {
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (onPreviewCode && language.toLowerCase() === 'html' && code) {
            onPreviewCode(code, language);
        }
    }, [code, language, onPreviewCode]);

    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => console.error('Failed to copy text: ', err));
    };

    return (
        <div className="relative group my-4">
            <div className="absolute top-0 right-0 p-1 flex items-center gap-1.5 z-10">
                {onExplainCode && code && (
                    <button
                    onClick={() => onExplainCode(code, language)}
                    className="flex items-center gap-1 text-xs bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-400 dark:hover:bg-gray-600"
                    aria-label="Explain code"
                    >
                    <LightBulbIcon className="w-3 h-3" />
                    Explain
                    </button>
                )}
                 <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-400 dark:hover:bg-gray-600"
                    aria-label="Copy code"
                    >
                    {isCopied ? <CheckIcon className="w-3 h-3 text-green-500" /> : <ClipboardIcon className="w-3 h-3" />}
                    {isCopied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <pre className="bg-gray-200 dark:bg-gray-900/70 rounded-md p-3 pt-8 text-sm overflow-x-auto text-gray-800 dark:text-gray-200">
                <code className={`language-${language}`}>{code}</code>
            </pre>
        </div>
    );
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, onExplainCode, onPreviewCode }) => {
  const blocks = content.split(/```/);

  return (
    <>
      {blocks.map((block, index) => {
        if (index % 2 === 1) {
          // This is a code block
          const [language, ...codeLines] = block.split('\n');
          const code = codeLines.join('\n').trim();
          return (
            <CodeBlock 
                key={index} 
                code={code} 
                language={language.trim()} 
                onExplainCode={onExplainCode}
                onPreviewCode={onPreviewCode} 
            />
          );
        } else {
            // This is plain text, potentially with lists
            const lines = block.trim().split('\n');
            const elements = [];
            let listItems: string[] = [];

            const flushList = () => {
                if (listItems.length > 0) {
                    elements.push(
                        <ul key={`ul-${elements.length}`} className="list-disc list-inside my-2 space-y-1">
                            {listItems.map((item, i) => (
                                <li key={i}>{parseInlineText(item)}</li>
                            ))}
                        </ul>
                    );
                    listItems = [];
                }
            };

            for (const line of lines) {
                if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
                    listItems.push(line.trim().substring(2));
                } else {
                    flushList();
                    if (line.trim()) { // Avoid creating empty <p> tags
                      elements.push(
                        <p key={`p-${elements.length}`} className="my-1">
                            {parseInlineText(line)}
                        </p>
                      );
                    }
                }
            }
            flushList(); // Flush any remaining list items

            return <Fragment key={index}>{elements}</Fragment>;
        }
      })}
    </>
  );
};
