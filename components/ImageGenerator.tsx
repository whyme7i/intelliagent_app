
import React, { useState, useCallback } from 'react';
import { generateImages, AspectRatio } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { Spinner } from './Spinner';
import { DownloadIcon } from './icons/DownloadIcon';

const aspectRatios: { label: string, value: AspectRatio }[] = [
    { label: 'Square (1:1)', value: '1:1'},
    { label: 'Widescreen (16:9)', value: '16:9'},
    { label: 'Portrait (9:16)', value: '9:16'},
    { label: 'Landscape (4:3)', value: '4:3'},
    { label: 'Tall (3:4)', value: '3:4'},
];

export const ImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [numberOfImages, setNumberOfImages] = useState(1);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);
        setGeneratedImages([]);

        try {
            const images = await generateImages(prompt, numberOfImages, aspectRatio);
            setGeneratedImages(images);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            console.error(err);
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [prompt, numberOfImages, aspectRatio, isLoading]);

    const handleDownload = (imageUrl: string) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `${prompt.slice(0, 20).replace(/\s+/g, '_')}_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-xl font-bold flex items-center gap-2"><SparklesIcon className="w-6 h-6" /> Image Generator</h1>
                <p className="text-sm text-gray-500">Describe the image you want the AI to create.</p>
            </div>

            <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                {/* Controls */}
                <div className="w-full md:w-96 p-4 md:p-6 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        <div>
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">1. Describe your image</label>
                             <textarea
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                placeholder="e.g., 'A photorealistic image of a cat wearing a space helmet, sitting on the moon'"
                                className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-40"
                                disabled={isLoading}
                            />
                        </div>

                         <div>
                            <label htmlFor="aspectRatio" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">2. Select Aspect Ratio</label>
                            <select
                                id="aspectRatio"
                                value={aspectRatio}
                                onChange={e => setAspectRatio(e.target.value as AspectRatio)}
                                className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                disabled={isLoading}
                            >
                                {aspectRatios.map(ar => <option key={ar.value} value={ar.value}>{ar.label}</option>)}
                            </select>
                        </div>
                        
                        <button
                            type="submit"
                            disabled={!prompt.trim() || isLoading}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <><Spinner /> Generating...</> : <><SparklesIcon className="w-5 h-5"/> Generate</>}
                        </button>
                    </form>
                </div>

                {/* Results */}
                <div className="flex-grow p-4 md:p-6 overflow-y-auto">
                     <div className="w-full h-full flex items-center justify-center">
                        {isLoading && <Spinner/>}
                        {error && <div className="text-center text-red-500 p-4"><p><strong>Error:</strong></p><p>{error}</p></div>}
                        {!isLoading && !error && generatedImages.length > 0 && (
                            <div className="grid grid-cols-1 gap-4">
                                {generatedImages.map((imageSrc, index) => (
                                    <div key={index} className="relative group">
                                        <img src={imageSrc} alt={`Generated image ${index + 1}`} className="rounded-lg w-full object-contain max-h-[80vh]"/>
                                        <button onClick={() => handleDownload(imageSrc)} className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/75" aria-label="Download image">
                                            <DownloadIcon className="w-5 h-5"/>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {!isLoading && !error && generatedImages.length === 0 && (
                            <div className="text-center text-gray-500">
                                <SparklesIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600"/>
                                <p className="mt-2">Your generated images will appear here.</p>
                            </div>
                        )}
                     </div>
                </div>
            </div>
        </div>
    );
};
