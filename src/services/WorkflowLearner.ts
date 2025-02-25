import { BehaviorSubject } from 'rxjs';
import { WorkflowPattern, WorkflowAction, WorkflowPatternType, AgentSuggestion, AutonomyLevel } from '../types/workflow';
import { UserAction } from '../types/actions';

export class WorkflowLearner {
  private patterns: WorkflowPattern[] = [];
  private readonly PATTERN_THRESHOLD = 0.3;
  private readonly CONFIDENCE_DECAY = 0.95;
  private readonly MIN_SEQUENCE_LENGTH = 2;

  public patterns$ = new BehaviorSubject<WorkflowPattern[]>([]);

  public analyzeActions(actions: UserAction[]): void {
    const groupedActions = this.groupActionsByCategory(actions);
    const patterns: WorkflowPattern[] = [];

    for (const [category, actions] of Object.entries(groupedActions)) {
      const frequency = actions.length / actions.length;
      const triggers = this.identifyTriggers(actions);
      const complexity = this.calculateComplexity(actions);

      if (frequency > this.PATTERN_THRESHOLD) {
        patterns.push({
          id: Date.now().toString(),
          name: this.generatePatternName(category, actions),
          type: this.determinePatternType(actions),
          description: this.generateDescription(category, actions),
          frequency,
          confidence: this.calculateConfidence(actions),
          complexity,
          capabilities: this.determineCapabilities(category, actions),
          triggers,
          actions: actions.map(action => ({
            id: Date.now().toString(),
            type: action.type,
            input: action.input,
            output: action.output,
            timestamp: action.timestamp,
            status: action.success ? 'completed' : 'failed',
            duration: action.duration
          }))
        });
      }
    }

    this.patterns = patterns;
    this.patterns$.next(patterns);
  }

  private groupActionsByCategory(actions: UserAction[]): Record<string, UserAction[]> {
    return actions.reduce((groups, action) => {
      const category = this.categorizeAction(action);
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(action);
      return groups;
    }, {} as Record<string, UserAction[]>);
  }

  private categorizeAction(action: UserAction): string {
    // Implement sophisticated action categorization
    const categories = {
      'email': ['send', 'read', 'archive', 'forward'],
      'document': ['create', 'edit', 'share', 'delete'],
      'meeting': ['schedule', 'join', 'end', 'reschedule'],
      'task': ['create', 'complete', 'assign', 'update']
    };

    for (const [category, verbs] of Object.entries(categories)) {
      if (verbs.some(verb => action.type.toLowerCase().includes(verb))) {
        return category;
      }
    }

    return 'other';
  }

  private calculateConfidence(actions: UserAction[]): number {
    const consistencyScore = this.calculateConsistency(actions);
    const frequencyScore = actions.length / 100; // Normalize to 0-1
    const successRate = actions.filter(a => a.success).length / actions.length;

    return (consistencyScore * 0.4 + frequencyScore * 0.3 + successRate * 0.3);
  }

  private calculateConsistency(actions: UserAction[]): number {
    if (actions.length < 2) return 1;

    const intervals = actions.slice(1).map((action, i) => 
      action.timestamp.getTime() - actions[i].timestamp.getTime()
    );

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((acc, interval) => 
      acc + Math.pow(interval - avgInterval, 2), 0
    ) / intervals.length;

    return 1 / (1 + Math.sqrt(variance) / avgInterval);
  }

  private determinePatternType(actions: UserAction[]): WorkflowPatternType {
    const hasLearning = actions.some(a => a.type.includes('learn') || a.type.includes('adapt'));
    const isProcess = actions.length >= 3 && this.hasSequentialDependency(actions);
    
    return hasLearning ? 'learning' : isProcess ? 'process' : 'automation';
  }

  private hasSequentialDependency(actions: UserAction[]): boolean {
    return actions.some((action, i) => 
      i > 0 && action.input && 
      JSON.stringify(action.input).includes(JSON.stringify(actions[i-1].output))
    );
  }

  public suggestAutomations(): AgentSuggestion[] {
    return this.patterns
      .filter(pattern => pattern.confidence > 0.7)
      .map(pattern => ({
        type: 'automation',
        description: `Automate ${pattern.name} workflow`,
        confidence: pattern.confidence,
        suggestedAgent: {
          name: `${pattern.name} Assistant`,
          capabilities: pattern.capabilities,
          autonomyLevel: this.determineAutonomyLevel(pattern),
          triggers: pattern.triggers
        }
      }));
  }

  private determineAutonomyLevel(pattern: WorkflowPattern): AutonomyLevel {
    if (pattern.confidence > 0.9 && pattern.complexity < 0.3) {
      return 'autonomous';
    } else if (pattern.confidence > 0.7) {
      return 'semi-autonomous';
    }
    return 'supervised';
  }

  private generatePatternName(category: string, actions: UserAction[]): string {
    const mainAction = actions
      .sort((a, b) => 
        actions.filter(x => x.type === a.type).length -
        actions.filter(x => x.type === b.type).length
      )
      .pop()?.type || 'Process';

    return `${category} ${mainAction} Pattern`;
  }

  private generateDescription(category: string, actions: UserAction[]): string {
    const frequency = actions.length;
    const successRate = actions.filter(a => a.success).length / actions.length;
    const avgDuration = actions.reduce((acc, a) => acc + a.duration, 0) / actions.length;

    return `A ${category} workflow pattern that occurs ${frequency} times with ` +
           `${Math.round(successRate * 100)}% success rate and takes an average of ` +
           `${Math.round(avgDuration / 1000)} seconds to complete.`;
  }

  private determineCapabilities(category: string, actions: UserAction[]): string[] {
    const capabilities = new Set<string>();
    
    // Add category-based capabilities
    capabilities.add(`${category}-management`);
    capabilities.add(`${category}-automation`);

    // Add action-based capabilities
    actions.forEach(action => {
      capabilities.add(action.type);
      if (action.input?.requires) {
        capabilities.add(action.input.requires);
      }
    });

    return Array.from(capabilities);
  }

  private identifyTriggers(actions: UserAction[]): string[] {
    const triggers = new Set<string>();
    
    actions.forEach(action => {
      if (action.input && typeof action.input === 'object') {
        Object.keys(action.input).forEach(key => {
          if (key.includes('trigger') || key.includes('event')) {
            triggers.add(action.input[key]);
          }
        });
      }
    });

    return Array.from(triggers);
  }

  private calculateComplexity(actions: UserAction[]): number {
    const uniqueTypes = new Set(actions.map(a => a.type)).size;
    const hasConditionals = actions.some(a => a.type.includes('if') || a.type.includes('condition'));
    const hasLoops = actions.some(a => a.type.includes('repeat') || a.type.includes('loop'));
    
    let complexity = uniqueTypes / 10; // Base complexity
    if (hasConditionals) complexity += 0.3;
    if (hasLoops) complexity += 0.3;
    
    return Math.min(complexity, 1);
  }
} 