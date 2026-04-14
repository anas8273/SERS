'use client';
import { ta } from '@/i18n/auto-translations';

import { useState, useRef, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { Upload, X, FileText, Image, Film, Link as LinkIcon, Plus, Loader2, Paperclip } from 'lucide-react';

export interface Attachment {
    id: string;
    name: string;
    type: 'image' | 'file' | 'link';
    url: string;
    size?: number;
    preview?: string;
}

interface FileUploadProps {
    attachments: Attachment[];
    onAttachmentsChange: (attachments: Attachment[]) => void;
    maxFiles?: number;
    maxSizeMB?: number;
    accept?: string;
    label?: string;
    compact?: boolean;
}

function FileUploadInner({
    attachments,
    onAttachmentsChange,
    maxFiles = 10,
    maxSizeMB = 10,
    accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx',
    label = ta('المرفقات', 'Attachments'),
    compact = false,
}: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [linkInput, setLinkInput] = useState('');
    const [showLinkInput, setShowLinkInput] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFiles = useCallback((files: FileList | File[]) => {
        const fileArray = Array.from(files);
        const remaining = maxFiles - attachments.length;
        if (remaining <= 0) {
            toast.error(ta(`الحد الأقصى ${maxFiles} ملفات`, `Maximum ${maxFiles} files`));
            return;
        }
        const toProcess = fileArray.slice(0, remaining);
        // Smart size validation
        const oversized = toProcess.filter(f => f.size > maxSizeMB * 1024 * 1024);
        if (oversized.length > 0) {
            toast.error(
                ta(`⚠️ ${oversized.length} ملف تجاوز الحد (${maxSizeMB}MB): ${oversized.map(f => f.name).join(', ')}`,
                   `⚠️ ${oversized.length} file(s) exceed the limit (${maxSizeMB}MB): ${oversized.map(f => f.name).join(', ')}`),
                { duration: 5000 }
            );
        }
        const validFiles = toProcess.filter(f => f.size <= maxSizeMB * 1024 * 1024);
        if (validFiles.length === 0) return;

        const newAttachments: Attachment[] = validFiles.map(file => {
            const isImage = file.type.startsWith('image/');
            const url = URL.createObjectURL(file);
            return {
                id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                name: file.name,
                type: isImage ? 'image' : 'file',
                url,
                size: file.size,
                preview: isImage ? url : undefined,
            };
        });
        onAttachmentsChange([...attachments, ...newAttachments]);
        const totalSize = validFiles.reduce((s, f) => s + f.size, 0);
        const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
        toast.success(ta(`✅ تم إضافة ${newAttachments.length} ملف (${sizeMB} MB)`, `✅ Added ${newAttachments.length} file(s) (${sizeMB} MB)`));
    }, [attachments, maxFiles, maxSizeMB, onAttachmentsChange]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
    }, [handleFiles]);

    const handleAddLink = () => {
        if (!linkInput.trim()) return;
        let url = linkInput.trim();
        if (!url.startsWith('http')) url = 'https://' + url;
        const newAttachment: Attachment = {
            id: Date.now().toString(),
            name: new URL(url).hostname,
            type: 'link',
            url,
        };
        onAttachmentsChange([...attachments, newAttachment]);
        setLinkInput('');
        setShowLinkInput(false);
        toast.success(ta('تم إضافة الرابط', 'Link added'));
    };

    const removeAttachment = (id: string) => {
        onAttachmentsChange(attachments.filter(a => a.id !== id));
    };

    const formatSize = (bytes?: number) => {
        if (!bytes) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getFileIcon = (type: string) => {
        if (type === 'image') return <Image className="h-4 w-4 text-green-500" />;
        if (type === 'link') return <LinkIcon className="h-4 w-4 text-blue-500" />;
        return <FileText className="h-4 w-4 text-amber-500" />;
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{label}</Label>
                <span className="text-xs text-muted-foreground">{attachments.length}/{maxFiles}</span>
            </div>

            {/* Drop Zone */}
            <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-${compact ? '4' : '6'} text-center cursor-pointer transition-all ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'}`}
            >
                <input ref={fileInputRef} type="file" multiple accept={accept} className="hidden"
                    onChange={e => { if (e.target.files) handleFiles(e.target.files); e.target.value = ''; }} />
                <Upload className={`h-${compact ? '6' : '8'} w-${compact ? '6' : '8'} text-muted-foreground mx-auto mb-2`} />
                <p className="text-sm text-muted-foreground">{ta('اسحب الملفات هنا أو اضغط للاختيار', 'Drag files here or click to select')}</p>
                <p className="text-xs text-muted-foreground mt-1">{ta('صور، PDF، مستندات', 'Images, PDF, Documents')}</p>
            </div>

            {/* Add Link Button */}
            <div className="flex gap-2">
                {showLinkInput ? (
                    <div className="flex gap-2 flex-1">
                        <Input placeholder="https://..." dir="ltr" value={linkInput}
                            onChange={e => setLinkInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddLink()} />
                        <Button size="sm" onClick={handleAddLink}><Plus className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowLinkInput(false)}><X className="h-4 w-4" /></Button>
                    </div>
                ) : (
                    <Button variant="outline" size="sm" onClick={() => setShowLinkInput(true)} className="gap-2">
                        <LinkIcon className="h-4 w-4" /> {ta('إضافة رابط', 'Add Link')}
                    </Button>
                )}
            </div>

            {/* Attachments List */}
            {attachments.length > 0 && (
                <div className="space-y-2">
                    {attachments.map(att => (
                        <div key={att.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5 group">
                            {att.preview ? (
                                <img src={att.preview} alt={att.name} className="h-10 w-10 rounded-lg object-cover" />
                            ) : (
                                <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                    {getFileIcon(att.type)}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{att.name}</p>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px]">{att.type === 'image' ? ta('صورة', 'Image') : att.type === 'link' ? ta('رابط', 'Link') : ta('ملف', 'File')}</Badge>
                                    {att.size && (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${att.size > 5 * 1024 * 1024 ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : att.size > 2 * 1024 * 1024 ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' : 'text-green-600 bg-green-50 dark:bg-green-900/20'}`}>
                                            {formatSize(att.size)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                                onClick={(e) => { e.stopPropagation(); removeAttachment(att.id); }}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export const FileUpload = memo(FileUploadInner);

