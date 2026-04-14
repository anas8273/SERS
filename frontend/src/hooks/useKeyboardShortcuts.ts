'use client';

import { useEffect, useCallback } from 'react';

type ModifierKey = 'ctrl' | 'shift' | 'alt' | 'meta';

interface ShortcutConfig {
  key: string;
  modifiers?: ModifierKey[];
  action: () => void;
  /** Prevent running when user is in an input/textarea */
  ignoreInputs?: boolean;
}

/**
 * Hook for keyboard shortcuts.
 *
 * Usage:
 * ```tsx
 * useKeyboardShortcuts([
 *   { key: 'k', modifiers: ['ctrl'], action: () => openSearch() },
 *   { key: 'Escape', action: () => closeModal() },
 * ]);
 * ```
 */
export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;

    for (const shortcut of shortcuts) {
      const { key, modifiers = [], action, ignoreInputs = true } = shortcut;

      // Skip if focus is in an input and we should ignore inputs
      if (ignoreInputs && isInput) continue;

      // Check key match (case insensitive)
      if (e.key.toLowerCase() !== key.toLowerCase()) continue;

      // Check modifier keys
      const ctrlMatch = modifiers.includes('ctrl') ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
      const shiftMatch = modifiers.includes('shift') ? e.shiftKey : !e.shiftKey;
      const altMatch = modifiers.includes('alt') ? e.altKey : !e.altKey;

      if (ctrlMatch && shiftMatch && altMatch) {
        e.preventDefault();
        action();
        return;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
