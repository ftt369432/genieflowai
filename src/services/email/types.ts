export interface EmailCredentials {
  access_token: string;
}

export interface EmailError {
  message: string;
  code?: string;
}

export interface EmailResponse<T> {
  data: T;
  error?: EmailError;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{
      name: string;
      value: string;
    }>;
    parts?: Array<{
      mimeType: string;
      body: {
        data?: string;
      };
    }>;
    body?: {
      data?: string;
    };
  };
  internalDate: string;
}