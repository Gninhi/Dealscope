import type { SecurityEvent, AuditLogEntry, AuthAction, CrudAction } from './types';
import { SECURITY_CONSTANTS } from './constants';
import { sanitizeForLog, sanitizeFieldName } from './sanitizer';

type AuditLogListener = (entry: AuditLogEntry) => void;

const listeners: Set<AuditLogListener> = new Set();
const logBuffer: AuditLogEntry[] = [];
const MAX_BUFFER_SIZE = 1000;

function addToBuffer(entry: AuditLogEntry): void {
  logBuffer.push(entry);
  if (logBuffer.length > MAX_BUFFER_SIZE) {
    logBuffer.shift();
  }
}

function formatTimestamp(date: Date): string {
  return date.toISOString();
}

function formatLogEntry(entry: AuditLogEntry): string {
  const parts = [
    `[${formatTimestamp(entry.timestamp)}]`,
    `[${entry.eventType}]`,
    `[${entry.action}]`,
    entry.success ? '[SUCCESS]' : '[FAILURE]',
    entry.userId ? `user=${entry.userId}` : 'user=anonymous',
    entry.workspaceId ? `workspace=${entry.workspaceId}` : '',
    `ip=${entry.ip}`,
    entry.resource ? `resource=${entry.resource}` : '',
    entry.resourceId ? `resourceId=${entry.resourceId}` : '',
    `message="${sanitizeForLog(entry.message)}"`,
  ].filter(Boolean);

  return parts.join(' ');
}

export function logAuditEvent(
  eventType: SecurityEvent,
  action: AuthAction | CrudAction | 'other',
  options: {
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
): void {
  const sanitizedMetadata = options.metadata
    ? Object.fromEntries(
        Object.entries(options.metadata)
          .slice(0, SECURITY_CONSTANTS.AUDIT.MAX_METADATA_SIZE)
          .map(([k, v]) => [
            sanitizeFieldName(k),
            typeof v === 'string' ? sanitizeForLog(v) : v
          ])
      )
    : undefined;

  const entry: AuditLogEntry = {
    timestamp: new Date(),
    eventType,
    action,
    userId: options.userId,
    workspaceId: options.workspaceId,
    ip: options.ip,
    userAgent: options.userAgent ? sanitizeForLog(options.userAgent) : undefined,
    resource: options.resource ? sanitizeFieldName(options.resource) : undefined,
    resourceId: options.resourceId ? sanitizeForLog(options.resourceId) : undefined,
    success: options.success,
    message: options.message.slice(0, SECURITY_CONSTANTS.AUDIT.MAX_MESSAGE_LENGTH),
    metadata: sanitizedMetadata,
  };

  const formattedLog = formatLogEntry(entry);
  
  if (entry.success) {
    console.log(`[AUDIT] ${formattedLog}`);
  } else {
    console.warn(`[AUDIT] ${formattedLog}`);
  }

  addToBuffer(entry);
  listeners.forEach(listener => {
    try {
      listener(entry);
    } catch (error) {
      console.error('[AUDIT] Listener error:', error);
    }
  });
}

export function logAuthSuccess(
  userId: string,
  ip: string,
  action: AuthAction = 'login',
  metadata?: Record<string, unknown>
): void {
  logAuditEvent('auth_success', action, {
    userId,
    ip,
    success: true,
    message: `Authentication successful: ${action}`,
    metadata,
  });
}

export function logAuthFailure(
  ip: string,
  action: AuthAction = 'login',
  reason: string,
  metadata?: Record<string, unknown>
): void {
  logAuditEvent('auth_failure', action, {
    ip,
    success: false,
    message: `Authentication failed: ${reason}`,
    metadata,
  });
}

export function logAuthLocked(
  identifier: string,
  ip: string,
  action: AuthAction = 'login'
): void {
  logAuditEvent('auth_locked', action, {
    ip,
    success: false,
    message: `Account locked: ${identifier}`,
    metadata: { identifier },
  });
}

export function logCsrfFailure(ip: string, userAgent?: string): void {
  logAuditEvent('csrf_failure', 'other', {
    ip,
    userAgent,
    success: false,
    message: 'CSRF token validation failed',
  });
}

export function logRateLimited(ip: string, endpoint: string): void {
  logAuditEvent('rate_limited', 'other', {
    ip,
    resource: endpoint,
    success: false,
    message: 'Rate limit exceeded',
  });
}

export function logValidationError(
  ip: string,
  resource: string,
  errors: Array<{ field: string; message: string }>
): void {
  logAuditEvent('validation_error', 'other', {
    ip,
    resource,
    success: false,
    message: 'Validation failed',
    metadata: { errors: errors.slice(0, 10) },
  });
}

export function logAuthorizationFailure(
  userId: string | undefined,
  ip: string,
  resource: string,
  resourceId?: string
): void {
  logAuditEvent('authorization_failure', 'other', {
    userId,
    ip,
    resource,
    resourceId,
    success: false,
    message: 'Authorization failed',
  });
}

export function logSuspiciousActivity(
  ip: string,
  reason: string,
  metadata?: Record<string, unknown>
): void {
  logAuditEvent('suspicious_activity', 'other', {
    ip,
    success: false,
    message: `Suspicious activity detected: ${reason}`,
    metadata,
  });
}

export function logCrudOperation(
  action: CrudAction,
  userId: string,
  workspaceId: string,
  ip: string,
  resource: string,
  resourceId: string,
  success: boolean,
  metadata?: Record<string, unknown>
): void {
  logAuditEvent(
    success ? 'auth_success' : 'authorization_failure',
    action,
    {
      userId,
      workspaceId,
      ip,
      resource,
      resourceId,
      success,
      message: `CRUD ${action} ${success ? 'completed' : 'failed'}`,
      metadata,
    }
  );
}

export function subscribeToAuditLogs(listener: AuditLogListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getRecentLogs(count: number = 100): AuditLogEntry[] {
  return logBuffer.slice(-count);
}

export function clearLogBuffer(): void {
  logBuffer.length = 0;
}
