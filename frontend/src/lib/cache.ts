import { logger } from './logger';
/**
 * Simple in-memory cache with TTL support
 */
class CacheManager {
  private cache: Map<string, { value: any; expiry: number }> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes
  private maxSize: number = 200; // LRU limit to prevent memory leak
  private inFlight: Map<string, Promise<any>> = new Map(); // [PERF] Stampede protection

  /**
   * Set a value in the cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in milliseconds (optional)
   */
  set<T>(key: string, value: T, ttl?: number): void {
    // Evict if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.clearExpired();
      if (this.cache.size >= this.maxSize) {
        // Remove oldest entry (first key in Map iteration order)
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey) this.cache.delete(oldestKey);
      }
    }
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiry });
  }

  /**
   * Get a value from the cache
   * @param key - Cache key
   * @returns The cached value or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    
    if (!item) return undefined;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value as T;
  }

  /**
   * Check if a key exists and is not expired
   * @param key - Cache key
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete a key from the cache
   * @param key - Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cached items
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired items
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get or set a value in the cache.
   * [PERF] Stampede protection: if a fetch is already in-flight for this key,
   * reuse the existing promise instead of firing a duplicate request.
   * @param key - Cache key
   * @param fetcher - Function to fetch the value if not cached
   * @param ttl - Time to live in milliseconds (optional)
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    // Stampede protection: reuse in-flight fetch for the same key
    if (this.inFlight.has(key)) {
      return this.inFlight.get(key)! as Promise<T>;
    }

    const promise = fetcher()
      .then(value => {
        this.set(key, value, ttl);
        return value;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, promise);
    return promise;
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    this.clearExpired();
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
export const cache = new CacheManager();

// Cache keys constants
export const CACHE_KEYS = {
  TEMPLATES: 'templates',
  CATEGORIES: 'categories',
  USER_PROFILE: 'user_profile',
  CART: 'cart',
  WISHLIST: 'wishlist',
  SEARCH_RESULTS: (query: string) => `search_${query}`,
  TEMPLATE_DETAIL: (id: string) => `template_${id}`,
  CATEGORY_TEMPLATES: (slug: string) => `category_${slug}`,
} as const;

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000,      // 1 minute
  MEDIUM: 5 * 60 * 1000,     // 5 minutes
  LONG: 30 * 60 * 1000,      // 30 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
} as const;

/**
 * Local Storage cache for persistent caching
 */
export const localStorageCache = {
  set<T>(key: string, value: T, ttl?: number): void {
    const item = {
      value,
      expiry: ttl ? Date.now() + ttl : null,
    };
    try {
      localStorage.setItem(key, JSON.stringify(item));
    } catch (e) {
      logger.warn('LocalStorage is not available');
    }
  },

  get<T>(key: string): T | undefined {
    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) return undefined;

      const item = JSON.parse(itemStr);
      
      if (item.expiry && Date.now() > item.expiry) {
        localStorage.removeItem(key);
        return undefined;
      }
      
      return item.value as T;
    } catch (e) {
      return undefined;
    }
  },

  delete(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      logger.warn('LocalStorage is not available');
    }
  },

  clear(): void {
    try {
      localStorage.clear();
    } catch (e) {
      logger.warn('LocalStorage is not available');
    }
  },
};

/**
 * Session Storage cache for session-based caching
 */
export const sessionStorageCache = {
  set<T>(key: string, value: T): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      logger.warn('SessionStorage is not available');
    }
  },

  get<T>(key: string): T | undefined {
    try {
      const itemStr = sessionStorage.getItem(key);
      if (!itemStr) return undefined;
      return JSON.parse(itemStr) as T;
    } catch (e) {
      return undefined;
    }
  },

  delete(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (e) {
      logger.warn('SessionStorage is not available');
    }
  },

  clear(): void {
    try {
      sessionStorage.clear();
    } catch (e) {
      logger.warn('SessionStorage is not available');
    }
  },
};
