'use client';

/**
 * useRecentlyViewed.ts
 * Tracks recently viewed templates in localStorage for personalized UX.
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'sers_recently_viewed';
const MAX_ITEMS = 8;

export interface ViewedTemplate {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl?: string;
  section?: string;
  viewedAt: number; // timestamp
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<ViewedTemplate[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch {}
  }, []);

  const addViewed = useCallback((template: Omit<ViewedTemplate, 'viewedAt'>) => {
    setItems(prev => {
      const filtered = prev.filter(t => t.id !== template.id);
      const updated = [{ ...template, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const clearViewed = useCallback(() => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { items, addViewed, clearViewed };
}
