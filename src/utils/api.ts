/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;

  // In browser runtime
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // On AI Studio dev or local preview environment, prefer local Express server on same origin
    if (hostname.includes('run.app') || hostname === 'localhost' || hostname === '127.0.0.1') {
      return '';
    }
    // On Vercel deployments, use Railway backend or env URL
    if (hostname.includes('vercel.app')) {
      return envUrl || 'https://vinebot-app-production.up.railway.app';
    }
  }

  return envUrl || 'https://vinebot-app-production.up.railway.app';
};

export const getApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!baseUrl) return cleanEndpoint;
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${cleanBase}${cleanEndpoint}`;
};

export const apiFetch = async (endpoint: string, options?: RequestInit): Promise<Response> => {
  const primaryUrl = getApiUrl(endpoint);
  try {
    return await fetch(primaryUrl, options);
  } catch (err) {
    // If primary absolute URL fetch failed (e.g., cross-origin network/CORS error or offline), retry with relative URL
    if (primaryUrl.startsWith('http')) {
      const relativeEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      try {
        return await fetch(relativeEndpoint, options);
      } catch (fallbackErr) {
        throw err; // throw original error if fallback also fails
      }
    }
    throw err;
  }
};
