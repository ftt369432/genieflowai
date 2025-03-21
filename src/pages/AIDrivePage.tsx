import React from 'react';
import { AIDrivePage as AIDrivePageNew } from './AIDrive';

/**
 * @deprecated This component is deprecated. Please use AIDrivePage from 'src/pages/AIDrive' instead.
 */
export function AIDrivePage() {
  // Forward to the main AIDrivePage implementation
  return <AIDrivePageNew />;
}