import type { NextRequest } from 'next/server';

export type RateLimitKey = string;
export type RateLimitCounter = number;

export interface RateLimitEntry {
  count: RateLimitCounter;
  resetAt: number;
  blockedUntil?: number;
}

export interface RateLimitStore {
  get(key: RateLimitKey): RateLimitEntry | undefined;
  set(key: RateLimitKey, value: RateLimitEntry): void;
  delete(key: RateLimitKey): void;
  size(): number;
  entries(): IterableIterator<[RateLimitKey, RateLimitEntry]>;
}

export type AuthAction = 'login' | 'logout' | 'register' | 'password_reset' | 'token_refresh';
export type CrudAction = 'create' | 'read' | 'update' | 'delete';
export type SecurityEvent = 
  | 'auth_success'
  | 'auth_failure'
  | 'auth_locked'
  | 'csrf_failure'
  | 'rate_limited'
  | 'validation_error'
  | 'authorization_failure'
  | 'suspicious_activity';

export interface AuditLogEntry {
  timestamp: Date;
  eventType: SecurityEvent;
  action: AuthAction | CrudAction | 'other';
  userId?: string;
  workspaceId?: string;
  ip: string;
  userAgent?: string;
  resource?: string;
  resourceId?: string;
  success: boolean;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface SecurityContext {
  ip: string;
  userId?: string;
  workspaceId?: string;
  userAgent?: string;
  requestId: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  workspaceId: string;
}

export type AuthResult = 
  | { success: true; user: AuthenticatedUser }
  | { success: false; error: string; status: number };

export interface SanitizationOptions {
  maxLength?: number;
  allowHtml?: boolean;
  stripNullBytes?: boolean;
  escapeQuotes?: boolean;
  strictMode?: boolean;
}

export interface ValidationRule {
  field: string;
  rules: Array<{
    type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
    value?: unknown;
    message: string;
  }>;
}

export interface SecurityCheckResult {
  passed: boolean;
  errors: Array<{ field: string; message: string }>;
}
