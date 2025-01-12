<script setup lang="ts">
import { ref, computed } from "vue";
import { Event, FilmEntry } from "@/types/film-collection";
import VueMarkdown from "vue-markdown-render";
import { getBrandColor, getFilmNameColor } from "@/utils/colors";
import { formatDate } from "@/utils";
import EditEventDialog from "./EditEventDialog.vue";

const props = defineProps<{
  events: (Event & { film_ids: number[] })[];
  uniqueEvents: string[];
  uniqueLocations: string[];
  films: FilmEntry[];
}>();

const emit = defineEmits<{
  (e: "addEvent", filmId: number, event: Omit<Event, "id">): void;
  (e: "deleteEvent", filmId: number, eventId: number): void;
  (e: "updateEvent", eventId: number, event: Omit<Event, "id">): void;
  (e: "removeEvent", eventId: number): void;
  (e: "editFilmsOnEvent", eventId: number, filmIds: number[]): void;
  (e: "addEvent", filmId: number, event: Omit<Event, "id">): void;
}>();

const eventHeaders = [
  { title: "", key: "actions", sortable: false },
  { title: "Date", key: "date", sortable: true, width: "20%" },
  { title: "Event Type", key: "event_type", sortable: true, width: "20%" },
  { title: "Location", key: "location", sortable: true, width: "20%" },
  { title: "Notes", key: "notes", sortable: false, width: "35%" },
  { title: "Associated Films", key: "films", sortable: false, width: "25%" },
];

// Edit dialog state
const editDialog = ref(false);
const editingEvent = ref<Event | null>(null);

const sortedEvents = computed(() =>
  [...(props.events || [])].sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return b.date.getTime() - a.date.getTime();
  }),
);

const sortedFilms = computed(() =>
  [...props.films].sort((a, b) => {
    const dateCompare = b.date_acquired.getTime() - a.date_acquired.getTime();
    if (dateCompare !== 0) return dateCompare;
    const brandCompare = a.brand.localeCompare(b.brand);
    if (brandCompare !== 0) return brandCompare;
    return a.name.localeCompare(b.name);
  }),
);

const getAssociatedFilms = (eventId: number) => {
  const event = props.events?.find((e) => e.id === eventId);
  if (!event?.film_ids) return [];
  return props.films.filter((film) => event.film_ids.includes(film.id));
};

const openEditDialog = (event: Event) => {
  editingEvent.value = event;
  editDialog.value = true;
};

const handleSaveEdit = (updatedEvent: Omit<Event, "id">, filmIds: number[]) => {
  if (editingEvent.value) {
    emit("updateEvent", editingEvent.value.id, updatedEvent);
    emit("editFilmsOnEvent", editingEvent.value.id, filmIds);
  }
};

const deleteDialog = ref(false);
const eventToDelete = ref<Event | null>(null);

const confirmDelete = (event: Event) => {
  eventToDelete.value = event;
  deleteDialog.value = true;
};

const handleDelete = () => {
  if (eventToDelete.value) {
    emit("removeEvent", eventToDelete.value.id);
    deleteDialog.value = false;
    eventToDelete.value = null;
  }
};

const copyDialog = ref(false);
const copyingEvent = ref<Event | null>(null);

const openCopyDialog = (event: Event) => {
  copyingEvent.value = {
    ...event,
    date: new Date(),
  };
  copyDialog.value = true;
};

const handleCopy = (newEvent: Omit<Event, "id">, filmIds: number[]) => {
  emit("addEvent", filmIds[0], newEvent);
  copyDialog.value = false;
  copyingEvent.value = null;
};
</script>

<template>
  <v-data-table
    :headers="eventHeaders"
    :items="sortedEvents"
    class="elevation-1"
    :items-per-page="25"
  >
    <template v-slot:item.date="{ item }">
      {{ formatDate(item.date) }}
    </template>

    <template v-slot:item.event_type="{ item }">
      {{ item.event_type }}
    </template>

    <template v-slot:item.location="{ item }">
      {{ item.location }}
    </template>

    <template v-slot:item.notes="{ item }">
      <vue-markdown v-if="item.notes" :source="item.notes" />
    </template>

    <template v-slot:item.films="{ item }">
      <div class="d-flex flex-wrap gap-1 my-2">
        <v-chip
          v-for="film in getAssociatedFilms(item.id)"
          :key="film.id"
          class="ma-1"
          size="small"
          :color="getFilmNameColor(film.name) || getBrandColor(film.brand)"
        >
          {{ formatDate(film.date_acquired) }}: {{ film.brand }} {{ film.name }}
        </v-chip>
      </div>
    </template>

    <template v-slot:item.actions="{ item }">
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props" size="small" elevation="0">
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="openEditDialog(item)">
            <v-list-item-title>
              <v-icon>mdi-pencil</v-icon>
              <span class="ml-2">Edit</span>
            </v-list-item-title>
          </v-list-item>
          <v-list-item @click="openCopyDialog(item)">
            <v-list-item-title>
              <v-icon>mdi-content-copy</v-icon>
              <span class="ml-2">Copy</span>
            </v-list-item-title>
          </v-list-item>
          <v-list-item @click="confirmDelete(item)">
            <v-list-item-title>
              <v-icon>mdi-delete</v-icon>
              <span class="ml-2">Delete</span>
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>
  </v-data-table>

  <EditEventDialog
    v-model="copyDialog"
    :event="copyingEvent"
    :unique-events="uniqueEvents"
    :unique-locations="uniqueLocations"
    :films="films"
    :associated-film-ids="[]"
    @save="handleCopy"
  />

  <v-dialog v-model="deleteDialog" max-width="500">
    <v-card>
      <v-card-title class="headline">Confirm Delete</v-card-title>
      <v-card-text>
        Are you sure you want to delete this event? This will remove it from all
        associated films.
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="secondary" @click="deleteDialog = false">Cancel</v-btn>
        <v-btn color="error" @click="handleDelete">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
