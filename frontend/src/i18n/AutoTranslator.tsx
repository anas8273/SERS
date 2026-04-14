'use client';

import { useEffect, useRef } from 'react';
import { useTranslation } from './useTranslation';
import { autoTranslations } from './auto-translations';

/**
 * AutoTranslator — Global DOM-level Arabic → English translator.
 *
 * Strategy (in order):
 * 1. Exact match from dictionary
 * 2. Partial / contains match for long text nodes that START with a known phrase
 * 3. Word-level replacement for known isolated words inside longer text
 */
export function AutoTranslator() {
    const { locale } = useTranslation();
    const isTranslatingRef = useRef(false);

    useEffect(() => {
        if (locale !== 'en') return;

        // Build lookup maps
        const exactMap   = new Map<string, string>();
        const partialArr: Array<{ ar: string; en: string; len: number }> = [];

        for (const [ar, en] of Object.entries(autoTranslations)) {
            const t = ar.trim();
            exactMap.set(t, en);
            // Only index entries that are long enough to be worth partial matching (> 4 chars)
            if (t.length > 4) {
                partialArr.push({ ar: t, en, len: t.length });
            }
        }

        // Sort by length descending → longest match wins first
        partialArr.sort((a, b) => b.len - a.len);

        const ARABIC_RE  = /[\u0600-\u06FF]/;
        const SKIP_TAGS  = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'CODE', 'PRE', 'NOSCRIPT', 'SVG']);
        const ATTRS      = ['placeholder', 'title', 'aria-label', 'alt', 'data-tooltip'];

        /** Try exact match first, then partial containment */
        function lookup(text: string): string | null {
            const trimmed = text.trim();
            if (!trimmed) return null;

            // 1. Exact match
            const exact = exactMap.get(trimmed);
            if (exact) return exact;

            // 2. Partial: find the longest ar phrase that EQUALS the text
            //    (handles trailing punctuation or tiny whitespace diffs)
            for (const { ar, en } of partialArr) {
                if (trimmed === ar) return en;   // already covered above, but safe
            }

            // 3. Containment: text contains a known Arabic phrase as substring
            //    Replace ALL known phrases found in the text
            let result = trimmed;
            let changed = false;
            for (const { ar, en } of partialArr) {
                if (result.includes(ar)) {
                    result = result.split(ar).join(en);
                    changed = true;
                }
            }
            if (changed) return trimmed.replace(trimmed, result);

            return null;
        }

        function translateTextNode(node: Node) {
            if (!node.textContent || !ARABIC_RE.test(node.textContent)) return;
            const parent = node.parentElement;
            if (!parent || SKIP_TAGS.has(parent.tagName)) return;
            const original = node.textContent.trim();
            if (!original || original.length < 2) return;
            const translated = lookup(original);
            if (translated && translated !== original) {
                node.textContent = node.textContent.replace(original, translated);
            }
        }

        function translateDOM(root: Element | Document) {
            if (isTranslatingRef.current) return;
            isTranslatingRef.current = true;

            try {
                const target = root === document ? document.body : root as Element;
                if (!target) { isTranslatingRef.current = false; return; }

                // Text nodes via TreeWalker
                const walker = document.createTreeWalker(
                    target, NodeFilter.SHOW_TEXT,
                    {
                        acceptNode: (n) => {
                            const p = n.parentElement;
                            if (!p || SKIP_TAGS.has(p.tagName)) return NodeFilter.FILTER_REJECT;
                            if (!n.textContent || !ARABIC_RE.test(n.textContent)) return NodeFilter.FILTER_REJECT;
                            return NodeFilter.FILTER_ACCEPT;
                        }
                    }
                );

                const nodes: Text[] = [];
                let cur: Text | null;
                while ((cur = walker.nextNode() as Text | null)) nodes.push(cur);
                for (const tn of nodes) translateTextNode(tn);

                // Translatable attributes
                const elements = target.querySelectorAll('*');
                elements.forEach((el) => {
                    for (const attr of ATTRS) {
                        const val = el.getAttribute(attr);
                        if (val && ARABIC_RE.test(val)) {
                            const translated = lookup(val);
                            if (translated && translated !== val) {
                                el.setAttribute(attr, translated);
                            }
                        }
                    }
                });
            } finally {
                isTranslatingRef.current = false;
            }
        }

        // Initial scan — use requestIdleCallback so it doesn't block paint
        const scheduleTranslate = typeof requestIdleCallback !== 'undefined'
            ? (cb: () => void) => requestIdleCallback(cb, { timeout: 800 })
            : (cb: () => void) => setTimeout(cb, 250);

        // Run once quickly and again after idle to catch lazy-loaded content
        const t1 = setTimeout(() => translateDOM(document), 300);
        const idleId = scheduleTranslate(() => translateDOM(document));

        // Debounced MutationObserver for dynamically added content
        let mutationTimer: ReturnType<typeof setTimeout> | null = null;
        const pendingNodes = new Set<Node>();

        const observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.type === 'childList') {
                    m.addedNodes.forEach((n) => pendingNodes.add(n));
                } else if (m.type === 'characterData') {
                    if (m.target.nodeType === Node.TEXT_NODE) {
                        pendingNodes.add(m.target);
                    }
                }
            }
            if (mutationTimer) clearTimeout(mutationTimer);
            mutationTimer = setTimeout(() => {
                if (pendingNodes.size === 0) return;
                const snapshot = [...pendingNodes];
                pendingNodes.clear();
                for (const node of snapshot) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        translateDOM(node as Element);
                    } else if (node.nodeType === Node.TEXT_NODE) {
                        translateTextNode(node);
                    }
                }
            }, 100);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
        });

        return () => {
            clearTimeout(t1);
            if (typeof cancelIdleCallback !== 'undefined') cancelIdleCallback(idleId as number);
            if (mutationTimer) clearTimeout(mutationTimer);
            observer.disconnect();
        };
    }, [locale]);

    return null;
}
