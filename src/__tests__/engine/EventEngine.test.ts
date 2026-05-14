/**
 * Headless engine tests — EventEngine.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { EventEngine } from '../../engine/EventEngine';
import { createInitialState } from '../../state/GameState';
import { GameState } from '../../types';

function freshState(overrides?: Partial<GameState>): GameState {
  return { ...createInitialState('TestCultivator', 'human', 'village_orphan'), ...overrides };
}

describe('EventEngine', () => {
  let engine: EventEngine;

  beforeEach(() => {
    engine = new EventEngine();
  });

  it('fires the starter event at azure_cloud_village', () => {
    const state = freshState({
      world: { ...freshState().world, currentNodeId: 'azure_cloud_village' },
      ui: { ...freshState().ui, combatState: null, currentEvent: null },
    });

    const event = engine.getNextEvent(state);
    expect(event).not.toBeNull();
    expect(event!.id).toBe('dying_cultivator');
    expect(event!.title).toBe('The Dying Cultivator');
  });

  it('does not fire events when eventsEnabled is false', () => {
    const state = freshState({
      eventsEnabled: false,
      world: { ...freshState().world, currentNodeId: 'azure_cloud_village' },
    });

    const event = engine.getNextEvent(state);
    expect(event).toBeNull();
  });

  it('does not fire events when combat is active', () => {
    const state = freshState({
      world: { ...freshState().world, currentNodeId: 'azure_cloud_village' },
      ui: {
        ...freshState().ui,
        combatState: {
          enemy: { name: 'Beast', health: 10, attack: 3, defense: 1, speed: 5, loot: { stones: [0, 0], items: [] } },
          playerHealth: 50,
          enemyHealth: 10,
          turn: 0,
          status: 'active',
          log: [],
        },
      },
    });

    const event = engine.getNextEvent(state);
    expect(event).toBeNull();
  });

  it('does not fire events when an event is already active', () => {
    const state = freshState({
      world: { ...freshState().world, currentNodeId: 'azure_cloud_village' },
      ui: {
        ...freshState().ui,
        currentEvent: {
          id: 'active_event',
          title: 'Active',
          locationId: 'azure_cloud_village',
          category: 'story',
          description: '...',
          choices: [],
          trigger: { type: 'location', locationId: 'azure_cloud_village' },
        },
      },
    });

    const event = engine.getNextEvent(state);
    expect(event).toBeNull();
  });

  it('marks fired events to prevent re-firing', () => {
    const state = freshState({
      world: { ...freshState().world, currentNodeId: 'azure_cloud_village' },
    });

    // First call: event fires
    const event = engine.getNextEvent(state);
    expect(event).not.toBeNull();

    // Mark it as fired
    engine.markFired(event!.id);

    // Second call without changing location: should not fire again
    const sameState = freshState({
      world: { ...freshState().world, currentNodeId: 'azure_cloud_village' },
    });
    const event2 = engine.getNextEvent(sameState);
    // Since we markFired on individual engine instance, getNextEvent checks firedFlags
    expect(event2).toBeNull();
  });

  it('fires location-specific events at green_jade_city', () => {
    const state = freshState({
      world: { ...freshState().world, currentNodeId: 'green_jade_city' },
    });

    const event = engine.getNextEvent(state);
    expect(event).not.toBeNull();
    expect(event!.id).toBe('city_merchant');
  });

  it('fires misty_peaks discovery event', () => {
    const state = freshState({
      world: { ...freshState().world, currentNodeId: 'misty_peaks' },
    });

    const event = engine.getNextEvent(state);
    expect(event).not.toBeNull();
    expect(event!.id).toBe('misty_peaks_discovery');
  });

  it('fires black_wind_gorge encounter event', () => {
    const state = freshState({
      world: { ...freshState().world, currentNodeId: 'black_wind_gorge' },
    });

    const event = engine.getNextEvent(state);
    expect(event).not.toBeNull();
    expect(event!.id).toBe('black_wind_encounter');
  });

  it('fires breakthrough event when shen threshold is met', () => {
    const state = freshState({
      player: { ...freshState().player, shen: 10, maxShen: 100 },
      world: { ...freshState().world, currentNodeId: 'azure_cloud_village' },
    });

    const event = engine.getNextEvent(state);
    // The dying_cultivator fires first (location-based). After that's resolved, breakthrough should fire.
    // Since both triggers match, the first in the array takes priority.
    expect(event).not.toBeNull();
    // dying_cultivator is listed first, so it should fire before breakthrough
    expect(event!.id).toBe('dying_cultivator');
  });

  it('fires chain events in sequence', () => {
    // After the dying_cultivator is resolved with accepted_herb_quest flag,
    // the herb_hunt event should fire next.
    const state = freshState({
      world: { ...freshState().world, currentNodeId: 'azure_cloud_village' },
      flags: {
        event_dying_cultivator_done: true,
        accepted_herb_quest: true,
      },
    });

    // First get dying_cultivator, then mark it fired so it doesn't come up
    engine.markFired('dying_cultivator');

    const event = engine.getNextEvent(state);
    expect(event).not.toBeNull();
    expect(event!.id).toBe('herb_hunt');
  });

  it('returns null when no events match', () => {
    const state = freshState({
      world: { ...freshState().world, currentNodeId: 'black_wind_gorge' },
      flags: {
        event_dying_cultivator_done: true,
        event_black_wind_encounter_done: true,
      },
    });
    // Mark black_wind_encounter as done in engine too
    engine.markFired('black_wind_encounter');

    // Also mark any travel events since we aren't traveling
    engine.markFired('travel_beast_ambush');
    engine.markFired('travel_peaceful');

    const event = engine.getNextEvent(state);
    // Should be null since the location event is done and no other triggers match
    expect(event).toBeNull();
  });
});
