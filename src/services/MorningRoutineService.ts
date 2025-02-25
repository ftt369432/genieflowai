import { UserPreferences, PersonalityProfile } from '../types/personality';
import { WeatherService } from './WeatherService';
import { CalendarService } from './CalendarService';
import { TaskService } from './TaskService';

export class MorningRoutineService {
  private userPreferences: UserPreferences;
  private personalityProfile: PersonalityProfile;
  private weatherService: WeatherService;
  private calendarService: CalendarService;
  private taskService: TaskService;

  constructor(
    userPreferences: UserPreferences,
    personalityProfile: PersonalityProfile
  ) {
    this.userPreferences = userPreferences;
    this.personalityProfile = personalityProfile;
  }

  public async generateMorningGreeting(): Promise<string> {
    const name = this.userPreferences.name;
    const weather = await this.weatherService.getTodaysForecast();
    const mood = await this.determineMood();
    
    return this.constructGreeting(name, weather, mood);
  }

  public async generateMorningSummary(): Promise<string> {
    const events = await this.calendarService.getTodaysEvents();
    const tasks = await this.taskService.getPrioritizedTasks();
    const insights = await this.generateDailyInsights();
    const quote = this.getInspirationalQuote();

    return `
      Here's your morning briefing:

      ${this.formatWeatherUpdate()}
      
      Today's Schedule:
      ${this.formatEvents(events)}
      
      Priority Tasks:
      ${this.formatTasks(tasks)}
      
      Daily Insight:
      ${insights}
      
      ${quote}
      
      ${this.generatePersonalizedAdvice()}
    `;
  }

  private async determineMood(): Promise<string> {
    const sleepData = await this.getSleepData();
    const schedule = await this.calendarService.getTodaysEvents();
    const weather = await this.weatherService.getTodaysForecast();
    
    // Adjust tone based on user's context
    if (sleepData.duration < 6) return 'energizing';
    if (schedule.length > 8) return 'supportive';
    if (weather.condition === 'rainy') return 'uplifting';
    return 'balanced';
  }

  private generatePersonalizedAdvice(): string {
    const workStyle = this.personalityProfile.workStyle;
    const peakHours = workStyle.peakProductivityHours;
    const currentHour = new Date().getHours();

    if (peakHours.includes(currentHour)) {
      return "This is typically your most productive time. Consider tackling your most important tasks now.";
    }

    return "Remember to take breaks and stay hydrated throughout your day.";
  }

  private getInspirationalQuote(): string {
    const quotes = [
      {
        text: "The only way to do great work is to love what you do.",
        author: "Steve Jobs",
        theme: "passion"
      },
      {
        text: "Small steps every day lead to massive results over time.",
        author: "Unknown",
        theme: "progress"
      },
      // Add more quotes...
    ];

    const userMood = this.assessUserMood();
    const appropriateQuotes = quotes.filter(q => this.isQuoteAppropriate(q, userMood));
    return appropriateQuotes[Math.floor(Math.random() * appropriateQuotes.length)].text;
  }

  private assessUserMood(): string {
    // Implement mood assessment logic
    return 'motivated';
  }
} 