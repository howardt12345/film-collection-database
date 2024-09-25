<script setup lang="ts">
import { FilmCollection } from "@/types/film-collection";

defineProps<{
  films: FilmCollection[];
}>();

const emit = defineEmits<{
  (e: "edit", film: FilmCollection): void;
  (e: "copy", film: FilmCollection): void;
  (e: "delete", film: FilmCollection): void;
}>();

const headers = [
  { title: "", key: "actions", sortable: false },
  { title: "Date Acquired", key: "date_acquired" },
  { title: "Brand", key: "brand" },
  { title: "Name", key: "name" },
  { title: "ISO", key: "iso" },
  { title: "Format", key: "film_format" },
  { title: "Type", key: "film_type" },
  { title: "Expiry Date", key: "expiry_date" },
  { title: "Album URL", key: "album_url" },
];

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString();
};
</script>

<template>
  <v-data-table
    :headers="headers"
    :items="films"
    :sort-by="[{ key: 'date_acquired', order: 'desc' }]"
    class="elevation-1"
    show-expand
  >
    <template #item.actions="{ item }">
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props" size="small" elevation="0">
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="emit('edit', item)">
            <v-list-item-title>
              <v-icon>mdi-pencil</v-icon>
              <span class="ml-2">Edit</span>
            </v-list-item-title>
          </v-list-item>
          <v-list-item @click="emit('copy', item)">
            <v-list-item-title>
              <v-icon>mdi-content-copy</v-icon>
              <span class="ml-2">Copy</span>
            </v-list-item-title>
          </v-list-item>
          <v-list-item @click="emit('delete', item)">
            <v-list-item-title>
              <v-icon>mdi-delete</v-icon>
              <span class="ml-2">Delete</span>
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>
    <template #item.album_url="{ item }">
      <a v-if="item.album_url" :href="item.album_url" target="_blank">Album</a>
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
            <v-row v-if="item.event_log && item.event_log.length > 0">
              <v-col cols="1" />
              <v-col cols="11">
                <strong>Event Log:</strong>
                <ul>
                  <li
                    v-for="event in item.event_log"
                    :key="event.date.toString()"
                  >
                    {{ event.date }} - {{ event.event }}
                  </li>
                </ul>
              </v-col>
            </v-row>
          </v-container>
        </td>
      </tr>
    </template>
  </v-data-table>
</template>
