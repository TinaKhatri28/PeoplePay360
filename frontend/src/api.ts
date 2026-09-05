import { User } from './types';

const TOKEN_KEY = 'peoplepay360_token';
const USER_KEY = 'peoplepay360_user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User | null): void {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

export interface ApiRequestOptions extends RequestInit {
  body?: any;
}

export async function apiRequest<T = any>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const config: RequestInit = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(endpoint, config);

  const contentType = response.headers.get('content-type');
  let data: any;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else if (contentType && contentType.includes('application/pdf')) {
    data = await response.blob();
    return data as T;
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    let errorMsg = `Request failed with status ${response.status}`;
    if (typeof data === 'string' && data.length > 0) {
      errorMsg = data;
    } else if (data && typeof data === 'object') {
      if (typeof data.error === 'string') {
        errorMsg = data.error;
      } else if (data.error && typeof data.error === 'object') {
        if (data.error.message && typeof data.error.message === 'string') {
          errorMsg = data.error.message;
          if (Array.isArray(data.error.details) && data.error.details.length > 0) {
            const detailMsgs = data.error.details
              .map((d: any) => (d.field ? `${d.field}: ${d.message}` : d.message || JSON.stringify(d)))
              .join(', ');
            errorMsg = `${errorMsg}: ${detailMsgs}`;
          }
        } else {
          errorMsg = JSON.stringify(data.error);
        }
      } else if (typeof data.message === 'string') {
        errorMsg = data.message;
      }
    }

    const err: any = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

export async function downloadPayslipPdf(payslipId: number, filename = 'payslip.pdf'): Promise<void> {
  const token = getToken();
  const response = await fetch(`/api/payroll/payslips/${payslipId}/pdf`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to download PDF');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
