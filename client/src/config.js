/**
 * API Configuration
 * Supports environment-based configuration for deployment readiness,
 * with a fallback to local backend for development.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000';
