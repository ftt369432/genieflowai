import { Address } from 'mailparser';

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

export interface EmailAddress {
  name?: string;
  address: string;
}

export interface ParsedEmailAddress {
  value: EmailAddress[];
  text: string;
}

export interface ImapBox {
  messages: {
    total: number;
  };
}

export interface ImapMessageAttributes {
  uid: number;
  flags?: string[];
}

export interface ImapFetchOptions {
  bodies: string | string[];
  struct: boolean;
}

export interface ImapMailboxInfo {
  delimiter?: string;
  children?: { [key: string]: ImapMailboxInfo };
  attribs: string[];
}

export interface EmailMessageMetadata {
  id: string;
  threadId: string;
  labels: string[];
  read: boolean;
  starred: boolean;
}