import React from 'react';
import { AIDrivePage as MainAIDrivePage } from './AIDrive';

/**
 * @deprecated This component is deprecated. Please use AIDrivePage from 'src/pages/AIDrive' instead.
 * This is a wrapper to maintain backward compatibility.
 */
export function AIDrivePage() {
  // Forward to the main implementation
  return <MainAIDrivePage />;
}