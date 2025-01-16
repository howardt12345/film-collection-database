<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { FilmEntry, FilmEvent, Event, Camera } from "@/types/film-collection";
import {
  getFilmCollections,
  createFilmCollection,
  updateFilmCollection,
  deleteFilmCollection,
  getEvents,
  createFilmEvent,
  updateEvent,
  deleteFilmEvent,
  addExistingEventToFilm,
  editFilmsOnEvent,
  deleteEvent,
  createEventWithoutFilm,
  getCameras,
  createCamera,
  updateCamera,
  deleteCamera,
  editEventCameras,
} from "@/api/film-collection";
import FilmCollectionTable from "./film/FilmEntryTable.vue";
import CreateFilmDialog from "./film/CreateFilmDialog.vue";
import EditFilmDialog from "./film/EditFilmDialog.vue";
import EventLogTable from "./event/EventLogTable.vue";
import EditEventDialog from "./event/EditEventDialog.vue";
import UniqueFilmsTable from "./UniqueFilmsTable.vue";
import CameraTable from "./CameraTable.vue";
import CreateCameraDialog from "./CreateCameraDialog.vue";
import EditCameraDialog from "./EditCameraDialog.vue";

const filmCollections = ref<FilmEntry[]>([]);
const filmEvents = ref<FilmEvent[]>([]);
const eventsByFilm = ref<Record<number, Event[]>>({});
const createDialogVisible = ref(false);
const editDialogVisible = ref(false);
const copyDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const createEventDialogVisible = ref(false);
const createCameraDialog = ref(false);
const editCameraDialog = ref(false);

const editingFilm = ref<FilmEntry | null>(null);
const copyingFilm = ref<FilmEntry | null>(null);
const filmToDelete = ref<FilmEntry | null>(null);
const eventToDelete = ref<{ eventId: number; film_ids: number[] } | null>(null);
const editingCamera = ref<Camera | null>(null);

const currentTab = ref(0);

const cameras = ref<Camera[]>([]);

