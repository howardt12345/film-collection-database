<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useFilmsStore } from '@/stores/films';
import { useEventsStore } from '@/stores/events';
import { useCamerasStore } from '@/stores/cameras';
import { useFilmEvents } from '@/composables/useFilmEvents';
import { FilmEntry, Event } from '@/types/film-collection';
import FilmEntryTable from '@/components/film-collection/film/FilmEntryTable.vue';
import CreateFilmDialog from '@/components/film-collection/film/CreateFilmDialog.vue';
import EditFilmDialog from '@/components/film-collection/film/EditFilmDialog.vue';

const props = defineProps<{
  search?: string;
}>();

const filmsStore = useFilmsStore();
const eventsStore = useEventsStore();
const camerasStore = useCamerasStore();
const filmEvents = useFilmEvents();
const route = useRoute();
const router = useRouter();

// UI state
const createDialogVisible = ref(false);
const editDialogVisible = ref(false);
const copyDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const editingFilm = ref<FilmEntry | null>(null);
const copyingFilm = ref<FilmEntry | null>(null);
const filmToDelete = ref<FilmEntry | null>(null);

// Search state
const currentSearch = ref(props.search || '');

// Watch for search prop changes
watch(
  () => props.search,
  (newValue) => {
    currentSearch.value = newValue || '';
  },
);

// Handle search changes
const handleSearchChange = (value: string) => {
  currentSearch.value = value;
  // Update URL without triggering navigation
  router.push({
    query: {
      ...route.query,
      search: value || undefined, // Remove search param if empty
    },
  });
};

// Computed properties from stores
const films = computed(() => filmsStore.films);
const uniqueNames = computed(() => filmsStore.uniqueNames);
const uniqueBrands = computed(() => filmsStore.uniqueBrands);
const uniqueSources = computed(() => filmsStore.uniqueSources);
// No longer needed as we're using eventsStore directly in components
const eventsByFilm = computed(() => {
  const result: Record<number, any[]> = {};

  films.value.forEach(film => {
    result[film.id] = eventsStore.getEventsByFilmId(film.id);
  });

  return result;
});

// Load data on component mount
// Function to sync film used quantities with event-based calculations
const syncFilmUsedQuantities = () => {
  films.value.forEach(film => {
    const usedQuantity = filmEvents.calculateUsedQuantity(film.id);
    if (film.used !== usedQuantity) {
      filmsStore.updateUsed(film.id, usedQuantity);
    }
  });
};

onMounted(async () => {
  await Promise.all([
    eventsStore.fetchEvents(),
    filmsStore.fetchFilms(),
    camerasStore.fetchCameras(),
  ]);

  // Sync film used quantities after loading data
  syncFilmUsedQuantities();
});

// Film CRUD operations
const createNewFilm = async (newFilm: FilmEntry) => {
  await filmsStore.createFilm(newFilm);
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
    await filmsStore.deleteFilm(filmToDelete.value.id);
    filmToDelete.value = null;
    deleteDialogVisible.value = false;
  }
};

const saveEditedFilm = async (editedFilm: FilmEntry) => {
  await filmsStore.updateFilm(editedFilm.id, editedFilm);
  editDialogVisible.value = false;
  editingFilm.value = null;
};

const updateUsed = async (filmId: number, used: number) => {
  await filmsStore.updateUsed(filmId, used);
};

// Event operations
const handleRemoveEventFromFilm = async (filmId: number, eventId: number) => {
  await eventsStore.removeFilmFromEvent(filmId, eventId);
  // Update the used quantity after removing an event
  const usedQuantity = filmEvents.calculateUsedQuantity(filmId);
  await filmsStore.updateUsed(filmId, usedQuantity);
};

const handleAddExistingEventToFilm = async (filmId: number, eventId: number, quantity?: number) => {
  await eventsStore.addFilmToEvent(filmId, eventId, quantity);
  // Update the used quantity after adding an event
  const usedQuantity = filmEvents.calculateUsedQuantity(filmId);
  await filmsStore.updateUsed(filmId, usedQuantity);
};

const handleCreateAndAddEventToFilm = async (filmId: number, event: any) => {
  // Create a properly typed event object
  const eventData = {
    film_event_type_id: event.film_event_type_id,
    date: event.date,
    location: event.location || "",
    notes: event.notes || "",
    quantity: event.quantity
  };

  await eventsStore.createEvent(eventData, [filmId]);
  // Update the used quantity after creating and adding an event
  const usedQuantity = filmEvents.calculateUsedQuantity(filmId);
  await filmsStore.updateUsed(filmId, usedQuantity);
};
</script>

<template>
  <v-container>
    <div class="d-flex align-center ga-4 mb-2">
      <v-btn color="primary" @click="createDialogVisible = true">
        New Film Entry
      </v-btn>
    </div>

    <FilmEntryTable
      :films="films"
      :events="eventsStore.events"
      :events-by-film="eventsByFilm"
      :search="currentSearch"
      @edit="editFilm"
      @copy="copyFilm"
      @delete="confirmDeleteFilm"
      @remove-event-from-film="handleRemoveEventFromFilm"
      @add-existing-event-to-film="handleAddExistingEventToFilm"
      @create-and-add-event-to-film="handleCreateAndAddEventToFilm"
      @update-used="updateUsed"
      @search-change="handleSearchChange"
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
          Are you sure you want to delete this film collection entry?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="deleteDialogVisible = false">Cancel</v-btn>
          <v-btn color="red" @click="deleteFilm">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

