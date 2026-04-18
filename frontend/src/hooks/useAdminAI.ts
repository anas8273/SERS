'use client';

/**
 * hooks/useAdminAI.ts
 *
 * Admin AI Agent hook — connects real dashboard stats to the AI,
 * manages conversation history, and provides actionable commands.
 */

import { useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import {
  buildAdminSystemPrompt,
  generateQuickInsights,
  ADMIN_QUICK_PROMPTS,
  type AdminStats,
} from '@/lib/ai-context';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export interface AdminAIState {
  messages: AIMessage[];
  isLoading: boolean;
  insights: string[];
  error: string | null;
}

export function useAdminAI(stats: AdminStats | null, locale: string = 'ar') {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const systemPromptRef = useRef<string>('');

  // Build system prompt from live stats
  const getSystemPrompt = useCallback(() => {
    if (!stats) return '';
    if (!systemPromptRef.current) {
      systemPromptRef.current = buildAdminSystemPrompt(stats, locale);
    }
    return systemPromptRef.current;
  }, [stats, locale]);

  // Quick insights from stats (no AI needed — computed locally)
  const insights = stats ? generateQuickInsights(stats) : [];

  // Build compact stats context (< 500 chars) to prepend to every admin message
  const buildStatsContext = useCallback(() => {
    if (!stats) return '';
    return `[بيانات النظام الحالية: إيرادات=${stats.total_revenue.toFixed(0)} ريال، طلبات=${stats.total_orders}، مستخدمون=${stats.total_users}، قوالب=${stats.total_templates}، معلق=${stats.orders_by_status.pending}، اليوم=${stats.today_orders} طلب و${stats.today_revenue.toFixed(0)} ريال، نمو=${stats.revenue_trend}%]\n`;
  }, [stats]);

  // Send a message to the AI
  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    const userMsg: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    const loadingMsg: AIMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setIsLoading(true);
    setError(null);

    try {
      // Prepend compact stats context so the backend AI knows real numbers
      const statsContext = buildStatsContext();
      const fullMessage = statsContext + userMessage;

      const response = await api.chatWithAI(fullMessage, undefined, locale);
      const aiText =
        response?.data?.message ||
        response?.data?.response ||
        response?.data?.content ||
        'عذراً، لم أتمكن من الإجابة. حاول مرة أخرى.';

      setMessages(prev =>
        prev.map(m =>
          m.isLoading
            ? { ...m, content: aiText, isLoading: false }
            : m
        )
      );
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'حدث خطأ في الاتصال بالذكاء الاصطناعي';
      setError(errMsg);
      setMessages(prev =>
        prev.map(m =>
          m.isLoading
            ? { ...m, content: `⚠️ ${errMsg}`, isLoading: false }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, buildStatsContext]);

  // Send a quick prompt from the preset list
  const sendQuickPrompt = useCallback((prompt: string) => {
    sendMessage(prompt);
  }, [sendMessage]);

  // Clear conversation
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  // Refresh system prompt when stats change
  const refreshPrompt = useCallback(() => {
    systemPromptRef.current = '';
  }, []);

  return {
    messages,
    isLoading,
    insights,
    error,
    quickPrompts: ADMIN_QUICK_PROMPTS,
    sendMessage,
    sendQuickPrompt,
    clearMessages,
    refreshPrompt,
  };
}