const uniqueNames = computed(() => {
  const nameFrequency = filmCollections.value.reduce(
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
  const brandFrequency = filmCollections.value.reduce(
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
  const sourceFrequency = filmCollections.value
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

const uniqueCameraBrands = computed(() =>
  Array.from(new Set(cameras.value.map((c) => c.brand))),
);

onMounted(async () => {
  await Promise.all([loadFilms(), loadEvents(), loadCameras()]);
});

const loadFilms = async () => {
  filmCollections.value = await getFilmCollections();
};

const loadEvents = async () => {
  filmEvents.value = await getEvents();

  // Populate eventsByFilm from filmEvents
  eventsByFilm.value = filmEvents.value.reduce(
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
};

const loadCameras = async () => {
  try {
    cameras.value = await getCameras();
  } catch (error) {
    console.error("Error loading cameras:", error);
  }
};

const createNewFilm = async (newFilm: FilmEntry) => {
  const data = await createFilmCollection(newFilm);
  await createFilmEvent(data.id, {
    date: newFilm.date_acquired,
    event_type: "Acquired",
    location: newFilm.source || "",
    notes: "",
  });

  // Add the film to the collection with its latest event
  const filmWithEvent = {
    ...data,
    created_at: new Date(data.created_at),
    date_acquired: new Date(data.date_acquired),
    latest_event: eventsByFilm.value[data.id]?.[0]
      ? {
          ...eventsByFilm.value[data.id][0],
          date: new Date(eventsByFilm.value[data.id][0].date),
        }
      : null,
    used: data.used || 0,
    quantity: data.quantity || 1,
  };

  filmCollections.value.unshift(filmWithEvent as FilmEntry);
  createDialogVisible.value = false;
};

const editFilm = (film: FilmEntry) => {
  editingFilm.value = { ...film };
  editDialogVisible.value = true;
};

const copyFilm = (film: FilmEntry) => {
  copyingFilm.value = { ...film };
  copyDialogVisible.value = true;
};

const confirmDeleteFilm = (film: FilmEntry) => {
  filmToDelete.value = film;
  deleteDialogVisible.value = true;
};

const deleteFilm = async () => {
  if (filmToDelete.value) {
    await deleteFilmCollection(filmToDelete.value.id);
    filmCollections.value = filmCollections.value.filter(
      (f) => f.id !== filmToDelete.value!.id,
    );
    filmToDelete.value = null;
    deleteDialogVisible.value = false;
  }
};

const saveEditedFilm = async (editedFilm: FilmEntry) => {
  const index = filmCollections.value.findIndex((f) => f.id === editedFilm.id);
  if (index !== -1) {
    filmCollections.value[index] = editedFilm;
  }
  await updateFilmCollection(editedFilm.id, editedFilm);
  editDialogVisible.value = false;
  editingFilm.value = null;
};

const updateUsed = async (filmId: number, used: number) => {
  const film = filmCollections.value.find((f) => f.id === filmId);
  if (film) {
    film.used = used;
    await updateFilmCollection(filmId, { used });
  }
};

const dismissDeleteEvent = () => {
  eventToDelete.value = null;
  deleteDialogVisible.value = false;
};

const handleDeleteEvent = async () => {
  if (eventToDelete.value) {
    await deleteEvent(eventToDelete.value!.eventId);
    eventToDelete.value!.film_ids.forEach((filmId) => {
      eventsByFilm.value[filmId] =
        eventsByFilm.value[filmId]?.filter(
          (e) => e.id !== eventToDelete.value!.eventId,
        ) || [];
    });
    filmEvents.value = filmEvents.value.filter(
      (e) => e.id !== eventToDelete.value!.eventId,
    );
    deleteDialogVisible.value = false;
    eventToDelete.value = null;
  }
};

const handleRemoveEventFromFilm = async (filmId: number, eventId: number) => {
  await deleteFilmEvent(filmId, eventId);
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
};

const handleAddExistingEventToFilm = async (
  filmId: number,
  eventId: number,
) => {
  await addExistingEventToFilm(filmId, eventId);
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
};

const handleCreateAndAddEventToFilm = async (
  filmId: number,
  event: Omit<Event, "id">,
) => {
  const newEvent = await createFilmEvent(filmId, event);
  // Update eventsByFilm
  if (!eventsByFilm.value[filmId]) eventsByFilm.value[filmId] = [];
  eventsByFilm.value[filmId].push({
    ...newEvent,
    date: new Date(newEvent.date),
  });
  // Update filmEvents
  filmEvents.value.push({
    ...newEvent,
    date: new Date(newEvent.date),
    film_ids: [filmId],
    camera_ids: [],
  });
};

const handleUpdateEvent = async (eventId: number, event: Omit<Event, "id">) => {
  await updateEvent(eventId, event);
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
};

const handleEditFilmsOnEvent = async (eventId: number, filmIds: number[]) => {
  await editFilmsOnEvent(eventId, filmIds);
  const event = filmEvents.value.find((e) => e.id === eventId);
  if (!event) return;

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
};

const handleCreateEvent = async (
  event: Omit<Event, "id">,
  filmIds: number[],
  cameraIds: number[],
) => {
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
    newEvent = await createEventWithoutFilm(event);
  }

  // Update filmEvents with the new event
  filmEvents.value.push({
    ...newEvent,
    date: new Date(newEvent.date),
    film_ids: filmIds,
    camera_ids: cameraIds,
  });

  // Update eventsByFilm for each selected film
  if (filmIds.length > 0) {
    filmIds.forEach((filmId) => {
      if (!eventsByFilm.value[filmId]) eventsByFilm.value[filmId] = [];
      eventsByFilm.value[filmId].push({
        id: newEvent.id,
        date: new Date(newEvent.date),
        event_type: newEvent.event_type,
        location: newEvent.location,
        notes: newEvent.notes,
      });
    });
  }

  createEventDialogVisible.value = false;
};

const handleRemoveEvent = async (eventId: number) => {
  // Get all films associated with this event
  const event = filmEvents.value.find((e) => e.id === eventId);
  if (!event) return;

  await deleteEvent(eventId);

  // Update local state
  // Remove from eventsByFilm
  event.film_ids.forEach((filmId) => {
    eventsByFilm.value[filmId] =
      eventsByFilm.value[filmId]?.filter((e) => e.id !== eventId) || [];
  });

  // Remove from filmEvents
  filmEvents.value = filmEvents.value.filter((e) => e.id !== eventId);
};

const handleAddEvent = async (filmId: number, event: Omit<Event, "id">) => {
  const newEvent = await createFilmEvent(filmId, event);
  // Update eventsByFilm
  if (!eventsByFilm.value[filmId]) eventsByFilm.value[filmId] = [];
  eventsByFilm.value[filmId].push({
    ...newEvent,
    date: new Date(newEvent.date),
  });
  // Update filmEvents
  filmEvents.value.push({
    ...newEvent,
    date: new Date(newEvent.date),
    film_ids: [filmId],
    camera_ids: [],
  });
};

const handleCopyEvent = async (
  event: Omit<Event, "id">,
  filmIds: number[],
  cameraIds: number[],
) => {
  if (filmIds.length === 0) return;
  const newEvent = await createFilmEvent(filmIds[0], event);

  // Create additional associations if more films are selected
  for (let i = 1; i < filmIds.length; i++) {
    await addExistingEventToFilm(filmIds[i], newEvent.id);
  }

  // Update filmEvents
  filmEvents.value.push({
    ...newEvent,
    date: new Date(newEvent.date),
    film_ids: filmIds,
    camera_ids: cameraIds,
  });

  // Update eventsByFilm for each selected film
  filmIds.forEach((filmId) => {
    if (!eventsByFilm.value[filmId]) eventsByFilm.value[filmId] = [];
    eventsByFilm.value[filmId].push({
      id: newEvent.id,
      date: new Date(newEvent.date),
      event_type: newEvent.event_type,
      location: newEvent.location,
      notes: newEvent.notes,
    });
  });
};
const handleUpdateEventCameras = async (
  eventId: number,
  cameraIds: number[],
) => {
  await editEventCameras(eventId, cameraIds);
  const index = filmEvents.value.findIndex((e) => e.id === eventId);
  if (index !== -1) {
    filmEvents.value[index].camera_ids = cameraIds;
  }
};

const handleCreateCamera = async (camera: Camera) => {
  try {
    const newCamera = await createCamera(camera);
    cameras.value.push(newCamera);
    createCameraDialog.value = false;
  } catch (error) {
    console.error("Error creating camera:", error);
  }
};

const handleUpdateCamera = async (camera: Camera) => {
  try {
    const updatedCamera = await updateCamera(camera.id, camera);
    const index = cameras.value.findIndex((c) => c.id === camera.id);
    if (index !== -1) {
      cameras.value[index] = updatedCamera;
    }
    editCameraDialog.value = false;
    editingCamera.value = null;
  } catch (error) {
    console.error("Error updating camera:", error);
  }
};

const handleDeleteCamera = async (camera: Camera) => {
  if (
    !confirm(`Are you sure you want to delete ${camera.brand} ${camera.model}?`)
  ) {
    return;
  }

  try {
    await deleteCamera(camera.id);
    cameras.value = cameras.value.filter((c) => c.id !== camera.id);
  } catch (error) {
    console.error("Error deleting camera:", error);
  }
};

const editCamera = (camera: Camera) => {
  editingCamera.value = camera;
  editCameraDialog.value = true;
};

const confirmDeleteCamera = (camera: Camera) => {
  handleDeleteCamera(camera);
};
</script>

<template>
  <v-container>
    <div class="d-flex align-center ga-4 mb-2">
      <v-btn color="primary" @click="createDialogVisible = true">
        New Film Entry
      </v-btn>
      <v-btn color="primary" @click="createEventDialogVisible = true">
        New Event
      </v-btn>
      <v-btn color="primary" @click="createCameraDialog = true">
        Add Camera
      </v-btn>
    </div>

    <v-tabs v-model="currentTab">
      <v-tab value="0">Film Entries</v-tab>
      <v-tab value="1">Event Log</v-tab>
      <v-tab value="3">Cameras</v-tab>
      <v-tab value="2">Unique Films</v-tab>
    </v-tabs>

    <v-window v-model="currentTab" :touch="false">
      <v-window-item value="0">
        <FilmCollectionTable
          :films="filmCollections"
          :events="filmEvents"
          :events-by-film="eventsByFilm"
          :unique-events="uniqueEvents"
          @edit="editFilm"
          @copy="copyFilm"
          @delete="confirmDeleteFilm"
          @remove-event-from-film="handleRemoveEventFromFilm"
          @add-existing-event-to-film="handleAddExistingEventToFilm"
          @create-and-add-event-to-film="handleCreateAndAddEventToFilm"
          @update-used="updateUsed"
        />
      </v-window-item>

      <v-window-item value="1">
        <EventLogTable
          :events="filmEvents"
          :films="filmCollections"
          :uniqueEvents="uniqueEvents"
          :uniqueLocations="uniqueLocations"
          :cameras="cameras"
          @update-event="handleUpdateEvent"
          @edit-films-on-event="handleEditFilmsOnEvent"
          @remove-event="handleRemoveEvent"
          @add-event="handleAddEvent"
          @update-event-cameras="handleUpdateEventCameras"
        />
      </v-window-item>

      <v-window-item value="2">
        <UniqueFilmsTable :films="filmCollections" />
      </v-window-item>

      <v-window-item value="3">
        <CameraTable
          :cameras="cameras"
          :filmEvents="filmEvents"
          @edit="editCamera"
          @delete="confirmDeleteCamera"
        />
      </v-window-item>
    </v-window>

    <CreateFilmDialog
      v-model="createDialogVisible"
      :unique-names="uniqueNames"
      :unique-brands="uniqueBrands"
      :unique-sources="uniqueSources"
      @create="createNewFilm"
    />

    <EditFilmDialog
      v-model="editDialogVisible"
      :film="editingFilm"
      :unique-names="uniqueNames"
      :unique-brands="uniqueBrands"
      :unique-sources="uniqueSources"
      @save="saveEditedFilm"
    />

    <EditFilmDialog
      v-if="copyingFilm"
      v-model="copyDialogVisible"
      :film="copyingFilm"
      :unique-names="uniqueNames"
      :unique-brands="uniqueBrands"
      :unique-sources="uniqueSources"
      @save="createNewFilm"
    />

    <EditEventDialog
      v-model="createEventDialogVisible"
      :event="null"
      :unique-events="uniqueEvents"
      :unique-locations="uniqueLocations"
      :films="filmCollections"
      :cameras="cameras"
      :associated-film-ids="[]"
      :associated-camera-ids="[]"
      @save="handleCreateEvent"
    />

    <v-dialog v-model="deleteDialogVisible" max-width="500">
      <v-card>
        <v-card-title class="headline">Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete this
          <template v-if="eventToDelete">event</template>
          <template v-else>film collection entry</template>?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="dismissDeleteEvent">Cancel</v-btn>
          <v-btn
            color="red"
            @click="eventToDelete ? handleDeleteEvent() : deleteFilm()"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <CreateCameraDialog
      v-model="createCameraDialog"
      :unique-brands="uniqueCameraBrands"
      @create="handleCreateCamera"
    />

    <EditCameraDialog
      v-model="editCameraDialog"
      :camera="editingCamera"
      :unique-brands="uniqueCameraBrands"
      @save="handleUpdateCamera"
    />
  </v-container>
</template>
