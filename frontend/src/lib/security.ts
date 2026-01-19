/**
 * Security utilities for input validation and sanitization
 */

// XSS Prevention - Escape HTML entities
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

// Remove HTML tags from string
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

// Sanitize user input - remove dangerous characters
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone number (Saudi format)
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(05|5)(5|0|3|6|4|9|1|8|7)([0-9]{7})$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Validate password strength
export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isStrong: boolean;
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('يجب أن تكون كلمة المرور 8 أحرف على الأقل');
  }

  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push('يجب أن تحتوي على حرف صغير');
  }

  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('يجب أن تحتوي على حرف كبير');
  }

  if (/[0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('يجب أن تحتوي على رقم');
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('يفضل إضافة رمز خاص (!@#$%^&*)');
  }

  return {
    score: Math.min(score, 4),
    feedback,
    isStrong: score >= 3,
  };
}

// Generate secure random string
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Validate URL format
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Check if URL is safe (not javascript:, data:, etc.)
export function isSafeUrl(url: string): boolean {
  if (!url) return false;
  
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = url.toLowerCase().trim();
  
  return !dangerousProtocols.some((protocol) => lowerUrl.startsWith(protocol));
}

// Rate limiting helper
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    
    // Remove old timestamps
    const validTimestamps = timestamps.filter(
      (timestamp) => now - timestamp < this.windowMs
    );
    
    if (validTimestamps.length >= this.maxRequests) {
      return false;
    }
    
    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    return true;
  }

  getRemainingRequests(key: string): number {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const validTimestamps = timestamps.filter(
      (timestamp) => now - timestamp < this.windowMs
    );
    return Math.max(0, this.maxRequests - validTimestamps.length);
  }

  reset(key: string): void {
    this.requests.delete(key);
  }
}

// CSRF Token management
export const csrfToken = {
  get(): string | null {
    if (typeof document === 'undefined') return null;
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta?.getAttribute('content') || null;
  },

  getHeader(): Record<string, string> {
    const token = this.get();
    return token ? { 'X-CSRF-TOKEN': token } : {};
  },
};

// Content Security Policy helpers
export function generateNonce(): string {
  return generateSecureToken(16);
}

// Validate file type
export function isAllowedFileType(
  file: File,
  allowedTypes: string[]
): boolean {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  
  return allowedTypes.some((type) => {
    if (type.startsWith('.')) {
      return fileName.endsWith(type);
    }
    if (type.endsWith('/*')) {
      return fileType.startsWith(type.slice(0, -1));
    }
    return fileType === type;
  });
}

// Validate file size
export function isAllowedFileSize(
  file: File,
  maxSizeInMB: number
): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
}

// Secure form data builder
export function buildSecureFormData(
  data: Record<string, any>
): FormData {
  const formData = new FormData();
  
  Object.entries(data).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    
    if (value instanceof File) {
      formData.append(key, value);
    } else if (typeof value === 'string') {
      formData.append(key, sanitizeInput(value));
    } else {
      formData.append(key, JSON.stringify(value));
    }
  });
  
  return formData;
}

// Obfuscate sensitive data for logging
export function obfuscateSensitive(
  data: Record<string, any>,
  sensitiveKeys: string[] = ['password', 'token', 'secret', 'key', 'credit_card']
): Record<string, any> {
  const result: Record<string, any> = {};
  
  Object.entries(data).forEach(([key, value]) => {
    const isSensitive = sensitiveKeys.some((sensitiveKey) =>
      key.toLowerCase().includes(sensitiveKey)
    );
    
    if (isSensitive && typeof value === 'string') {
      result[key] = value.slice(0, 2) + '***' + value.slice(-2);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = obfuscateSensitive(value, sensitiveKeys);
    } else {
      result[key] = value;
    }
  });
  
  return result;
}
