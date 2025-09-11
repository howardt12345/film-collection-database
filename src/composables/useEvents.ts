import { ref, computed } from "vue";
import { FilmEvent, Event } from "@/types/film-collection";
import {
  getEvents,
  createFilmEvent,
  updateEvent,
  deleteFilmEvent,
  addExistingEventToFilm,
  editFilmsOnEvent,
  deleteEvent,
  createEventWithoutFilm,
  editEventCameras,
} from "@/api/film-collection";
import { useErrorHandling } from "./useErrorHandling";
import { useLoadingState } from "./useLoadingState";

export function useEvents() {
  const { handleAsyncOperation } = useErrorHandling();
  const { withLoading, isLoading } = useLoadingState();

  const filmEvents = ref<FilmEvent[]>([]);
  const eventsByFilm = ref<Record<number, Event[]>>({});

  // Computed unique values
  const uniqueEvents = computed(() =>
    Array.from(new Set(filmEvents.value.map((event) => event.event_type)))
      .filter(Boolean)
      .sort(),
  );

  const uniqueLocations = computed(() =>
    Array.from(new Set(filmEvents.value.map((event) => event.location)))
      .filter(Boolean)
      .sort(),
  );

  // Actions
  const loadEvents = async (): Promise<boolean> => {
    const result = await handleAsyncOperation(
      () => withLoading("loadEvents", () => getEvents()),
      { errorMessage: "Failed to load events" },
    );

    if (result) {
      filmEvents.value = result;

      // Populate eventsByFilm from filmEvents
      eventsByFilm.value = result.reduce(
        (acc, event) => {
          event.film_ids.forEach((filmId) => {
            if (!acc[filmId]) acc[filmId] = [];
            acc[filmId].push({
              id: event.id,
              date: event.date,
              event_type: event.event_type,
              location: event.location,
              notes: event.notes,
            });
          });
          return acc;
        },
        {} as Record<number, Event[]>,
      );

      return true;
    }
    return false;
  };

  const createAndAddEventToFilm = async (
    filmId: number,
    event: Omit<Event, "id">,
  ): Promise<boolean> => {
    const result = await handleAsyncOperation(
      () => withLoading("createEvent", () => createFilmEvent(filmId, event)),
      {
        successMessage: "Event added successfully",
        errorMessage: "Failed to create event",
      },
    );

    if (result) {
      const newEvent = {
        ...result,
        date: new Date(result.date),
      };

      // Update eventsByFilm
      if (!eventsByFilm.value[filmId]) eventsByFilm.value[filmId] = [];
      eventsByFilm.value[filmId].push(newEvent);

      // Update filmEvents
      filmEvents.value.push({
        ...newEvent,
        film_ids: [filmId],
        camera_ids: [],
      });

      return true;
    }
    return false;
  };

  const addExistingEventToFilmAction = async (
    filmId: number,
    eventId: number,
  ): Promise<boolean> => {
    const result = await handleAsyncOperation(
      () =>
        withLoading("addEventToFilm", () =>
          addExistingEventToFilm(filmId, eventId),
        ),
      {
        successMessage: "Event added to film",
        errorMessage: "Failed to add event to film",
      },
    );

    if (result !== null) {
      const event = filmEvents.value.find((e) => e.id === eventId);
      if (event) {
        // Update eventsByFilm
        if (!eventsByFilm.value[filmId]) eventsByFilm.value[filmId] = [];
        eventsByFilm.value[filmId].push({
          id: event.id,
          date: event.date,
          event_type: event.event_type,
          location: event.location,
          notes: event.notes,
        });
        // Update filmEvents
        event.film_ids.push(filmId);
      }
      return true;
    }
    return false;
  };

  const removeEventFromFilm = async (
    filmId: number,
    eventId: number,
  ): Promise<boolean> => {
    const result = await handleAsyncOperation(
      () =>
        withLoading("removeEventFromFilm", () =>
          deleteFilmEvent(filmId, eventId),
        ),
      {
        successMessage: "Event removed from film",
        errorMessage: "Failed to remove event from film",
      },
    );

    if (result !== null) {
      // Update eventsByFilm
      eventsByFilm.value[filmId] =
        eventsByFilm.value[filmId]?.filter((e) => e.id !== eventId) || [];

      // Update filmEvents
      filmEvents.value = filmEvents.value.map((event) => {
        if (event.id === eventId) {
          return {
            ...event,
            film_ids: event.film_ids.filter((id) => id !== filmId),
          };
        }
        return event;
      });

      return true;
    }
    return false;
  };

  const updateEventAction = async (
    eventId: number,
    event: Omit<Event, "id">,
  ): Promise<boolean> => {
    const result = await handleAsyncOperation(
      () => withLoading("updateEvent", () => updateEvent(eventId, event)),
      {
        successMessage: "Event updated successfully",
        errorMessage: "Failed to update event",
      },
    );

    if (result !== null) {
      const updatedEvent = {
        id: eventId,
        ...event,
      };

      // Update eventsByFilm
      Object.keys(eventsByFilm.value).forEach((filmId) => {
        const events = eventsByFilm.value[parseInt(filmId)];
        const index = events.findIndex((e) => e.id === eventId);
        if (index !== -1) {
          events[index] = updatedEvent;
        }
      });

      // Update filmEvents
      const index = filmEvents.value.findIndex((e) => e.id === eventId);
      if (index !== -1) {
        filmEvents.value[index] = {
          ...updatedEvent,
          film_ids: filmEvents.value[index].film_ids,
          camera_ids: filmEvents.value[index].camera_ids,
        };
      }

      return true;
    }
    return false;
  };

  const editFilmsOnEventAction = async (
    eventId: number,
    filmIds: number[],
  ): Promise<boolean> => {
    const result = await handleAsyncOperation(
      () =>
        withLoading("editFilmsOnEvent", () =>
          editFilmsOnEvent(eventId, filmIds),
        ),
      {
        successMessage: "Event films updated",
        errorMessage: "Failed to update event films",
      },
    );

    if (result !== null) {
      const event = filmEvents.value.find((e) => e.id === eventId);
      if (!event) return false;

      // Get removed and added film IDs
      const oldFilmIds = event.film_ids;
      const removedFilmIds = oldFilmIds.filter((id) => !filmIds.includes(id));
      const addedFilmIds = filmIds.filter((id) => !oldFilmIds.includes(id));

      // Update eventsByFilm
      removedFilmIds.forEach((filmId) => {
        eventsByFilm.value[filmId] =
          eventsByFilm.value[filmId]?.filter((e) => e.id !== eventId) || [];
      });

      addedFilmIds.forEach((filmId) => {
        if (!eventsByFilm.value[filmId]) eventsByFilm.value[filmId] = [];
        eventsByFilm.value[filmId].push({
          id: event.id,
          date: event.date,
          event_type: event.event_type,
          location: event.location,
          notes: event.notes,
        });
      });

      // Update filmEvents
      event.film_ids = filmIds;
      return true;
    }
    return false;
  };

  const createEvent = async (
    event: Omit<Event, "id">,
    filmIds: number[],
    cameraIds: number[],
  ): Promise<boolean> => {
    let newEvent: Event;

    const result = await handleAsyncOperation(
      async () => {
        if (filmIds.length > 0) {
          // Create event with film associations
          const createdEvent = await createFilmEvent(filmIds[0], event);

          // Create additional associations if more films are selected
          for (let i = 1; i < filmIds.length; i++) {
            await addExistingEventToFilm(filmIds[i], createdEvent.id);
          }

          newEvent = createdEvent;
        } else {
          // Create event without any film associations
          newEvent = await createEventWithoutFilm(event);
        }

        return newEvent;
      },
      {
        successMessage: "Event created successfully",
        errorMessage: "Failed to create event",
      },
    );

    if (result) {
      // Update filmEvents with the new event
      filmEvents.value.push({
        ...result,
        date: new Date(result.date),
        film_ids: filmIds,
        camera_ids: cameraIds,
      });

      // Update eventsByFilm for each selected film
      if (filmIds.length > 0) {
        filmIds.forEach((filmId) => {
          if (!eventsByFilm.value[filmId]) eventsByFilm.value[filmId] = [];
          eventsByFilm.value[filmId].push({
            id: result.id,
            date: new Date(result.date),
            event_type: result.event_type,
            location: result.location,
            notes: result.notes,
          });
        });
      }

      return true;
    }
    return false;
  };

  const removeEvent = async (eventId: number): Promise<boolean> => {
    const event = filmEvents.value.find((e) => e.id === eventId);
    if (!event) return false;

    const result = await handleAsyncOperation(
      () => withLoading("removeEvent", () => deleteEvent(eventId)),
      {
        successMessage: "Event deleted successfully",
        errorMessage: "Failed to delete event",
      },
    );

    if (result !== null) {
      // Remove from eventsByFilm
      event.film_ids.forEach((filmId) => {
        eventsByFilm.value[filmId] =
          eventsByFilm.value[filmId]?.filter((e) => e.id !== eventId) || [];
      });

      // Remove from filmEvents
      filmEvents.value = filmEvents.value.filter((e) => e.id !== eventId);
      return true;
    }
    return false;
  };

  const updateEventCameras = async (
    eventId: number,
    cameraIds: number[],
  ): Promise<boolean> => {
    const result = await handleAsyncOperation(
      () =>
        withLoading("updateEventCameras", () =>
          editEventCameras(eventId, cameraIds),
        ),
      {
        successMessage: "Event cameras updated",
        errorMessage: "Failed to update event cameras",
      },
    );

    if (result !== null) {
      const index = filmEvents.value.findIndex((e) => e.id === eventId);
      if (index !== -1) {
        filmEvents.value[index].camera_ids = cameraIds;
      }
      return true;
    }
    return false;
  };

  const getEventsForFilm = (filmId: number): Event[] => {
    return eventsByFilm.value[filmId] || [];
  };

  return {
    // State
    filmEvents,
    eventsByFilm,
    uniqueEvents,
    uniqueLocations,

    // Loading states
    isLoadingEvents: computed(() => isLoading("loadEvents")),
    isCreatingEvent: computed(() => isLoading("createEvent")),
    isUpdatingEvent: computed(() => isLoading("updateEvent")),

    // Actions
    loadEvents,
    createAndAddEventToFilm,
    addExistingEventToFilmAction,
    removeEventFromFilm,
    updateEventAction,
    editFilmsOnEventAction,
    createEvent,
    removeEvent,
    updateEventCameras,
    getEventsForFilm,
  };
}
