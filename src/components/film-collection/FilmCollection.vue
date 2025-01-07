<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { FilmEntry, Event } from "@/types/film-collection";
import {
  getFilmCollections,
  createFilmCollection,
  updateFilmCollection,
  deleteFilmCollection,
  getFilmEvents,
  createFilmEvent,
  updateEvent,
  deleteFilmEvent,
} from "@/api/film-collection";
import FilmCollectionTable from "./FilmCollectionTable.vue";
import CreateFilmDialog from "./CreateFilmDialog.vue";
import EditFilmDialog from "./EditFilmDialog.vue";

const filmCollections = ref<FilmEntry[]>([]);
const eventsByFilm = ref<Record<number, Event[]>>({});
const createDialogVisible = ref(false);
const editDialogVisible = ref(false);
const copyDialogVisible = ref(false);
const deleteDialogVisible = ref(false);

const editingFilm = ref<FilmEntry | null>(null);
const copyingFilm = ref<FilmEntry | null>(null);
const filmToDelete = ref<FilmEntry | null>(null);
const eventToDelete = ref<{ filmId: number; eventId: number } | null>(null);

const uniqueNames = computed(() => {
  const nameFrequency = filmCollections.value.reduce(
    (acc: Record<string, number>, film) => {
      acc[film.name] = (acc[film.name] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  return Object.keys(nameFrequency).sort((a, b) => nameFrequency[b] - nameFrequency[a]);
});

const uniqueBrands = computed(() => {
  const brandFrequency = filmCollections.value.reduce(
    (acc: Record<string, number>, film) => {
      acc[film.brand] = (acc[film.brand] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  return Object.keys(brandFrequency).sort((a, b) => brandFrequency[b] - brandFrequency[a]);
});

const uniqueSources = computed(() => {
  const sourceFrequency = filmCollections.value
    .filter((film) => film.source)
    .reduce((acc: Record<string, number>, film) => {
      acc[film.source] = (acc[film.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  return Object.keys(sourceFrequency).sort((a, b) => sourceFrequency[b] - sourceFrequency[a]);
});

const uniqueEvents = computed(() => {
  const eventTypes = new Set<string>();
  Object.values(eventsByFilm.value).forEach(events => {
    events.forEach(event => eventTypes.add(event.event_type));
  });
  return Array.from(eventTypes);
});

const fetchFilmCollections = async () => {
  filmCollections.value = await getFilmCollections();
};

const handleFetchEvents = async (filmId: number) => {
  const events = await getFilmEvents(filmId);
  eventsByFilm.value[filmId] = events;
};

onMounted(fetchFilmCollections);

const createNewFilm = async (newFilm: FilmEntry) => {
  const data = await createFilmCollection(newFilm);
  await createFilmEvent(data.id, {
    date: newFilm.date_acquired,
    event_type: "Acquired",
    notes: ""
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

const addEventToFilm = async (filmId: number, newEvent: Omit<Event, "id">) => {
  const event = await createFilmEvent(filmId, newEvent);
  if (!eventsByFilm.value[filmId]) {
    eventsByFilm.value[filmId] = [];
  }
  eventsByFilm.value[filmId].push(event);
};

const editEvent = async (filmId: number, eventId: number, updatedEvent: Event) => {
  await updateEvent(filmId, eventId, updatedEvent);
  const eventIndex = eventsByFilm.value[filmId]?.findIndex(e => e.id === eventId);
  if (eventIndex !== undefined && eventIndex !== -1) {
    eventsByFilm.value[filmId][eventIndex] = updatedEvent;
  }
};

const confirmDeleteEvent = (filmId: number, eventId: number) => {
  eventToDelete.value = { filmId, eventId };
  deleteDialogVisible.value = true;
};

const dismissDeleteEvent = () => {
  eventToDelete.value = null;
  deleteDialogVisible.value = false;
};

const deleteEvent = async () => {
  if (eventToDelete.value) {
    const { filmId, eventId } = eventToDelete.value;
    await deleteFilmEvent(filmId, eventId);
    eventsByFilm.value[filmId] = eventsByFilm.value[filmId]?.filter(
      e => e.id !== eventId
    ) || [];
    eventToDelete.value = null;
    deleteDialogVisible.value = false;
  }
};
</script>

<template>
  <v-container>
    <div class="d-flex align-center ga-4 mb-2">
      <v-btn color="primary" @click="createDialogVisible = true">
        New Film Entry
      </v-btn>
    </div>

    <FilmCollectionTable
      :films="filmCollections"
      :events-by-film="eventsByFilm"
      :unique-events="uniqueEvents"
      @edit="editFilm"
      @copy="copyFilm"
      @delete="confirmDeleteFilm"
      @add-event="addEventToFilm"
      @edit-event="editEvent"
      @delete-event="confirmDeleteEvent"
      @update-used="updateUsed"
      @fetch-events="handleFetchEvents"
    />

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
