// src/components/editor/AIAssistant.tsx

'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface AIAssistantProps {
    recordId: string;
    fieldName: string;
    context: Record<string, any>;
    onAccept: (suggestion: string) => void;
}

export function AIAssistant({ recordId, fieldName, context, onAccept }: AIAssistantProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [suggestion, setSuggestion] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const getSuggestion = async () => {
        setIsLoading(true);
        setError(null);
        setSuggestion(null);

        try {
            const response = await api.getAISuggestion(recordId, fieldName, context);
            setSuggestion(response.data.suggestion);
        } catch (err) {
            setError('فشل الحصول على اقتراح. حاول مرة أخرى.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccept = () => {
        if (suggestion) {
            onAccept(suggestion);
            setSuggestion(null);
        }
    };

    return (
        <div className="mt-2">
            {!suggestion && !isLoading && (
                <button
                    onClick={getSuggestion}
                    className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
                >
                    <SparklesIcon className="w-4 h-4" />
                    اقتراح بالذكاء الاصطناعي
                </button>
            )}

            {isLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-600"></div>
                    جاري التفكير...
                </div>
            )}

            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}

            {suggestion && (
                <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-700 mb-3">{suggestion}</p>
                    <div className="flex gap-2">
                        <button
                            onClick={handleAccept}
                            className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
                        >
                            قبول
                        </button>
                        <button
                            onClick={() => setSuggestion(null)}
                            className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                        >
                            تجاهل
                        </button>
                        <button
                            onClick={getSuggestion}
                            className="px-3 py-1.5 text-primary-600 text-sm hover:underline"
                        >
                            اقتراح آخر
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}