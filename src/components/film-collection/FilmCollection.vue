<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { FilmEntry, Event, Camera } from "@/types/film-collection";
import { useFilmCollection } from "@/composables/useFilmCollection";
import { useEvents } from "@/composables/useEvents";
import { useCameras } from "@/composables/useCameras";
import { useErrorHandling } from "@/composables/useErrorHandling";
import { createFilmEvent } from "@/api/film-collection";

// UI Components
import FilmCollectionTable from "./film/FilmEntryTable.vue";
import CreateFilmDialog from "./film/CreateFilmDialog.vue";
import EditFilmDialog from "./film/EditFilmDialog.vue";
import EventLogTable from "./event/EventLogTable.vue";
import EditEventDialog from "./event/EditEventDialog.vue";
import UniqueFilms from "./UniqueFilms.vue";
import CameraTable from "./camera/CameraTable.vue";
import CreateCameraDialog from "./camera/CreateCameraDialog.vue";
import EditCameraDialog from "./camera/EditCameraDialog.vue";

// Composables
const filmCollection = useFilmCollection();
const events = useEvents();
const cameras = useCameras();
const { showError } = useErrorHandling();

// Router
const route = useRoute();
const router = useRouter();

// Dialog visibility state
const createDialogVisible = ref(false);
const editDialogVisible = ref(false);
const copyDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const createEventDialogVisible = ref(false);
const createCameraDialog = ref(false);
const editCameraDialog = ref(false);

// UI state
const currentTab = ref(0);
const editingFilm = ref<FilmEntry | null>(null);
const copyingFilm = ref<FilmEntry | null>(null);
const filmToDelete = ref<FilmEntry | null>(null);
const eventToDelete = ref<{ eventId: number; film_ids: number[] } | null>(null);
const editingCamera = ref<Camera | null>(null);

// Search functionality
const currentSearch = ref(route.query.search?.toString() || "");

// Handle search changes
const handleSearchChange = (value: string) => {
  currentSearch.value = value;
  router.push({
    query: {
      ...route.query,
      search: value || undefined,
    },
  });
};

// Watch for route changes
watch(route, (route) => {
  if (route.query.search) {
    currentTab.value = 0;
    handleSearchChange(route.query.search?.toString() || "");
  }
});

// Initialize data on mount
onMounted(async () => {
  await Promise.all([
    filmCollection.loadFilms(),
    events.loadEvents(),
    cameras.loadCameras(),
  ]);
});

// Film operations
const createNewFilm = async (newFilm: FilmEntry) => {
  const createdFilm = await filmCollection.createFilm(newFilm);

  if (createdFilm) {
    // Create initial "Acquired" event
    try {
      await createFilmEvent(createdFilm.id, {
        date: newFilm.date_acquired,
        event_type: "Acquired",
        location: newFilm.source || "",
        notes: "",
      });

      // Reload events to sync state
      await events.loadEvents();
    } catch (error) {
      showError("Failed to create acquisition event", "warning");
    }

    createDialogVisible.value = false;
  }
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
    const success = await filmCollection.deleteFilm(filmToDelete.value.id);
    if (success) {
      filmToDelete.value = null;
      deleteDialogVisible.value = false;
    }
  }
};

const saveEditedFilm = async (editedFilm: FilmEntry) => {
  const success = await filmCollection.updateFilm(editedFilm.id, editedFilm);
  if (success) {
    editDialogVisible.value = false;
    editingFilm.value = null;
  }
};

// Event operations
const handleRemoveEventFromFilm = async (filmId: number, eventId: number) => {
  await events.removeEventFromFilm(filmId, eventId);
};

const handleAddExistingEventToFilm = async (
  filmId: number,
  eventId: number,
) => {
  await events.addExistingEventToFilmAction(filmId, eventId);
};

const handleCreateAndAddEventToFilm = async (
  filmId: number,
  event: Omit<Event, "id">,
) => {
  await events.createAndAddEventToFilm(filmId, event);
};

const handleUpdateEvent = async (eventId: number, event: Omit<Event, "id">) => {
  await events.updateEventAction(eventId, event);
};

const handleEditFilmsOnEvent = async (eventId: number, filmIds: number[]) => {
  await events.editFilmsOnEventAction(eventId, filmIds);
};

const handleCreateEvent = async (
  event: Omit<Event, "id">,
  filmIds: number[],
  cameraIds: number[],
) => {
  const success = await events.createEvent(event, filmIds, cameraIds);
  if (success) {
    createEventDialogVisible.value = false;
  }
};

const handleRemoveEvent = async (eventId: number) => {
  await events.removeEvent(eventId);
};

const handleAddEvent = async (filmId: number, event: Omit<Event, "id">) => {
  await events.createAndAddEventToFilm(filmId, event);
};

const handleUpdateEventCameras = async (
  eventId: number,
  cameraIds: number[],
) => {
  await events.updateEventCameras(eventId, cameraIds);
};

// Camera operations
const handleCreateCamera = async (camera: Camera) => {
  const createdCamera = await cameras.createCameraAction(camera);
  if (createdCamera) {
    createCameraDialog.value = false;
  }
};

