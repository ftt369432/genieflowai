import type { Email } from '../../types';
import { updateFolderCount } from './folderService';

export async function moveToFolder(emails: Email[], folderId: string) {
  // In a real app, this would make an API call
  updateFolderCount(folderId, emails.length);
  return true;
}

export async function archiveEmails(emails: Email[]) {
  // In a real app, this would make an API call
  updateFolderCount('archive', emails.length);
  return true;
}

export async function deleteEmails(emails: Email[]) {
  // In a real app, this would make an API call
  updateFolderCount('trash', emails.length);
  return true;
}

export async function starEmails(emails: Email[]) {
  // In a real app, this would make an API call
  updateFolderCount('starred', emails.length);
  return true;
}