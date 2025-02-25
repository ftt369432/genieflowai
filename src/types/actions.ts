export interface UserAction {
  id: string;
  type: string;
  input?: any;
  output?: any;
  timestamp: Date;
  duration: number;
  success: boolean;
}

export interface ActionResult {
  output: any;
  duration: number;
  error?: string;
}

export interface ActionMetrics {
  action: string;
  success: boolean;
  duration?: number;
  output?: any;
  error?: string;
} 