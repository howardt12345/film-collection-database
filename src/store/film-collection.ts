import {
  getCameras,
  getEventCameraMap,
  getEventFilmMap,
  getEventQuantityMap,
  getEvents,
  getFilmEntries,
  getFilmEventMap,
  createFilmCollection,
  updateFilmCollection,
  deleteFilmCollection,
  createFilmEvent as apiCreateFilmEvent,
  updateEvent as apiUpdateEvent,
  deleteFilmEvent as apiDeleteFilmEvent,
  addExistingEventToFilm as apiAddExistingEventToFilm,
  editFilmsOnEvent as apiEditFilmsOnEvent,
  deleteEvent as apiDeleteEvent,
  createEventWithoutFilm,
  createCamera as apiCreateCamera,
  updateCamera as apiUpdateCamera,
  deleteCamera as apiDeleteCamera,
  addCameraToEvent as apiAddCameraToEvent,
  removeCameraFromEvent as apiRemoveCameraFromEvent,
  editEventCameras as apiEditEventCameras,
} from "@/api/film-collection";
import { Camera, Event, Film, FilmEntry } from "@/types/film-collection";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useFilmCollectionStore = defineStore("filmCollection", () => {
  // Refs for state
  const filmsMap = ref<Map<number, Film>>(new Map());
  const eventsMap = ref<Map<number, Event>>(new Map());
  const camerasMap = ref<Map<number, Camera>>(new Map());
  const eventFilmsMap = ref<Map<number, number[]>>(new Map()); // event_id : film_ids
  const filmEventsMap = ref<Map<number, number[]>>(new Map()); // film_id : event_ids
  const eventCamerasMap = ref<Map<number, number[]>>(new Map()); // event_id : camera_ids
  const eventQuantityMap = ref<Map<number, number>>(new Map()); // event_id : quantity

  // Getters
  const filmsList = computed(() => Array.from(filmsMap.value.values()));
  const eventsList = computed(() => Array.from(eventsMap.value.values()));
  const camerasList = computed(() => Array.from(camerasMap.value.values()));

  // Computed events with associated films and cameras
  const filmEvents = computed(() =>
    eventsList.value.map(event => ({
      ...event,
      film_ids: eventFilmsMap.value.get(event.id) || [],
      camera_ids: eventCamerasMap.value.get(event.id) || []
    }))
  );


  const getEventsForFilm = (filmId: number) => {
    const eventIds = filmEventsMap.value.get(filmId) || [];
    return eventIds
      .map((eventId) => eventsMap.value.get(eventId))
      .filter((event): event is Event => event !== undefined)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const getLatestEventForFilm = (filmId: number) => {
    const events = getEventsForFilm(filmId);
    return events[0];
  };

  const getLatestFrozenDateForFilm = (filmId: number): Date | undefined => {
    const filmEvents = getEventsForFilm(filmId);
    const frozenEvents = filmEvents.filter(
      (event) => event.event_type.toLowerCase() === "frozen",
    );
    if (frozenEvents.length === 0) return undefined;
    return frozenEvents.reduce((latest, event) =>
      event.date > latest.date ? event : latest,
    ).date;
  };

  const filmCollections = computed<FilmEntry[]>(() => {
    return filmsList.value.map((film) => ({
      ...film,
      latest_event: getLatestEventForFilm(film.id),
      date_frozen: getLatestFrozenDateForFilm(film.id),
    }));
  });

  const eventsByFilm = computed(() => {
    const result: Record<number, Event[]> = {};
    filmCollections.value.forEach((film) => {
      const eventIds = filmEventsMap.value.get(film.id) || [];
      result[film.id] = eventIds
        .map((eventId) => eventsMap.value.get(eventId))
        .filter((event): event is Event => event !== undefined)
        .sort((a, b) => b.date.getTime() - a.date.getTime());
    });
    return result;
  });

  // Additional computed properties
  const uniqueEvents = computed(() => {
    const events = new Set(eventsList.value.map((event) => event.event_type));
    return Array.from(events);
  });

  const uniqueLocations = computed(() => {
    const locations = new Set(
      eventsList.value
        .map((event) => event.location)
        .filter((location) => location && location.trim() !== "")
    );
    return Array.from(locations);
  });

  const uniqueNames = computed(() => {
    const nameFrequency = filmCollections.value.reduce(
      (acc: Record<string, number>, film) => {
        acc[film.name] = (acc[film.name] || 0) + 1;
        return acc;
      },
      {},
    );
    return Object.entries(nameFrequency)
      .filter(([_, count]) => count > 1)
      .map(([name]) => name);
  });

  const uniqueBrands = computed(() => {
    const brandFrequency = filmCollections.value.reduce(
      (acc: Record<string, number>, film) => {
        acc[film.brand] = (acc[film.brand] || 0) + 1;
        return acc;
      },
      {},
    );
    return Object.entries(brandFrequency)
      .filter(([_, count]) => count > 1)
      .map(([brand]) => brand);
  });

  const uniqueSources = computed(() => {
    const sourceFrequency = filmCollections.value
      .filter((film) => film.source)
      .reduce(
        (acc: Record<string, number>, film) => {
          acc[film.source] = (acc[film.source] || 0) + 1;
          return acc;
        },
        {},
      );
    return Object.entries(sourceFrequency)
      .filter(([_, count]) => count > 1)
      .map(([source]) => source);
  });

  const uniqueCameraBrands = computed(() => {
    const brands = new Set(camerasList.value.map((camera) => camera.brand));
    return Array.from(brands);
  });

  // Actions
  const initialize = async (): Promise<void> => {
    try {
      // Clear existing data
      filmsMap.value.clear();
      eventsMap.value.clear();
      camerasMap.value.clear();
      eventFilmsMap.value.clear();
      filmEventsMap.value.clear();
      eventCamerasMap.value.clear();
      eventQuantityMap.value.clear();

      const [
        films,
        events,
        eventFilmMapResult,
        filmEventMapResult,
        eventQuantityMapResult,
        eventCameraMapResult,
        cameras,
      ] = await Promise.all([
        getFilmEntries(),
        getEvents(),
        getEventFilmMap(),
        getFilmEventMap(),
        getEventQuantityMap(),
        getEventCameraMap(),
        getCameras(),
      ]);

      if (!films?.length && !events?.length && !cameras?.length) {
        console.warn('No data returned from API');
        return;
      }

      // Set films
      films?.forEach(film => {
        if (film?.id) filmsMap.value.set(film.id, film);
      });

      // Set events with film_ids and camera_ids
      events?.forEach(event => {
        if (event?.id) {
          const enrichedEvent = {
            ...event,
            film_ids: eventFilmMapResult?.get(event.id) || [],
            camera_ids: eventCameraMapResult?.get(event.id) || []
          };
          eventsMap.value.set(event.id, enrichedEvent);
        }
      });

      // Set cameras
      cameras?.forEach(camera => {
        if (camera?.id) camerasMap.value.set(camera.id, camera);
      });

      // Set maps
      if (eventFilmMapResult) {
        eventFilmMapResult.forEach((value, key) => {
          eventFilmsMap.value.set(key, value);
        });
      }

      if (filmEventMapResult) {
        filmEventMapResult.forEach((value, key) => {
          filmEventsMap.value.set(key, value);
        });
      }

      if (eventCameraMapResult) {
        eventCameraMapResult.forEach((value, key) => {
          eventCamerasMap.value.set(key, value);
        });
      }

      if (eventQuantityMapResult) {
        eventQuantityMapResult.forEach((value, key) => {
          eventQuantityMap.value.set(key, value);
        });
      }
    } catch (error) {
      console.error("Error initializing store:", error);
      throw error; // Re-throw to handle in the component
    }
  };

  // Film Actions
  const createFilm = async (
    filmData: Omit<Film, "id" | "created_at">,
  ): Promise<Film> => {
    const newFilm = await createFilmCollection(filmData);
    filmsMap.value.set(newFilm.id, newFilm);
    return newFilm;
  };

  const createFilmWithEvent = async (newFilm: FilmEntry): Promise<FilmEntry> => {
    const data = await createFilm(newFilm);
    await createFilmEvent(data.id, {
      date: newFilm.date_acquired,
      event_type: "Acquired",
      location: newFilm.source || "",
      notes: "",
    });
    return data;
  };

  const updateFilm = async (
    id: number,
    data: Partial<FilmEntry>,
  ): Promise<FilmEntry> => {
    const updatedFilm = await updateFilmCollection(id, data);
    filmsMap.value.set(id, updatedFilm);
    return updatedFilm;
  };

  const deleteFilm = async (id: number): Promise<void> => {
    await deleteFilmCollection(id);
    filmsMap.value.delete(id);

    // Clean up related maps
    filmEventsMap.value.delete(id);
    const relatedEvents = eventFilmsMap.value;
    relatedEvents.forEach((filmIds, eventId) => {
      if (filmIds.includes(id)) {
        eventFilmsMap.value.set(
          eventId,
          filmIds.filter((fid) => fid !== id),
        );
      }
    });
  };

  // Event Actions
  const createEvent = async (event: Omit<Event, "id">): Promise<Event> => {
    const newEvent = await createEventWithoutFilm(event);
    eventsMap.value.set(newEvent.id, newEvent);
    return newEvent;
  };

  const createFilmEvent = async (
    filmId: number,
    event: Omit<Event, "id">,
  ): Promise<Event> => {
    const newEvent = await apiCreateFilmEvent(filmId, event);
    eventsMap.value.set(newEvent.id, newEvent);
    return newEvent;
  };

  const updateEventAction = async (
    eventId: number,
    event: Omit<Event, "id">,
  ): Promise<Event> => {
    const updatedEvent = await apiUpdateEvent(eventId, event);
    eventsMap.value.set(eventId, updatedEvent);
    return updatedEvent;
  };

  const deleteEventAction = async (eventId: number): Promise<void> => {
    await apiDeleteEvent(eventId);
    eventsMap.value.delete(eventId);
    eventFilmsMap.value.delete(eventId);
    eventCamerasMap.value.delete(eventId);
    eventQuantityMap.value.delete(eventId);

    // Update filmEventsMap
    filmEventsMap.value.forEach((eventIds, filmId) => {
      if (eventIds.includes(eventId)) {
        filmEventsMap.value.set(
          filmId,
          eventIds.filter((eid) => eid !== eventId),
        );
      }
    });
  };

  const deleteFilmEvent = async (
    filmId: number,
    eventId: number,
  ): Promise<void> => {
    await apiDeleteFilmEvent(filmId, eventId);

    // Update maps
    const filmEvents = filmEventsMap.value.get(filmId) || [];
    filmEventsMap.value.set(
      filmId,
      filmEvents.filter((eid) => eid !== eventId),
    );

    const eventFilms = eventFilmsMap.value.get(eventId) || [];
    eventFilmsMap.value.set(
      eventId,
      eventFilms.filter((fid) => fid !== filmId),
    );
  };

  const addExistingEventToFilm = async (
    filmId: number,
    eventId: number,
  ): Promise<void> => {
    await apiAddExistingEventToFilm(filmId, eventId);

    // Update maps
    const filmEvents = filmEventsMap.value.get(filmId) || [];
    filmEventsMap.value.set(filmId, [...filmEvents, eventId]);

    const eventFilms = eventFilmsMap.value.get(eventId) || [];
    eventFilmsMap.value.set(eventId, [...eventFilms, filmId]);
  };

  const editFilmsOnEvent = async (
    eventId: number,
    filmIds: number[],
  ): Promise<void> => {
    await apiEditFilmsOnEvent(eventId, filmIds);

    // Update maps
    eventFilmsMap.value.set(eventId, filmIds);
    filmEventsMap.value.forEach((eventIds, filmId) => {
      if (filmIds.includes(filmId)) {
        if (!eventIds.includes(eventId)) {
          filmEventsMap.value.set(filmId, [...eventIds, eventId]);
        }
      } else {
        filmEventsMap.value.set(
          filmId,
          eventIds.filter((eid) => eid !== eventId),
        );
      }
    });
  };

  const createEventWithFilmsAndCameras = async (
    event: Omit<Event, "id">,
    filmIds: number[],
    cameraIds: number[],
  ): Promise<Event> => {
    let newEvent: Event;

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
      newEvent = await createEvent(event);
    }

    // Add camera associations if any
    for (const cameraId of cameraIds) {
      await addCameraToEvent(newEvent.id, cameraId);
    }

    return newEvent;
  };

  // Camera Actions
  const createCamera = async (camera: Omit<Camera, "id">): Promise<Camera> => {
    const newCamera = await apiCreateCamera(camera);
    camerasMap.value.set(newCamera.id, newCamera);
    return newCamera;
  };

  const updateCamera = async (
    id: number,
    data: Partial<Camera>,
  ): Promise<Camera> => {
    const updatedCamera = await apiUpdateCamera(id, data);
    camerasMap.value.set(id, updatedCamera);
    return updatedCamera;
  };

  const deleteCamera = async (id: number): Promise<void> => {
    await apiDeleteCamera(id);
    camerasMap.value.delete(id);

    // Update camera associations
    eventCamerasMap.value.forEach((cameraIds, eventId) => {
      if (cameraIds.includes(id)) {
        eventCamerasMap.value.set(
          eventId,
          cameraIds.filter((cid) => cid !== id),
        );
      }
    });
  };

  const addCameraToEvent = async (
    eventId: number,
    cameraId: number,
  ): Promise<void> => {
    await apiAddCameraToEvent(eventId, cameraId);
    const eventCameras = eventCamerasMap.value.get(eventId) || [];
    eventCamerasMap.value.set(eventId, [...eventCameras, cameraId]);
  };

  const removeCameraFromEvent = async (
    eventId: number,
    cameraId: number,
  ): Promise<void> => {
    await apiRemoveCameraFromEvent(eventId, cameraId);
    const eventCameras = eventCamerasMap.value.get(eventId) || [];
    eventCamerasMap.value.set(
      eventId,
      eventCameras.filter((cid) => cid !== cameraId),
    );
  };

  const editEventCameras = async (
    eventId: number,
    cameraIds: number[],
  ): Promise<void> => {
    await apiEditEventCameras(eventId, cameraIds);
    eventCamerasMap.value.set(eventId, cameraIds);
  };

  return {
    // State
    filmsMap,
    eventsMap,
    camerasMap,
    eventFilmsMap,
    filmEventsMap,
    eventCamerasMap,
    eventQuantityMap,

    // Getters
    filmsList,
    eventsList,
    camerasList,
    filmCollections,
    uniqueEvents,
    uniqueLocations,
    uniqueNames,
    uniqueBrands,
    uniqueSources,
    uniqueCameraBrands,
    eventsByFilm,
    filmEvents,
    getEventsForFilm,
    getLatestEventForFilm,
    getLatestFrozenDateForFilm,

    // Actions
    initialize,
    createFilm,
    createFilmWithEvent,
    updateFilm,
    deleteFilm,
    createEvent,
    createFilmEvent,
    createEventWithFilmsAndCameras,
    updateEvent: updateEventAction,
    deleteEvent: deleteEventAction,
    deleteFilmEvent,
    addExistingEventToFilm,
    editFilmsOnEvent,
    createCamera,
    updateCamera,
    deleteCamera,
    addCameraToEvent,
    removeCameraFromEvent,
    editEventCameras,
  };
});
