'use client';

import { Trash2, X, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ta } from '@/i18n/auto-translations';

interface BulkActionBarProps {
    selectedCount: number;
    totalCount: number;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    onDeleteSelected: () => void;
    onDeleteAll?: () => void;
    isAllSelected: boolean;
    entityName?: string; // e.g. "قالب", "طلب", "مستخدم"
}

export function BulkActionBar({
    selectedCount,
    totalCount,
    onSelectAll,
    onDeselectAll,
    onDeleteSelected,
    onDeleteAll,
    isAllSelected,
    entityName = ta('عنصر', 'item'),
}: BulkActionBarProps) {
    if (selectedCount === 0 && !onDeleteAll) return null;

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
                {/* Select All / Deselect All */}
                <button
                    onClick={isAllSelected ? onDeselectAll : onSelectAll}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                    <CheckSquare className="w-3.5 h-3.5" />
                    {isAllSelected ? ta('إلغاء تحديد الكل', 'Deselect All') : ta('تحديد الكل', 'Select All')}
                </button>

                {selectedCount > 0 && (
                    <span className="text-xs font-bold text-primary">
                        {selectedCount} {entityName} {ta('محدد', 'selected')}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2">
                {/* Delete Selected */}
                {selectedCount > 0 && (
                    <Button
                        onClick={onDeleteSelected}
                        size="sm"
                        className="rounded-xl gap-1.5 font-bold bg-red-600 hover:bg-red-700 text-white text-xs"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        {ta('حذف المحدد', 'Delete Selected')} ({selectedCount})
                    </Button>
                )}

                {/* Delete All */}
                {onDeleteAll && totalCount > 0 && (
                    <Button
                        onClick={onDeleteAll}
                        size="sm"
                        variant="outline"
                        className="rounded-xl gap-1.5 font-bold text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20 text-xs"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        {ta('حذف الكل', 'Delete All')}
                    </Button>
                )}

                {/* Cancel selection */}
                {selectedCount > 0 && (
                    <button
                        onClick={onDeselectAll}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
