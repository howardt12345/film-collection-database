<script setup lang="ts">
import { ref } from "vue";
import { Camera, FilmFormat } from "@/types/film-collection";
import CameraForm from "./CameraForm.vue";

const props = defineProps<{
  modelValue: boolean;
  uniqueBrands: string[];
}>();

const defaultCamera = {
  film_format: FilmFormat._35mm,
  date_acquired: new Date(),
};

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "create", camera: Camera): void;
}>();

const newCamera = ref<Partial<Camera>>(defaultCamera);
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    max-width="500"
  >
    <v-card>
      <v-card-title>Add New Camera</v-card-title>
      <v-card-text>
        <CameraForm
          v-model:camera="newCamera"
          :unique-brands="uniqueBrands"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="secondary" @click="emit('update:modelValue', false)">Cancel</v-btn>
        <v-btn color="primary" @click="emit('create', newCamera as Camera)">Create</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
