'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { 
  History,
  X,
  RotateCcw,
  Clock,
  Loader2
} from 'lucide-react';

interface Version {
  id: number;
  version_number: number;
  field_values: Record<string, string>;
  change_summary: string | null;
  created_at: string;
}

interface VersionHistoryPanelProps {
  userTemplateDataId: number;
  isOpen: boolean;
  onClose: () => void;
  onRestore: (fieldValues: Record<string, string>) => void;
}

export default function VersionHistoryPanel({ 
  userTemplateDataId, 
  isOpen, 
  onClose,
  onRestore 
}: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && userTemplateDataId) {
      fetchVersions();
    }
  }, [isOpen, userTemplateDataId]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const response = await api.getVersionHistory(userTemplateDataId.toString());
      if (response.success) {
        setVersions(response.data);
      }
    } catch (err) {
      console.error('Error fetching versions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (version: Version) => {
    try {
      setRestoring(version.id);
      onRestore(version.field_values);
      onClose();
    } catch (err) {
      console.error('Error restoring version:', err);
    } finally {
      setRestoring(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50">
      <div className="bg-white dark:bg-gray-800 h-full w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">سجل التغييرات</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto h-[calc(100%-64px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">لا يوجد سجل تغييرات</p>
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version, index) => (
                <div 
                  key={version.id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                        v{version.version_number}
                      </span>
                      {index === 0 && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                          الحالي
                        </span>
                      )}
                    </div>
                    
                    {index !== 0 && (
                      <button
                        onClick={() => handleRestore(version)}
                        disabled={restoring === version.id}
                        className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 disabled:opacity-50"
                      >
                        {restoring === version.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RotateCcw className="w-4 h-4" />
                        )}
                        استعادة
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                    <Clock className="w-3 h-3" />
                    {formatDate(version.created_at)}
                  </div>
                  
                  {version.change_summary && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {version.change_summary}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
