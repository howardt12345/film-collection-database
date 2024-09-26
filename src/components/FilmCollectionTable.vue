<script setup lang="ts">
import { ref, computed } from "vue";
import EventLogTable from "./EventLogTable.vue";
import { Event, FilmCollection } from "@/types/film-collection";
import { formatDate } from "@/utils";
import VueMarkdown from "vue-markdown-render";

type TableFilm = FilmCollection & { latest_event_date: string };

const props = defineProps<{
  films: FilmCollection[];
  uniqueEvents: string[];
}>();

const emit = defineEmits<{
  (e: "edit", film: FilmCollection): void;
  (e: "copy", film: FilmCollection): void;
  (e: "delete", film: FilmCollection): void;
  (e: "addEvent", filmId: number, event: Event): void;
  (e: "editEvent", filmId: number, eventId: string, updatedEvent: Event): void;
  (e: "deleteEvent", filmId: number, eventId: string): void;
  (e: "toggleUsed", filmId: number, used: boolean): void;
}>();

const filmHeaders = [
  { title: "", key: "actions", sortable: false },
  { title: "Used", key: "used", sortable: true },
  { title: "Date Acquired", key: "date_acquired" },
  { title: "Brand", key: "brand" },
  { title: "Name", key: "name" },
  { title: "ISO", key: "iso" },
  { title: "Format", key: "film_format" },
  { title: "Type", key: "film_type" },
  { title: "Expiry Date", key: "expiry_date" },
  { title: "Latest Event Date", key: "latest_event_date", sortable: true },
];

const expandedItem = ref(undefined);
const search = ref("");

const getLatestEventDate = (film: FilmCollection) => {
  if (!film.event_log || film.event_log.length === 0) {
    return null;
  }
  const latestEvent = film.event_log.reduce((latest, current) =>
    latest.date > current.date ? latest : current
  );
  return latestEvent.date;
};

const sortedFilms = computed<TableFilm[]>(() => {
  return props.films.map(
    (film) =>
      ({
        ...film,
        latest_event_date: getLatestEventDate(film) || "1970-01-01", // Use a default date for sorting if no events
      } as TableFilm)
  );
});

const getFilm = (tableFilm: TableFilm) => {
  const { latest_event_date, ...film } = tableFilm;
  return film;
};

const toggleUsed = (item: TableFilm) => {
  emit("toggleUsed", item.id, !item.used);
};
</script>

<template>
  <v-card flat class="pa-0">
    <template v-slot:text>
      <v-text-field
        v-model="search"
        label="Search"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        hide-details
        single-line
      ></v-text-field>
    </template>
    <v-data-table
      :headers="filmHeaders"
      :items="sortedFilms"
      :sort-by="[{ key: 'date_acquired', order: 'desc' }]"
      class="elevation-1"
      show-expand
      v-model:expanded="expandedItem"
      :search="search"
    >
      <template #item.actions="{ item }">
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props" size="small" elevation="0">
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="emit('edit', getFilm(item))">
              <v-list-item-title>
                <v-icon>mdi-pencil</v-icon>
                <span class="ml-2">Edit</span>
              </v-list-item-title>
            </v-list-item>
            <v-list-item @click="emit('copy', getFilm(item))">
              <v-list-item-title>
                <v-icon>mdi-content-copy</v-icon>
                <span class="ml-2">Copy</span>
              </v-list-item-title>
            </v-list-item>
            <v-list-item @click="emit('delete', getFilm(item))">
              <v-list-item-title>
                <v-icon>mdi-delete</v-icon>
                <span class="ml-2">Delete</span>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>

      <template #item.latest_event_date="{ item }">
        {{
          item.latest_event_date !== "1970-01-01"
            ? item.latest_event_date
            : "N/A"
        }}
      </template>

      <template #item.used="{ item }">
        <v-checkbox
          :model-value="item.used"
          @change="toggleUsed(item)"
          hide-details
          dense
        ></v-checkbox>
      </template>

      <template v-slot:expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length">
            <v-container>
              <v-row>
                <v-col cols="1" />
                <v-col cols="3">
                  <strong>Source:</strong> {{ item.source }}
                </v-col>
                <v-col cols="2">
                  <strong>DX Code:</strong> {{ item.dx_code || "N/A" }}
                </v-col>
                <v-col cols="4">
                  <strong>Device:</strong> {{ item.device || "N/A" }}
                </v-col>
                <v-col cols="2">
                  <strong>Created At:</strong> {{ formatDate(item.created_at) }}
                </v-col>
              </v-row>

              <v-row v-if="!!item.notes">
                <v-col cols="1" />
                <v-col cols="11">
                  <h3>Notes</h3>
                  <vue-markdown :source="item.notes" />
                </v-col>
              </v-row>

              <v-row v-if="!!item.album_url">
                <v-col cols="1" />
                <v-col cols="11">
                  <h3>Album URL</h3>
                  <a :href="item.album_url" target="_blank">Album</a>
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="1" />
                <v-col cols="11">
                  <h3>Event Log</h3>
                  <EventLogTable
                    :film="item"
                    :unique-events="uniqueEvents"
                    @add-event="(event: Event) => emit('addEvent', item.id, event)"
                    @edit-event="
                    (eventId: string, updatedEvent: Event) =>
                      emit('editEvent', item.id, eventId, updatedEvent)
                  "
                    @delete-event="
                    (eventId: string) => emit('deleteEvent', item.id, eventId)
                  "
                  />
                </v-col>
              </v-row>
            </v-container>
          </td>
        </tr>
      </template>
    </v-data-table>
  </v-card>
</template>
