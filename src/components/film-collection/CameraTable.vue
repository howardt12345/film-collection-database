<script setup lang="ts">
import { computed } from "vue";
import { Camera } from "@/types/film-collection";
import { formatDate } from "@/utils";

const props = defineProps<{
  cameras: Camera[];
}>();

const emit = defineEmits<{
  (e: "edit", camera: Camera): void;
  (e: "delete", camera: Camera): void;
}>();

const headers = [
  { title: "Brand", key: "brand", sortable: true },
  { title: "Model", key: "model", sortable: true },
  { title: "Serial Number", key: "serial_number", sortable: true },
  { title: "Date Acquired", key: "date_acquired", sortable: true },
  { title: "Date Sold", key: "date_sold", sortable: true },
  { title: "Lens", key: "lens", sortable: true },
  { title: "Film Format", key: "film_format", sortable: true },
  { title: "Actions", key: "actions", sortable: false },
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
    :items-per-page="25"
  >
    <template v-slot:item.date_acquired="{ item }">
      {{ item.date_acquired ? formatDate(item.date_acquired) : "" }}
    </template>

    <template v-slot:item.date_sold="{ item }">
      {{ item.date_sold ? formatDate(item.date_sold) : "" }}
    </template>

    <template v-slot:item.actions="{ item }">
      <v-btn
        icon="mdi-pencil"
        size="small"
        color="primary"
        class="mr-2"
        @click="emit('edit', item)"
      />
      <v-btn
        icon="mdi-delete"
        size="small"
        color="error"
        @click="emit('delete', item)"
      />
    </template>
  </v-data-table>
</template>
