<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useEventsStore } from '@/stores/events';
import { useFilmsStore } from '@/stores/films';
import { useCamerasStore } from '@/stores/cameras';
import { Event } from '@/types/film-collection';
import EventLogTable from '@/components/film-collection/event/EventLogTable.vue';
import EditEventDialog from '@/components/film-collection/event/EditEventDialog.vue';

const eventsStore = useEventsStore();
const filmsStore = useFilmsStore();
const camerasStore = useCamerasStore();

// UI state
const createEventDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const eventToDelete = ref<Event | null>(null);

// Computed properties from stores
const events = computed(() => eventsStore.events);
const films = computed(() => filmsStore.films);
const cameras = computed(() => camerasStore.cameras);
// No longer needed as we're using eventsStore directly in components
const uniqueLocations = computed(() => eventsStore.uniqueLocations);

// Load data on component mount
onMounted(async () => {
  await Promise.all([
    eventsStore.fetchEvents(),
    filmsStore.fetchFilms(),
    camerasStore.fetchCameras(),
  ]);
});

// Event CRUD operations
const handleCreateEvent = async (
  event: Omit<Event, 'id'>,
  filmIds: number[],
  cameraIds: number[],
) => {
  await eventsStore.createEvent(event, filmIds, cameraIds);
  createEventDialogVisible.value = false;
};

const handleUpdateEvent = async (eventId: number, event: Omit<Event, 'id'>) => {
  await eventsStore.updateEvent(eventId, event);
};

const handleEditFilmsOnEvent = async (eventId: number, filmIds: number[]) => {
  await eventsStore.updateFilmsOnEvent(eventId, filmIds);
};

const confirmDeleteEvent = (eventId: number) => {
  const event = eventsStore.getEventById(eventId);
  if (event) {
    eventToDelete.value = event;
    deleteDialogVisible.value = true;
  }
};

const handleDeleteEvent = async () => {
  if (eventToDelete.value) {
    await eventsStore.deleteEvent(eventToDelete.value.id);
    eventToDelete.value = null;
    deleteDialogVisible.value = false;
  }
};

const handleAddEvent = async (filmId: number, event: Omit<Event, 'id'>) => {
  await eventsStore.createEvent(event, [filmId]);
};

const handleUpdateEventCameras = async (eventId: number, cameraIds: number[]) => {
  await eventsStore.updateEventCameras(eventId, cameraIds);
};
</script>

<template>
  <v-container>
    <div class="d-flex align-center ga-4 mb-2">
      <v-btn color="primary" @click="createEventDialogVisible = true">
        New Event
      </v-btn>
    </div>

    <EventLogTable
      :events="events"
      :films="films"
      :uniqueLocations="uniqueLocations"
      :cameras="cameras"
      @update-event="handleUpdateEvent"
      @edit-films-on-event="handleEditFilmsOnEvent"
      @remove-event="confirmDeleteEvent"
      @add-event="handleAddEvent"
      @update-event-cameras="handleUpdateEventCameras"
    />

    <EditEventDialog
      v-model="createEventDialogVisible"
      :event="null"
      :unique-locations="uniqueLocations"
      :films="films"
      :cameras="cameras"
      :associated-film-ids="[]"
      :associated-camera-ids="[]"
      @save="handleCreateEvent"
    />

    <v-dialog v-model="deleteDialogVisible" max-width="500">
      <v-card>
        <v-card-title class="headline">Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete this event? This will remove it from all
          associated films.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="deleteDialogVisible = false">Cancel</v-btn>
          <v-btn color="red" @click="handleDeleteEvent">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
