<script setup lang="ts">
import { computed } from "vue";
import VueMarkdown from "vue-markdown-render";
import { FilmEvent, Camera } from "@/types/film-collection";
import { useDateFormatting } from "@/composables/useDateFormatting";
import { useEventsStore } from "@/stores/events";
import { useCamerasStore } from "@/stores/cameras";
import { getBrandColor } from "@/utils/colors";

const { formatDate } = useDateFormatting();
const eventsStore = useEventsStore();
const camerasStore = useCamerasStore();

const props = defineProps<{
  events: FilmEvent[];
  filmId?: number;
  cameras?: Camera[];
}>();

const emit = defineEmits<{
  (e: "removeEvent", eventId: number): void;
}>();

const eventHeaders = [
  { title: "Date", key: "date", sortable: true, width: "15%" },
  { title: "Event", key: "event_type", sortable: true, width: "15%" },
  { title: "Quantity", key: "quantity", sortable: true, width: "10%" },
  { title: "Camera", key: "camera", sortable: false, width: "15%" },
  { title: "Location", key: "location", sortable: true, width: "15%" },
  { title: "Notes", key: "notes", sortable: false, width: "20%" },
  { title: "Actions", key: "actions", sortable: false, width: "10%" },
];

const sortedEvents = computed(() => {

  return [...props.events].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
});

// Helper function to get camera by ID
const getCameraById = (cameraId: number) => {
  if (props.cameras) {
    return props.cameras.find(camera => camera.id === cameraId);
  }
  return camerasStore.getCameraById(cameraId);
};
</script>

<template>
  <v-data-table
    :headers="eventHeaders"
    :items="sortedEvents"
    class="elevation-1"
    items-per-page="5"
  >
    <template v-slot:item.date="{ item }">
      {{ formatDate(item.date) }}
    </template>

    <template v-slot:item.event_type="{ item }">
      {{ eventsStore.getEventTypeName(item.film_event_type_id) }}
    </template>

    <template v-slot:item.quantity="{ item }">
      {{ props.filmId ? (eventsStore.getFilmEventAssociation(props.filmId, item.id)?.quantity || '-') : '-' }}
    </template>

    <template v-slot:item.camera="{ item }">
      <div v-if="item.camera_ids && item.camera_ids.length > 0" class="d-flex flex-wrap gap-1">
        <v-chip
          v-for="cameraId in item.camera_ids"
          :key="cameraId"
          size="small"
          :color="getBrandColor(getCameraById(cameraId)?.brand || '') || 'grey'"
          class="ma-1"
        >
          {{ getCameraById(cameraId)?.brand }} {{ getCameraById(cameraId)?.model }}
        </v-chip>
      </div>
      <span v-else>-</span>
    </template>

    <template v-slot:item.notes="{ item }">
      <vue-markdown v-if="item.notes" :source="item.notes" />
    </template>

    <template v-slot:item.actions="{ item }">
      <v-btn
        icon
        @click="emit('removeEvent', item.id)"
        color="error"
        size="small"
      >
        <v-icon>mdi-link-off</v-icon>
      </v-btn>
    </template>
  </v-data-table>
</template>
