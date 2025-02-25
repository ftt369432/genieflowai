import { BaseAgent } from './BaseAgent';
import { ActionResult } from '../../types/actions';
import { CalendarService } from '../CalendarService';

export class CalendarAgent extends BaseAgent {
  private calendarService: CalendarService;

  constructor(config: AgentConfig) {
    super(config);
    this.calendarService = new CalendarService();
  }

  public async scheduleMeeting(
    participants: string[],
    duration: number,
    preferences?: any
  ): Promise<ActionResult> {
    const startTime = Date.now();

    try {
      // Get available times for all participants
      const availableTimes = await this.findAvailableSlots(participants, duration);
      
      // Analyze preferences and rank slots
      const rankedSlots = await this.rankTimeSlots(availableTimes, preferences);
      
      // Get the best slot
      const bestSlot = rankedSlots[0];
      
      // Schedule the meeting
      const meeting = await this.calendarService.createEvent({
        title: preferences?.title || 'Meeting',
        startTime: bestSlot.start,
        endTime: bestSlot.end,
        participants,
        description: preferences?.description
      });

      return {
        output: { meeting, alternativeSlots: rankedSlots.slice(1) },
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        output: null,
        duration: Date.now() - startTime,
        error: this.formatError(error)
      };
    }
  }

  protected async executeAction(action: string, params: any): Promise<ActionResult> {
    switch (action) {
      case 'schedule':
        return this.scheduleMeeting(
          params.participants,
          params.duration,
          params.preferences
        );
      case 'reschedule':
        return this.rescheduleMeeting(params.meetingId, params.newTime);
      case 'suggest-times':
        return this.suggestMeetingTimes(
          params.participants,
          params.duration,
          params.preferences
        );
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async findAvailableSlots(
    participants: string[],
    duration: number
  ): Promise<Array<{ start: Date; end: Date }>> {
    const availabilities = await Promise.all(
      participants.map(p => this.calendarService.getAvailability(p))
    );

    return this.findCommonSlots(availabilities, duration);
  }

  private findCommonSlots(
    availabilities: Array<Array<{ start: Date; end: Date }>>,
    duration: number
  ): Array<{ start: Date; end: Date }> {
    // Implement slot finding algorithm
    return [];
  }

  private async rankTimeSlots(
    slots: Array<{ start: Date; end: Date }>,
    preferences?: any
  ): Promise<Array<{ start: Date; end: Date; score: number }>> {
    const prompt = `Rank these meeting slots based on the following preferences:\n` +
      `Slots: ${JSON.stringify(slots)}\n` +
      `Preferences: ${JSON.stringify(preferences)}`;

    const rankings = await this.getCompletion(prompt, { purpose: 'time_ranking' });
    return JSON.parse(rankings);
  }

  private async rescheduleMeeting(
    meetingId: string,
    newTime: Date
  ): Promise<ActionResult> {
    const startTime = Date.now();

    try {
      const meeting = await this.calendarService.updateEvent(meetingId, {
        startTime: newTime
      });

      return {
        output: { meeting },
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        output: null,
        duration: Date.now() - startTime,
        error: this.formatError(error)
      };
    }
  }

  private async suggestMeetingTimes(
    participants: string[],
    duration: number,
    preferences?: any
  ): Promise<ActionResult> {
    const startTime = Date.now();

    try {
      const availableSlots = await this.findAvailableSlots(participants, duration);
      const rankedSlots = await this.rankTimeSlots(availableSlots, preferences);

      return {
        output: { suggestedTimes: rankedSlots },
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        output: null,
        duration: Date.now() - startTime,
        error: this.formatError(error)
      };
    }
  }
} 