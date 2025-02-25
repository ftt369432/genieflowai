import { EmailResponse } from './types';
import { getAccessToken } from '../auth/googleAuth';

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

export async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<EmailResponse<T>> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return {
      data: {} as T,
      error: { message: 'No access token available' }
    };
  }

  try {
    const response = await fetch(`${GMAIL_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        data: {} as T,
        error: {
          message: error.error?.message || 'Failed to fetch data',
          code: error.error?.code
        }
      };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return {
      data: {} as T,
      error: { message: error instanceof Error ? error.message : 'Unknown error occurred' }
    };
  }
}