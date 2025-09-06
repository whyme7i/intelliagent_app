
import React, { useState, useCallback, useRef } from 'react';
import { ImageFile } from '../types';
import { editImage, ImageEditResult } from '../services/geminiService';
import { PhotoIcon } from './icons/PhotoIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { Spinner } from './Spinner';
import { XCircleIcon } from './icons/XCircleIcon';

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


export const ImageEditor: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [sourceImage, setSourceImage] = useState<ImageFile | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [result, setResult] = useState<ImageEditResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResult(null);
      const imageFile = await fileToImageFile(file);
      setSourceImage(imageFile);
      setSourcePreview(URL.createObjectURL(file));
    }
  };

  const clearSourceImage = () => {
    setSourceImage(null);
    if(sourcePreview) URL.revokeObjectURL(sourcePreview);
    setSourcePreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !sourceImage || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const editResult = await editImage(prompt, sourceImage);
      setResult(editResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error(err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, sourceImage, isLoading]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold flex items-center gap-2"><PhotoIcon className="w-6 h-6" /> Image Editor</h1>
            <p className="text-sm text-gray-500">Upload an image and tell the AI how you want to edit it.</p>
        </div>

        <div className="flex-grow overflow-y-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Side */}
            <div className="flex flex-col gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h2 className="font-bold text-lg">1. Upload Image</h2>
                {sourcePreview ? (
                     <div className="relative group">
                        <img src={sourcePreview} alt="Source" className="rounded-lg w-full object-contain max-h-80" />
                        <button onClick={clearSourceImage} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <XCircleIcon className="w-6 h-6"/>
                        </button>
                    </div>
                ) : (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <PhotoIcon className="w-12 h-12 text-gray-400 mb-2"/>
                        <p className="font-semibold">Click to upload</p>
                        <p className="text-xs text-gray-500">PNG, JPG, WEBP, etc.</p>
                    </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                
                <h2 className="font-bold text-lg mt-4">2. Describe Your Edit</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <textarea
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder="e.g., 'Add a birthday hat on the cat' or 'make the background a space nebula'"
                        className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-24"
                        disabled={!sourceImage || isLoading}
                    />
                     <button
                        type="submit"
                        disabled={!prompt.trim() || !sourceImage || isLoading}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <><Spinner /> Editing...</> : <><SparklesIcon className="w-5 h-5"/> Apply Edit</>}
                    </button>
                </form>
            </div>
            
            {/* Output Side */}
             <div className="flex flex-col gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h2 className="font-bold text-lg">Result</h2>
                <div className="flex-grow flex items-center justify-center w-full h-full min-h-64 rounded-lg bg-gray-100 dark:bg-gray-900/50">
                    {isLoading && <Spinner/>}
                    {error && <div className="text-center text-red-500 p-4"><p><strong>Error:</strong></p><p>{error}</p></div>}
                    {!isLoading && !error && result?.image && (
                         <div className="w-full h-full flex flex-col gap-4">
                            <img 
                                src={`data:${result.image.mimeType};base64,${result.image.base64}`} 
                                alt="Generated result" 
                                className="rounded-lg w-full object-contain max-h-[28rem]" 
                            />
                            {result.text && <p className="text-sm italic p-3 bg-gray-200 dark:bg-gray-800 rounded-md">{result.text}</p>}
                        </div>
                    )}
                     {!isLoading && !error && !result && !sourceImage && (
                        <p className="text-sm text-gray-500">Upload an image to get started</p>
                    )}
                     {!isLoading && !error && !result && sourceImage && (
                        <p className="text-sm text-gray-500">Your edited image will appear here</p>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};
