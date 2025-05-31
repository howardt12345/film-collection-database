<script setup lang="ts">
import { computed } from "vue";
import VueMarkdown from "vue-markdown-render";
import { Event } from "@/types/film-collection";
import { useDateFormatting } from "@/composables/useDateFormatting";
import { useEventsStore } from "@/stores/events";

const { formatDate } = useDateFormatting();
const eventsStore = useEventsStore();

const props = defineProps<{
  events: Event[];
  filmId?: number;
}>();

const emit = defineEmits<{
  (e: "removeEvent", eventId: number): void;
}>();

const eventHeaders = [
  { title: "Date", key: "date", sortable: true, width: "20%" },
  { title: "Event", key: "event_type", sortable: true, width: "20%" },
  { title: "Quantity", key: "quantity", sortable: true, width: "10%" },
  { title: "Location", key: "location", sortable: true, width: "20%" },
  { title: "Notes", key: "notes", sortable: false, width: "auto" },
  { title: "Actions", key: "actions", sortable: false, width: "10%" },
];

const sortedEvents = computed(() => {
  console.log("FilmEventLogTable - Events received:", props.events);
  return [...props.events].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
});
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