const handleUpdateCamera = async (camera: Camera) => {
  const success = await cameras.updateCameraAction(camera.id, camera);
  if (success) {
    editCameraDialog.value = false;
    editingCamera.value = null;
  }
};

const handleDeleteCamera = async (camera: Camera) => {
  await cameras.deleteCameraAction(camera.id);
};

const editCamera = (camera: Camera) => {
  editingCamera.value = camera;
  editCameraDialog.value = true;
};

const confirmDeleteCamera = (camera: Camera) => {
  handleDeleteCamera(camera);
};

// Delete dialog management
const dismissDeleteEvent = () => {
  eventToDelete.value = null;
  deleteDialogVisible.value = false;
};

const handleDeleteEvent = async () => {
  if (eventToDelete.value) {
    await events.removeEvent(eventToDelete.value.eventId);
    deleteDialogVisible.value = false;
    eventToDelete.value = null;
  }
};
</script>

<template>
  <v-container>
    <div class="d-flex align-center ga-4 mb-2">
      <v-btn
        color="primary"
        @click="createDialogVisible = true"
        :loading="filmCollection.isCreatingFilm.value"
      >
        New Film Entry
      </v-btn>
      <v-btn
        color="primary"
        @click="createEventDialogVisible = true"
        :loading="events.isCreatingEvent.value"
      >
        New Event
      </v-btn>
      <v-btn
        color="primary"
        @click="createCameraDialog = true"
        :loading="cameras.isCreatingCamera.value"
      >
        New Camera
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
          :films="filmCollection.films.value"
          :events="events.filmEvents.value"
          :events-by-film="events.eventsByFilm.value"
          :unique-events="events.uniqueEvents.value"
          :search="currentSearch"
          @edit="editFilm"
          @copy="copyFilm"
          @delete="confirmDeleteFilm"
          @remove-event-from-film="handleRemoveEventFromFilm"
          @add-existing-event-to-film="handleAddExistingEventToFilm"
          @create-and-add-event-to-film="handleCreateAndAddEventToFilm"
          @update-used="filmCollection.updateUsed"
          @search-change="handleSearchChange"
        />
      </v-window-item>

      <v-window-item value="1">
        <EventLogTable
          :events="events.filmEvents.value"
          :films="filmCollection.films.value"
          :uniqueEvents="events.uniqueEvents.value"
          :uniqueLocations="events.uniqueLocations.value"
          :cameras="cameras.cameras.value"
          @update-event="handleUpdateEvent"
          @edit-films-on-event="handleEditFilmsOnEvent"
          @remove-event="handleRemoveEvent"
          @add-event="handleAddEvent"
          @update-event-cameras="handleUpdateEventCameras"
        />
      </v-window-item>

      <v-window-item value="2">
        <UniqueFilms :films="filmCollection.films.value" />
      </v-window-item>

      <v-window-item value="3">
        <CameraTable
          :cameras="cameras.cameras.value"
          :filmEvents="events.filmEvents.value"
          @edit="editCamera"
          @delete="confirmDeleteCamera"
        />
      </v-window-item>
    </v-window>

    <!-- Film Dialogs -->
    <CreateFilmDialog
      v-model="createDialogVisible"
      :unique-names="filmCollection.uniqueNames.value"
      :unique-brands="filmCollection.uniqueBrands.value"
      :unique-sources="filmCollection.uniqueSources.value"
      @create="createNewFilm"
    />

    <EditFilmDialog
      v-model="editDialogVisible"
      :film="editingFilm"
      :unique-names="filmCollection.uniqueNames.value"
      :unique-brands="filmCollection.uniqueBrands.value"
      :unique-sources="filmCollection.uniqueSources.value"
      @save="saveEditedFilm"
    />

    <EditFilmDialog
      v-if="copyingFilm"
      v-model="copyDialogVisible"
      :film="copyingFilm"
      :unique-names="filmCollection.uniqueNames.value"
      :unique-brands="filmCollection.uniqueBrands.value"
      :unique-sources="filmCollection.uniqueSources.value"
      @save="createNewFilm"
    />

    <!-- Event Dialog -->
    <EditEventDialog
      v-model="createEventDialogVisible"
      :event="null"
      :unique-events="events.uniqueEvents.value"
      :unique-locations="events.uniqueLocations.value"
      :films="filmCollection.films.value"
      :cameras="cameras.cameras.value"
      :associated-film-ids="[]"
      :associated-camera-ids="[]"
      @save="handleCreateEvent"
    />

    <!-- Delete Confirmation Dialog -->
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
            :loading="filmCollection.isDeletingFilm.value"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Camera Dialogs -->
    <CreateCameraDialog
      v-model="createCameraDialog"
      :unique-brands="cameras.uniqueCameraBrands.value"
      @create="handleCreateCamera"
    />

    <EditCameraDialog
      v-model="editCameraDialog"
      :camera="editingCamera"
      :unique-brands="cameras.uniqueCameraBrands.value"
      @save="handleUpdateCamera"
    />
  </v-container>
</template>
