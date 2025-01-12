<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { FilmEntry, Event } from "@/types/film-collection";
import {
  getFilmCollections,
  createFilmCollection,
  updateFilmCollection,
  deleteFilmCollection,
  getEvents,
  getEventsForFilm,
  createFilmEvent,
  updateEvent,
  deleteFilmEvent,
  addExistingEventToFilm,
  editFilmsOnEvent,
} from "@/api/film-collection";
import FilmCollectionTable from "./FilmCollectionTable.vue";
import CreateFilmDialog from "./CreateFilmDialog.vue";
import EditFilmDialog from "./EditFilmDialog.vue";
import EventLogTable from "./EventLogTable.vue";

const filmCollections = ref<FilmEntry[]>([]);
const filmEvents = ref<(Event & { film_ids: number[] })[]>([]);
const eventsByFilm = ref<Record<number, Event[]>>({});
const createDialogVisible = ref(false);
const editDialogVisible = ref(false);
const copyDialogVisible = ref(false);
const deleteDialogVisible = ref(false);

const editingFilm = ref<FilmEntry | null>(null);
const copyingFilm = ref<FilmEntry | null>(null);
const filmToDelete = ref<FilmEntry | null>(null);
const eventToDelete = ref<{ filmId: number; eventId: number } | null>(null);

const currentTab = ref(0);

const uniqueNames = computed(() => {
  const nameFrequency = filmCollections.value.reduce(
    (acc: Record<string, number>, film) => {
      acc[film.name] = (acc[film.name] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  return Object.keys(nameFrequency).sort(
    (a, b) => nameFrequency[b] - nameFrequency[a]
  );
});

const uniqueBrands = computed(() => {
  const brandFrequency = filmCollections.value.reduce(
    (acc: Record<string, number>, film) => {
      acc[film.brand] = (acc[film.brand] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  return Object.keys(brandFrequency).sort(
    (a, b) => brandFrequency[b] - brandFrequency[a]
  );
});

const uniqueSources = computed(() => {
  const sourceFrequency = filmCollections.value
    .filter((film) => film.source)
    .reduce((acc: Record<string, number>, film) => {
      acc[film.source] = (acc[film.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  return Object.keys(sourceFrequency).sort(
    (a, b) => sourceFrequency[b] - sourceFrequency[a]
  );
});

const uniqueEvents = computed(() =>
  Array.from(new Set(filmEvents.value.map(event => event.event_type)))
    .filter(Boolean)
    .sort()
);

onMounted(async () => {
  filmCollections.value = await getFilmCollections();
  filmEvents.value = await getEvents();
});

const handleFetchEvents = async (filmId: number) => {
  const events = await getEventsForFilm(filmId);
  eventsByFilm.value[filmId] = events;
};

const createNewFilm = async (newFilm: FilmEntry) => {
  const data = await createFilmCollection(newFilm);
  await createFilmEvent(data.id, {
    date: newFilm.date_acquired,
    event_type: "Acquired",
    location: newFilm.source,
    notes: "",
  });
  filmCollections.value.push(data);
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
      (f) => f.id !== filmToDelete.value!.id
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

const deleteEvent = async () => {
  if (eventToDelete.value) {
    const { filmId, eventId } = eventToDelete.value;
    await deleteFilmEvent(filmId, eventId);
    eventsByFilm.value[filmId] =
      eventsByFilm.value[filmId]?.filter((e) => e.id !== eventId) || [];
    eventToDelete.value = null;
    deleteDialogVisible.value = false;
  }
};

const handleRemoveEventFromFilm = async (filmId: number, eventId: number) => {
  await deleteFilmEvent(filmId, eventId);
  // Refresh events for this film
  await handleFetchEvents(filmId);
  // Refresh all events
  filmEvents.value = await getEvents();
};

const handleAddExistingEventToFilm = async (filmId: number, eventId: number) => {
  await addExistingEventToFilm(filmId, eventId);
  // Refresh events for this film
  await handleFetchEvents(filmId);
  // Refresh all events
  filmEvents.value = await getEvents();
};

const handleCreateAndAddEventToFilm = async (filmId: number, event: Omit<Event, "id">) => {
  await createFilmEvent(filmId, event);
  // Refresh events for this film
  await handleFetchEvents(filmId);
  // Refresh all events
  filmEvents.value = await getEvents();
};

const handleUpdateEvent = async (eventId: number, event: Omit<Event, "id">) => {
  await updateEvent(eventId, event);
  // Refresh events for all films that have this event
  const filmsWithEvent = Object.entries(eventsByFilm.value)
    .filter(([_, events]) => events.some(e => e.id === eventId))
    .map(([filmId]) => Number(filmId));

  for (const filmId of filmsWithEvent) {
    await handleFetchEvents(filmId);
  }

  // Refresh all events
  filmEvents.value = await getEvents();
};

const handleEditFilmsOnEvent = async (eventId: number, filmIds: number[]) => {
  await editFilmsOnEvent(eventId, filmIds);
  // Refresh events for all affected films
  const affectedFilms = new Set([
    ...Object.entries(eventsByFilm.value)
      .filter(([_, events]) => events.some(e => e.id === eventId))
      .map(([filmId]) => Number(filmId)),
    ...filmIds
  ]);

  for (const filmId of affectedFilms) {
    await handleFetchEvents(filmId);
  }

  // Refresh all events
  filmEvents.value = await getEvents();
};

const emit = defineEmits<{
  (e: "addFilmToEvent", filmId: number, eventId: number): void;
}>();
</script>

<template>
  <v-container>
    <div class="d-flex align-center ga-4 mb-2">
      <v-btn color="primary" @click="createDialogVisible = true">
        New Film Entry
      </v-btn>
    </div>

    <v-tabs v-model="currentTab">
      <v-tab value="0">Film Collection</v-tab>
      <v-tab value="1">Event Log</v-tab>
    </v-tabs>

    <v-window v-model="currentTab">
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
          @fetch-events="handleFetchEvents"
        />
      </v-window-item>

      <v-window-item value="1">
        <EventLogTable
          :events="filmEvents"
          :films="filmCollections"
          :uniqueEvents="uniqueEvents"
          @update-event="handleUpdateEvent"
          @edit-films-on-event="handleEditFilmsOnEvent"
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
            @click="eventToDelete ? deleteEvent() : deleteFilm()"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
