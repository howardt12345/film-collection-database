import { defineStore } from 'pinia';
import { FilmEntry, Event } from '@/types/film-collection';
import {
  getFilmCollections,
  createFilmCollection,
  updateFilmCollection,
  deleteFilmCollection,
  createFilmEvent,
} from '@/api/film-collection';
import { useEventsStore } from './events';

export const useFilmsStore = defineStore('films', {
  state: () => ({
    films: [] as FilmEntry[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getFilmById: (state) => (id: number) => {
      return state.films.find((film) => film.id === id);
    },

    uniqueNames: (state) => {
      const nameFrequency = state.films.reduce(
        (acc: Record<string, number>, film) => {
          acc[film.name] = (acc[film.name] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );
      return Object.keys(nameFrequency).sort(
        (a, b) => nameFrequency[b] - nameFrequency[a],
      );
    },

    uniqueBrands: (state) => {
      const brandFrequency = state.films.reduce(
        (acc: Record<string, number>, film) => {
          acc[film.brand] = (acc[film.brand] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );
      return Object.keys(brandFrequency).sort(
        (a, b) => brandFrequency[b] - brandFrequency[a],
      );
    },

    uniqueSources: (state) => {
      const sourceFrequency = state.films
        .filter((film) => film.source)
        .reduce(
          (acc: Record<string, number>, film) => {
            acc[film.source] = (acc[film.source] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );
      return Object.keys(sourceFrequency).sort(
        (a, b) => sourceFrequency[b] - sourceFrequency[a],
      );
    },

    filteredFilms: (state) => (search: string) => {
      if (!search) return state.films;

      const searchTerms = search.trim().toLowerCase().split(' ');

      return state.films.filter((film) => {
        const attributes = [
          film.name.toLowerCase(),
          film.brand.toLowerCase(),
          `${film.brand} ${film.name}`.toLowerCase(),
          film.date_acquired.toISOString().toLowerCase(),
          film.film_format.toLowerCase(),
          film.film_type.toLowerCase(),
          `ISO ${film.iso}`.toLowerCase(),
        ];

        return searchTerms.every((term) =>
          attributes.some((attribute) => attribute.includes(term)),
        );
      });
    }
  },

  actions: {
    async fetchFilms() {
      this.loading = true;
      this.error = null;
      try {
        this.films = await getFilmCollections();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error fetching films:', error);
      } finally {
        this.loading = false;
      }
    },

    async createFilm(newFilm: Omit<FilmEntry, 'id' | 'created_at' | 'date_frozen'>) {
      this.loading = true;
      this.error = null;
      try {
        const data = await createFilmCollection(newFilm);

        // Create the "Acquired" event
        await createFilmEvent(data.id, {
          date: newFilm.date_acquired,
          event_type: 'Acquired',
          location: newFilm.source || '',
          notes: '',
        });

        // Refresh films to get the latest data with events
        await this.fetchFilms();

        return data;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error creating film:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateFilm(id: number, updatedData: Partial<FilmEntry>) {
      this.loading = true;
      this.error = null;
      try {
        const data = await updateFilmCollection(id, updatedData);

        // Update the film in the local state
        const index = this.films.findIndex((f) => f.id === id);
        if (index !== -1) {
          this.films[index] = { ...this.films[index], ...data };
        }

        return data;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error updating film:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteFilm(id: number) {
      this.loading = true;
      this.error = null;
      try {
        await deleteFilmCollection(id);

        // Remove the film from the local state
        this.films = this.films.filter((f) => f.id !== id);

        // Also update events store to remove this film from events
        const eventsStore = useEventsStore();
        eventsStore.removeFilmFromEvents(id);

        return true;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error deleting film:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateUsed(filmId: number, used: number) {
      return this.updateFilm(filmId, { used });
    },

    // Calculate film quantity based on events
    calculateFilmQuantity(filmId: number): number {
      const eventsStore = useEventsStore();
      const events = eventsStore.getEventsByFilmId(filmId);

      // Get the film
      const film = this.getFilmById(filmId);
      if (!film) return 0;

      // Start with the base quantity from the film entry
      let quantity = film.quantity;

      // Adjust based on events with quantities
      events.forEach(event => {
        const filmEventAssociation = eventsStore.getFilmEventAssociation(filmId, event.id);
        if (filmEventAssociation && filmEventAssociation.quantity) {
          // If this is an acquisition event, add the quantity
          if (event.event_type.toLowerCase() === 'acquired') {
            quantity += filmEventAssociation.quantity;
          }
          // If this is a usage event, subtract the quantity
          else if (['used', 'developed', 'processed'].includes(event.event_type.toLowerCase())) {
            quantity -= filmEventAssociation.quantity;
          }
        }
      });

      return Math.max(0, quantity);
    }
  },
});
