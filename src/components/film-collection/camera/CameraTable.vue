<script setup lang="ts">
import { computed } from "vue";
import { Camera } from "@/types/film-collection";
import { formatDate } from "@/utils";

const props = defineProps<{
  cameras: Camera[];
  // filmEvents: FilmEvent[];
}>();

const emit = defineEmits<{
  (e: "edit", camera: Camera): void;
  (e: "delete", camera: Camera): void;
}>();

const headers = [
  { title: "", key: "actions", sortable: false },
  { title: "Brand", key: "brand", sortable: true },
  { title: "Model", key: "model", sortable: true },
  { title: "Serial Number", key: "serial_number", sortable: true },
  { title: "Date Acquired", key: "date_acquired", sortable: true },
  { title: "Date Sold", key: "date_sold", sortable: true },
  { title: "Lens", key: "lens", sortable: true },
  { title: "Film Format", key: "film_format", sortable: true },
];

const sortedCameras = computed(() =>
  [...props.cameras].sort((a, b) => {
    const brandCompare = a.brand.localeCompare(b.brand);
    if (brandCompare !== 0) return brandCompare;
    return a.model.localeCompare(b.model);
  }),
);
</script>

<template>
  <v-data-table
    :headers="headers"
    :items="sortedCameras"
    class="elevation-1"
    :items-per-page="-1"
  >
    <template v-slot:item.date_acquired="{ item }">
      {{ item.date_acquired ? formatDate(item.date_acquired) : "" }}
    </template>

    <template v-slot:item.date_sold="{ item }">
      {{ item.date_sold ? formatDate(item.date_sold) : "" }}
    </template>

    <template v-slot:item.actions="{ item }">
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
          <v-list-item @click="emit('delete', item)">
            <v-list-item-title>
              <v-icon>mdi-delete</v-icon>
              <span class="ml-2">Delete</span>
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>
  </v-data-table>
</template>
