import { UserBehavior, LearningPattern } from '../types/learning';
import { PersonalityProfile } from '../types/personality';

export class LearningService {
  private readonly LEARNING_RATE = 0.1;
  private readonly PATTERN_THRESHOLD = 0.7;
  private behaviorHistory: UserBehavior[] = [];
  private learningPatterns: Map<string, LearningPattern> = new Map();

  public recordBehavior(behavior: UserBehavior) {
    this.behaviorHistory.push(behavior);
    this.analyzeBehaviorPatterns();
  }

  private analyzeBehaviorPatterns() {
    const recentBehaviors = this.behaviorHistory.slice(-100);
    const patterns = this.detectPatterns(recentBehaviors);
    
    patterns.forEach(pattern => {
      if (pattern.confidence > this.PATTERN_THRESHOLD) {
        this.updateLearningPattern(pattern);
      }
    });
  }

  private detectPatterns(behaviors: UserBehavior[]): LearningPattern[] {
    const patterns: LearningPattern[] = [];
    
    // Time-based patterns
    this.detectTimePatterns(behaviors, patterns);
    
    // Context patterns
    this.detectContextPatterns(behaviors, patterns);
    
    // Sequence patterns
    this.detectSequencePatterns(behaviors, patterns);
    
    return patterns;
  }

  private detectTimePatterns(behaviors: UserBehavior[], patterns: LearningPattern[]) {
    const timeGroups = new Map<number, UserBehavior[]>();
    
    behaviors.forEach(behavior => {
      const hour = new Date(behavior.timestamp).getHours();
      const group = timeGroups.get(hour) || [];
      group.push(behavior);
      timeGroups.set(hour, group);
    });

    timeGroups.forEach((group, hour) => {
      if (group.length >= 3) {
        patterns.push({
          type: 'time-based',
          trigger: { type: 'time', hour },
          behaviors: group,
          confidence: group.length / behaviors.length
        });
      }
    });
  }

  private updateLearningPattern(pattern: LearningPattern) {
    const existing = this.learningPatterns.get(pattern.id);
    
    if (existing) {
      // Update existing pattern with new observations
      existing.confidence = (1 - this.LEARNING_RATE) * existing.confidence +
                          this.LEARNING_RATE * pattern.confidence;
      existing.behaviors = [...existing.behaviors, ...pattern.behaviors];
    } else {
      // Add new pattern
      this.learningPatterns.set(pattern.id, pattern);
    }
  }

  public suggestAdaptations(profile: PersonalityProfile): Partial<PersonalityProfile> {
    const suggestions: Partial<PersonalityProfile> = {};
    
    this.learningPatterns.forEach(pattern => {
      if (pattern.confidence > 0.8) {
        this.applyPatternToProfile(pattern, suggestions);
      }
    });

    return suggestions;
  }
} 