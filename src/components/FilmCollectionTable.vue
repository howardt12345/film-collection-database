<script setup lang="ts">
import { FilmCollection } from "@/types/film-collection";
import { watch, ref } from "vue";

defineProps<{
  films: FilmCollection[];
}>();

const emit = defineEmits<{
  (e: "select", film: FilmCollection | undefined): void;
  (e: "showEventLog", film: FilmCollection): void;
}>();

const headers = [
  { title: "Date Acquired", key: "date_acquired" },
  { title: "Brand", key: "brand" },
  { title: "Name", key: "name" },
  { title: "ISO", key: "iso" },
  { title: "Format", key: "film_format" },
  { title: "Type", key: "film_type" },
  { title: "Expiry Date", key: "expiry_date" },
  { title: "Source", key: "source" },
  { title: "Event Log", key: "event_log" },
  { title: "Device", key: "device" },
  { title: "DX Code", key: "dx_code" },
  { title: "Album URL", key: "album_url" },
];

const selectedFilms = ref<FilmCollection[]>([]);

watch(selectedFilms, (film: FilmCollection[]) => {
  emit("select", film[0]);
});
</script>

<template>
  <v-data-table
    v-model="selectedFilms"
    :headers="headers"
    :items="films"
    :sort-by="[{ key: 'date_acquired', order: 'desc' }]"
    class="elevation-1"
    show-select
    select-strategy="single"
    return-object
  >
    <template #item.date_acquired="{ item }">
      {{ item.date_acquired }}
    </template>
    <template #item.event_log="{ item }">
      <v-btn @click="emit('showEventLog', item)">View Events</v-btn>
    </template>
    <template #item.album_url="{ item }">
      <a v-if="item.album_url" :href="item.album_url" target="_blank">Album</a>
    </template>
  </v-data-table>
</template>
