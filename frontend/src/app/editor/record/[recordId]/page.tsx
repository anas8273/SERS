// src/app/editor/[recordId]/page.tsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { api } from '@/lib/api';
import { debounce } from '@/lib/utils';
import { AIAssistant } from '@/components/editor/AIAssistant';
import toast from 'react-hot-toast';

interface TemplateField {
    name: string;
    type: 'text' | 'textarea' | 'date' | 'select' | 'list';
    label_ar: string;
    label_en: string;
    options?: string[];
    required?: boolean;
}

interface RecordData {
    id: string;
    user_id: string;
    product_id: string;
    template_structure: {
        fields: TemplateField[];
    };
    user_data: Record<string, any>;
    status: string;
}

export default function EditorPage() {
    const params = useParams();
    const recordId = params.recordId as string;

    const [record, setRecord] = useState<RecordData | null>(null);
    const [userData, setUserData] = useState<Record<string, any>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [activeField, setActiveField] = useState<string | null>(null);

    // الاستماع للتغييرات في الوقت الفعلي من Firestore
    useEffect(() => {
        const unsubscribe = onSnapshot(
            doc(db, 'user_records', recordId),
            (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data() as RecordData;
                    setRecord(data);
                    setUserData(data.user_data || {});
                }
            },
            (error) => {
                console.error('Error listening to record:', error);
                toast.error('حدث خطأ في تحميل السجل');
            }
        );

        return () => unsubscribe();
    }, [recordId]);

    // حفظ التغييرات مع debounce
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const saveChanges = useCallback(
        debounce((newUserData: Record<string, any>) => {
            setIsSaving(true);
            updateDoc(doc(db, 'user_records', recordId), {
                user_data: newUserData,
                updated_at: new Date(),
            })
                .catch((error: Error) => {
                    console.error('Error saving:', error);
                    toast.error('فشل حفظ التغييرات');
                })
                .finally(() => {
                    setIsSaving(false);
                });
        }, 1000),
        [recordId]
    );

    // تحديث قيمة حقل
    const handleFieldChange = (fieldName: string, value: any) => {
        const newUserData = { ...userData, [fieldName]: value };
        setUserData(newUserData);
        saveChanges(newUserData);
    };

    // قبول اقتراح الذكاء الاصطناعي
    const handleAcceptSuggestion = (fieldName: string, suggestion: string) => {
        handleFieldChange(fieldName, suggestion);
        toast.success('تم قبول الاقتراح');
    };

    if (!record) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-xl font-bold">تحرير السجل</h1>
                    <div className="flex items-center gap-4">
                        {isSaving && (
                            <span className="text-sm text-gray-500 flex items-center gap-2">
                                <span className="animate-pulse">●</span>
                                جاري الحفظ...
                            </span>
                        )}
                        <button
                            onClick={() => window.print()}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                            طباعة / تصدير
                        </button>
                    </div>
                </div>
            </header>

            {/* Editor Content */}
            <main className="max-w-5xl mx-auto px-4 py-8">
                <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
                    <div className="space-y-6">
                        {record.template_structure.fields.map((field) => (
                            <div key={field.name} className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {field.label_ar}
                                    {field.required && <span className="text-red-500 mr-1">*</span>}
                                </label>

                                {field.type === 'text' && (
                                    <input
                                        type="text"
                                        value={userData[field.name] || ''}
                                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                        onFocus={() => setActiveField(field.name)}
                                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        placeholder={`أدخل ${field.label_ar}`}
                                    />
                                )}

                                {field.type === 'textarea' && (
                                    <textarea
                                        value={userData[field.name] || ''}
                                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                        onFocus={() => setActiveField(field.name)}
                                        rows={4}
                                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        placeholder={`أدخل ${field.label_ar}`}
                                    />
                                )}

                                {field.type === 'date' && (
                                    <input
                                        type="date"
                                        value={userData[field.name] || ''}
                                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                )}

                                {field.type === 'select' && field.options && (
                                    <select
                                        value={userData[field.name] || ''}
                                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    >
                                        <option value="">اختر...</option>
                                        {field.options.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {/* مساعد الذكاء الاصطناعي */}
                                {activeField === field.name && (field.type === 'text' || field.type === 'textarea') && (
                                    <AIAssistant
                                        recordId={recordId}
                                        fieldName={field.name}
                                        context={userData}
                                        onAccept={(suggestion) => handleAcceptSuggestion(field.name, suggestion)}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}