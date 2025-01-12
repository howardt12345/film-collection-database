<script setup lang="ts">
import { computed } from "vue";
import VueMarkdown from "vue-markdown-render";
import { Event } from "@/types/film-collection";
import { formatDate } from "@/utils";

const props = defineProps<{
  events: Event[];
}>();

const emit = defineEmits<{
  (e: "removeEvent", eventId: number): void;
}>();

const eventHeaders = [
  { title: "Date", key: "date", sortable: true, width: "27%" },
  { title: "Event", key: "event_type", sortable: true, width: "25%" },
  { title: "Location", key: "location", sortable: true, width: "25%" },
  { title: "Notes", key: "notes", sortable: false, width: "auto" },
  { title: "Actions", key: "actions", sortable: false, width: "15%" },
];

const sortedEvents = computed(() =>
  [...props.events].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
);
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
      {{ item.event_type }}
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
