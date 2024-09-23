<script setup lang="ts">
import { ref } from "vue";
import { FilmCollection, FilmType, FilmFormat } from "@/types/film-collection";
import FilmForm from "./FilmForm.vue";

defineProps<{
  modelValue: boolean;
  uniqueNames: string[];
  uniqueBrands: string[];
  uniqueSources: string[];
}>();

const defaultFilm = {
  film_type: FilmType.color,
  film_format: FilmFormat._35mm,
  iso: 100,
  date_acquired: new Date(),
};

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "create", film: FilmCollection): void;
}>();

const newFilm = ref<Partial<FilmCollection>>(defaultFilm);

const createNewFilm = () => {
  emit("create", newFilm.value as FilmCollection);
  newFilm.value = defaultFilm;
};
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    max-width="500"
  >
    <v-card>
      <v-card-title class="mt-2 ml-2">Add New Film Entry</v-card-title>
      <v-card-text>
        <FilmForm
          v-model:film="newFilm"
          :unique-names="uniqueNames"
          :unique-brands="uniqueBrands"
          :unique-sources="uniqueSources"
        />
      </v-card-text>
      <v-card-actions>
        <v-btn color="secondary" @click="emit('update:modelValue', false)"
          >Cancel</v-btn
        >
        <v-btn color="primary" @click="createNewFilm">Create</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
