import { StoryEvent, EventTrigger, GameState } from '../types';
import { EVENTS } from '../data/events';

export class EventEngine {
  private events: StoryEvent[];
  /** Events whose triggers have been checked this session (prevent re-firing) */
  private firedFlags: Set<string>;

  constructor() {
    this.events = [...EVENTS];
    this.firedFlags = new Set();
  }

  /** Find the first event whose trigger conditions are met */
  getNextEvent(state: GameState): StoryEvent | null {
    // Don't fire events if we're in combat or have an active event
    if (state.ui.combatState || state.ui.currentEvent) return null;
    if (!state.eventsEnabled) return null;

    for (const event of this.events) {
      // Skip already-fired chain events
      if (state.flags[`event_${event.id}_done`]) continue;
      if (this.firedFlags.has(`event_${event.id}_fired`)) continue;

      if (this.checkTrigger(event.trigger, state)) {
        return event;
      }
    }

    return null;
  }

  /** Mark an event as fired (so it doesn't fire again) */
  markFired(eventId: string): void {
    this.firedFlags.add(`event_${eventId}_fired`);
  }

  /** Get the event ID for a specific chain stage */
  private getChainEventId(chainId: string, stage: number): string {
    // Find the event with matching chain and stage
    const found = this.events.find(e => e.chainId === chainId && e.chainStage === stage);
    return found?.id ?? `${chainId}_stage_${stage}`;
  }

  /** Check a single trigger against game state */
  private checkTrigger(trigger: EventTrigger, state: GameState): boolean {
    switch (trigger.type) {
      case 'location':
        return state.world.currentNodeId === trigger.locationId;

      case 'tier':
        return state.player.tier >= trigger.min;

      case 'flag':
        return !!state.flags[trigger.flag];

      case 'shenThreshold':
        return state.player.shen >= trigger.min;

      case 'chain':
        // A chain event triggers when the previous event in the chain has been resolved
        // or (for stage 1) when no events in this chain have fired yet
        const chainPrevEventId = this.getChainEventId(trigger.chainId, trigger.stage - 1);
        const chainCurrentEventId = this.getChainEventId(trigger.chainId, trigger.stage);
        if (trigger.stage === 1) {
          return !state.flags[`event_${chainCurrentEventId}_done`];
        }
        return !!state.flags[`event_${chainPrevEventId}_done`] && !state.flags[`event_${chainCurrentEventId}_done`];

      case 'travel':
        // Travel events fire when player is actively traveling
        return !!state.world.travelState;

      default:
        return false;
    }
  }
}
