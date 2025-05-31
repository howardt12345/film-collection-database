import { computed } from 'vue';
import { useFilmsStore } from '@/stores/films';
import { useEventsStore } from '@/stores/events';
import { FilmEntry, Event } from '@/types/film-collection';

export function useFilmEvents() {
  const filmsStore = useFilmsStore();
  const eventsStore = useEventsStore();

  /**
   * Get all events for a specific film
   */
  const getFilmEvents = (filmId: number) => {
    return eventsStore.getEventsByFilmId(filmId);
  };

  /**
   * Calculate the remaining quantity of a film based on events
   */
  const calculateRemainingQuantity = (filmId: number): number => {
    const film = filmsStore.getFilmById(filmId);
    if (!film) return 0;

    // Get all events for this film
    const events = getFilmEvents(filmId);

    // Start with the base quantity
    let quantity = film.quantity;

    // Adjust based on events with quantities
    events.forEach(event => {
      const association = eventsStore.getFilmEventAssociation(filmId, event.id);
      if (association && association.quantity) {
        // If this is an acquisition event, add the quantity
        if (!eventsStore.shouldSubtractQuantity(event.event_type) && association.quantity) {
          quantity += association.quantity;
        }
        // If this is a usage event, subtract the quantity
        else if (eventsStore.shouldSubtractQuantity(event.event_type) && association.quantity) {
          quantity -= association.quantity;
        }
      }
    });

    return Math.max(0, quantity);
  };

  /**
   * Calculate the used quantity of a film based on events
   */
  const calculateUsedQuantity = (filmId: number): number => {
    const film = filmsStore.getFilmById(filmId);
    if (!film) return 0;

    // Get all events for this film
    const events = getFilmEvents(filmId);

    // Calculate used quantity from usage events
    let usedQuantity = 0;
    events.forEach(event => {
      const association = eventsStore.getFilmEventAssociation(filmId, event.id);
      if (association && association.quantity) {
        if (eventsStore.shouldSubtractQuantity(event.event_type) && association.quantity) {
          usedQuantity += association.quantity;
        }
      }
    });

    return usedQuantity;
  };

  /**
   * Calculate the total quantity of a film based on acquisition events
   */
  const calculateTotalQuantity = (filmId: number): number => {
    const film = filmsStore.getFilmById(filmId);
    if (!film) return 0;

    // Get all events for this film
    const events = getFilmEvents(filmId);

    // Start with the base quantity
    let totalQuantity = film.quantity;

    // Add quantities from acquisition events
    events.forEach(event => {
      const association = eventsStore.getFilmEventAssociation(filmId, event.id);
      if (association && association.quantity) {
        if (!eventsStore.shouldSubtractQuantity(event.event_type) && association.quantity) {
          totalQuantity += association.quantity;
        }
      }
    });

    return totalQuantity;
  };

  /**
   * Get the latest event for a film
   */
  const getLatestEvent = (filmId: number): Event | null => {
    const events = getFilmEvents(filmId);
    if (!events.length) return null;

    // Sort events by date (newest first)
    const sortedEvents = [...events].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );

    return sortedEvents[0];
  };

  /**
   * Check if a film is currently frozen
   */
  const isFilmFrozen = (filmId: number): boolean => {
    const events = getFilmEvents(filmId);
    if (!events.length) return false;

    // Sort events by date (newest first)
    const sortedEvents = [...events].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );

    // Check if the most recent freeze/thaw event is a freeze
    for (const event of sortedEvents) {
      if (event.event_type.toLowerCase() === 'frozen') {
        return true;
      }
      if (event.event_type.toLowerCase() === 'thawed') {
        return false;
      }
    }

    return false;
  };

  /**
   * Get the date when a film was frozen (if it is currently frozen)
   */
  const getFilmFrozenDate = (filmId: number): Date | null => {
    if (!isFilmFrozen(filmId)) return null;

    const events = getFilmEvents(filmId);

    // Sort events by date (newest first)
    const sortedEvents = [...events].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );

    // Find the most recent freeze event
    for (const event of sortedEvents) {
      if (event.event_type.toLowerCase() === 'frozen') {
        return event.date;
      }
    }

    return null;
  };

  return {
    getFilmEvents,
    calculateRemainingQuantity,
    calculateUsedQuantity,
    calculateTotalQuantity,
    getLatestEvent,
    isFilmFrozen,
    getFilmFrozenDate,
  };
}
