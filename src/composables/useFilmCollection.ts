import { ref, computed } from "vue";
import { FilmEntry } from "@/types/film-collection";
import {
  getFilmCollections,
  createFilmCollection,
  updateFilmCollection,
  deleteFilmCollection,
} from "@/api/film-collection";
import { useErrorHandling } from "./useErrorHandling";
import { useLoadingState } from "./useLoadingState";

export function useFilmCollection() {
  const { handleAsyncOperation } = useErrorHandling();
  const { withLoading, isLoading } = useLoadingState();

  const films = ref<FilmEntry[]>([]);

  // Computed unique values for form suggestions
  const uniqueNames = computed(() => {
    const nameFrequency = films.value.reduce(
      (acc: Record<string, number>, film) => {
        acc[film.name] = (acc[film.name] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    return Object.keys(nameFrequency).sort(
      (a, b) => nameFrequency[b] - nameFrequency[a],
    );
  });

  const uniqueBrands = computed(() => {
    const brandFrequency = films.value.reduce(
      (acc: Record<string, number>, film) => {
        acc[film.brand] = (acc[film.brand] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    return Object.keys(brandFrequency).sort(
      (a, b) => brandFrequency[b] - brandFrequency[a],
    );
  });

  const uniqueSources = computed(() => {
    const sourceFrequency = films.value
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
  });

  // Actions
  const loadFilms = async (): Promise<boolean> => {
    const result = await handleAsyncOperation(
      () => withLoading("loadFilms", () => getFilmCollections()),
      { errorMessage: "Failed to load film collection" },
    );

    if (result) {
      films.value = result;
      return true;
    }
    return false;
  };

  const createFilm = async (newFilm: FilmEntry): Promise<FilmEntry | null> => {
    const result = await handleAsyncOperation(
      () => withLoading("createFilm", () => createFilmCollection(newFilm)),
      {
        successMessage: "Film added successfully",
        errorMessage: "Failed to create film",
      },
    );

    if (result) {
      const filmWithEvent: FilmEntry = {
        ...result,
        created_at: new Date(result.created_at),
        date_acquired: new Date(result.date_acquired),
        latest_event: undefined,
        used: result.used || 0,
        quantity: result.quantity || 1,
      };

      films.value.unshift(filmWithEvent);
      return filmWithEvent;
    }
    return null;
  };

  const updateFilm = async (
    filmId: number,
    updates: Partial<FilmEntry>,
  ): Promise<boolean> => {
    const result = await handleAsyncOperation(
      () =>
        withLoading("updateFilm", () => updateFilmCollection(filmId, updates)),
      {
        successMessage: "Film updated successfully",
        errorMessage: "Failed to update film",
      },
    );

    if (result) {
      const index = films.value.findIndex((f) => f.id === filmId);
      if (index !== -1) {
        films.value[index] = { ...films.value[index], ...updates };
      }
      return true;
    }
    return false;
  };

  const deleteFilm = async (filmId: number): Promise<boolean> => {
    const result = await handleAsyncOperation(
      () => withLoading("deleteFilm", () => deleteFilmCollection(filmId)),
      {
        successMessage: "Film deleted successfully",
        errorMessage: "Failed to delete film",
      },
    );

    if (result !== null) {
      films.value = films.value.filter((f) => f.id !== filmId);
      return true;
    }
    return false;
  };

  const updateUsed = async (filmId: number, used: number): Promise<boolean> => {
    const film = films.value.find((f) => f.id === filmId);
    if (!film) return false;

    // Optimistic update
    const previousUsed = film.used;
    film.used = used;

    const success = await updateFilm(filmId, { used });

    // Rollback on failure
    if (!success) {
      film.used = previousUsed;
    }

    return success;
  };

  const getFilmById = (filmId: number): FilmEntry | undefined => {
    return films.value.find((f) => f.id === filmId);
  };

  return {
    // State
    films,
    uniqueNames,
    uniqueBrands,
    uniqueSources,

    // Loading states
    isLoadingFilms: computed(() => isLoading("loadFilms")),
    isCreatingFilm: computed(() => isLoading("createFilm")),
    isUpdatingFilm: computed(() => isLoading("updateFilm")),
    isDeletingFilm: computed(() => isLoading("deleteFilm")),

    // Actions
    loadFilms,
    createFilm,
    updateFilm,
    deleteFilm,
    updateUsed,
    getFilmById,
  };
}
