import { defineStore } from 'pinia';
import { Event, FilmEvent, FilmEventType } from '@/types/film-collection';
import { supabase } from '@/api/supabase';
import {
  getEvents,
  createFilmEvent,
  updateEvent,
  deleteEvent,
  addExistingEventToFilm,
  editFilmsOnEvent,
  createEventWithoutFilm,
  editEventCameras,
  getEventTypes,
  getFilmEventAssociations,
} from '@/api/film-collection';

// Define a type for film-event associations with quantity
export interface FilmEventAssociation {
  film_entry_id: number;
  event_id: number;
  quantity?: number;
}

export const useEventsStore = defineStore('events', {
  state: () => ({
    events: [] as FilmEvent[],
    filmEventAssociations: [] as FilmEventAssociation[],
    eventTypes: [] as FilmEventType[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getEventById: (state) => (id: number) => {
      return state.events.find((event) => event.id === id);
    },

    getEventsByFilmId: (state) => (filmId: number) => {
      return state.events.filter((event) => event.film_ids.includes(filmId));
    },

    getFilmEventAssociation: (state) => (filmId: number, eventId: number) => {
      return state.filmEventAssociations.find(
        (assoc) => assoc.film_entry_id === filmId && assoc.event_id === eventId
      );
    },

    uniqueEventTypeNames: (state) => {
      return [...state.eventTypes.map(et => et.name)].sort();
    },

    getEventTypeById: (state) => (eventTypeId: number) => {
      return state.eventTypes.find(et => et.id === eventTypeId);
    },

    getEventTypeName: (state) => (eventTypeId: number) => {
      const eventType = state.eventTypes.find(et => et.id === eventTypeId);
      return eventType ? eventType.name : 'Unknown';
    },

    shouldSubtractQuantity: (state) => (eventTypeId: number) => {
      const eventType = state.eventTypes.find(et => et.id === eventTypeId);
      return eventType ? eventType.subtract_quantity : false;
    },

    uniqueLocations: (state) => {
      return Array.from(new Set(state.events.map((event) => event.location)))
        .filter(Boolean)
        .sort();
    },

    sortedEvents: (state) => {
      return [...state.events].sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return b.date.getTime() - a.date.getTime();
      });
    },
  },

  actions: {
    async fetchEvents() {
      this.loading = true;
      this.error = null;
      try {
        console.log("Events store: Fetching event types...");
        // Fetch event types first
        this.eventTypes = await getEventTypes();
        console.log("Events store: Event types loaded:", this.eventTypes);

        // Then fetch events
        console.log("Events store: Fetching events...");
        this.events = await getEvents();
        console.log("Events store: Events loaded:", this.events);

        // Fetch film-event associations with quantities
        console.log("Events store: Fetching film-event associations...");
        this.filmEventAssociations = await getFilmEventAssociations();
        console.log("Events store: Film-event associations loaded:", this.filmEventAssociations);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error fetching events:', error);
      } finally {
        this.loading = false;
      }
    },

    async createEvent(
      event: Omit<Event, 'id'> & { quantity?: number },
      filmIds: number[] = [],
      cameraIds: number[] = []
    ) {
      this.loading = true;
      this.error = null;
      try {
        // Extract quantity from event object if present
        const { quantity, ...eventData } = event;
        let newEvent: Event;

        if (filmIds.length > 0) {
          // Create event with film associations
          newEvent = await createFilmEvent(filmIds[0], eventData, quantity);

          // Create additional associations if more films are selected
          for (let i = 1; i < filmIds.length; i++) {
            await addExistingEventToFilm(filmIds[i], newEvent.id, quantity);
          }
        } else {
          // Create event without any film associations
          newEvent = await createEventWithoutFilm(eventData);
        }

        // Add cameras if provided
        if (cameraIds.length > 0) {
          await editEventCameras(newEvent.id, cameraIds);
        }

        // Add to local state
        const filmEvent: FilmEvent = {
          ...newEvent,
          date: new Date(newEvent.date),
          film_ids: filmIds,
          camera_ids: cameraIds,
        };

        this.events.push(filmEvent);

        // Add film-event associations with quantity if provided
        filmIds.forEach(filmId => {
          this.filmEventAssociations.push({
            film_entry_id: filmId,
            event_id: newEvent.id,
            quantity: quantity // Use the quantity from the event
          });
        });

        return filmEvent;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error creating event:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateEvent(eventId: number, eventData: Omit<Event, 'id'>) {
      this.loading = true;
      this.error = null;
      try {
        await updateEvent(eventId, eventData);

        // Update local state
        const index = this.events.findIndex((e) => e.id === eventId);
        if (index !== -1) {
          this.events[index] = {
            ...this.events[index],
            ...eventData,
            date: new Date(eventData.date),
          };
        }

        return this.events[index];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error updating event:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteEvent(eventId: number) {
      this.loading = true;
      this.error = null;
      try {
        await deleteEvent(eventId);

        // Remove from local state
        this.events = this.events.filter((e) => e.id !== eventId);

        // Remove film-event associations
        this.filmEventAssociations = this.filmEventAssociations.filter(
          (assoc) => assoc.event_id !== eventId
        );

        return true;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error deleting event:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async addFilmToEvent(filmId: number, eventId: number, quantity?: number) {
      this.loading = true;
      this.error = null;
      try {
        await addExistingEventToFilm(filmId, eventId, quantity);

        // Update local state
        const eventIndex = this.events.findIndex((e) => e.id === eventId);
        if (eventIndex !== -1 && !this.events[eventIndex].film_ids.includes(filmId)) {
          this.events[eventIndex].film_ids.push(filmId);
        }

        // Add film-event association with quantity if provided
        this.filmEventAssociations.push({
          film_entry_id: filmId,
          event_id: eventId,
          quantity
        });

        return true;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error adding film to event:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async removeFilmFromEvent(filmId: number, eventId: number) {
      this.loading = true;
      this.error = null;
      try {
        // This would require a new API endpoint
        // For now, we'll use editFilmsOnEvent with the film removed
        const event = this.getEventById(eventId);
        if (!event) throw new Error('Event not found');

        const updatedFilmIds = event.film_ids.filter(id => id !== filmId);
        await editFilmsOnEvent(eventId, updatedFilmIds);

        // Update local state
        const eventIndex = this.events.findIndex((e) => e.id === eventId);
        if (eventIndex !== -1) {
          this.events[eventIndex].film_ids = this.events[eventIndex].film_ids.filter(
            (id) => id !== filmId
          );
        }

        // Remove film-event association
        this.filmEventAssociations = this.filmEventAssociations.filter(
          (assoc) => !(assoc.film_entry_id === filmId && assoc.event_id === eventId)
        );

        return true;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error removing film from event:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateFilmsOnEvent(eventId: number, filmIds: number[]) {
      this.loading = true;
      this.error = null;
      try {
        await editFilmsOnEvent(eventId, filmIds);

        // Update local state
        const eventIndex = this.events.findIndex((e) => e.id === eventId);
        if (eventIndex !== -1) {
          this.events[eventIndex].film_ids = filmIds;
        }

        // Update film-event associations
        // First, remove all associations for this event
        this.filmEventAssociations = this.filmEventAssociations.filter(
          (assoc) => assoc.event_id !== eventId
        );

        // Then add new associations
        filmIds.forEach(filmId => {
          this.filmEventAssociations.push({
            film_entry_id: filmId,
            event_id: eventId,
            quantity: undefined // We don't have this data yet
          });
        });

        return true;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error updating films on event:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateEventCameras(eventId: number, cameraIds: number[]) {
      this.loading = true;
      this.error = null;
      try {
        await editEventCameras(eventId, cameraIds);

        // Update local state
        const eventIndex = this.events.findIndex((e) => e.id === eventId);
        if (eventIndex !== -1) {
          this.events[eventIndex].camera_ids = cameraIds;
        }

        return true;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error updating event cameras:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Update the quantity for a specific film-event association
    async updateFilmEventQuantity(filmId: number, eventId: number, quantity: number) {
      this.loading = true;
      this.error = null;
      try {
        // Update in the database
        const { error } = await supabase
          .schema("film_collection")
          .from("film_entry_events")
          .update({ quantity })
          .eq("film_entry_id", filmId)
          .eq("event_id", eventId);

        if (error) throw error;

        // Update local state
        const associationIndex = this.filmEventAssociations.findIndex(
          (assoc) => assoc.film_entry_id === filmId && assoc.event_id === eventId
        );

        if (associationIndex !== -1) {
          this.filmEventAssociations[associationIndex].quantity = quantity;
        }

        return true;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error updating film event quantity:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Helper method for films store
    removeFilmFromEvents(filmId: number) {
      // Update local state to remove the film from all events
      this.events.forEach((event, index) => {
        if (event.film_ids.includes(filmId)) {
          this.events[index].film_ids = event.film_ids.filter((id) => id !== filmId);
        }
      });

      // Remove film-event associations
      this.filmEventAssociations = this.filmEventAssociations.filter(
        (assoc) => assoc.film_entry_id !== filmId
      );
    }
  },
});
