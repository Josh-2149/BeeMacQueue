// debug.ts - Add this to your project root
export const DEBUG = true;

export function logDebug(tag: string, message: string, data?: any) {
  if (DEBUG) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${tag}] ${message}`, data || '');
  }
}

export function logError(tag: string, error: any) {
  console.error(`[ERROR] [${tag}]`, error);
}

// Usage: 
// import { logDebug } from '../debug';
// logDebug('Login', 'User clicked login', { email });