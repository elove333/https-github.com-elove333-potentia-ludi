// Supabase Integration - Main Export
// Centralized exports for Supabase functionality

export * from './client';
export * from './auth';
export * from './realtime';
export * from './storage';

// Re-export main instances as default
export { default as supabase } from './client';
export { default as authManager } from './auth';
export { default as realtimeSubscriptions } from './realtime';
export { default as storageManager } from './storage';
