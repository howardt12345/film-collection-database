<script setup lang="ts">
import { Camera, FilmFormat } from "@/types/film-collection";

const props = defineProps<{
  camera: Partial<Camera>;
  uniqueBrands: string[];
}>();

const emit = defineEmits<{
  (e: "update:camera", value: Partial<Camera>): void;
}>();

const updateField = (field: keyof Camera, value: any) => {
  emit("update:camera", { ...props.camera, [field]: value });
};
</script>

<template>
  <v-form @submit.prevent>
    <v-combobox
      :model-value="camera.brand"
      @update:model-value="updateField('brand', $event)"
      :items="uniqueBrands"
      label="Brand"
      required
      clearable
      allow-new-values
    ></v-combobox>

    <v-text-field
      :model-value="camera.model"
      @update:model-value="updateField('model', $event)"
      label="Model"
      required
    ></v-text-field>

    <v-text-field
      :model-value="camera.serial_number"
      @update:model-value="updateField('serial_number', $event)"
      label="Serial Number"
    ></v-text-field>

    <v-text-field
      :model-value="
        camera.date_acquired
          ? new Date(camera.date_acquired).toISOString().split('T')[0]
          : ''
      "
      @update:model-value="updateField('date_acquired', $event)"
      label="Date Acquired"
      type="date"
      required
    ></v-text-field>

    <v-text-field
      :model-value="
        camera.date_sold
          ? new Date(camera.date_sold).toISOString().split('T')[0]
          : ''
      "
      @update:model-value="updateField('date_sold', $event)"
      label="Date Sold"
      type="date"
      clearable
    ></v-text-field>

    <v-text-field
      :model-value="camera.lens"
      @update:model-value="updateField('lens', $event)"
      label="Lens"
    ></v-text-field>

    <v-select
      :model-value="camera.film_format"
      @update:model-value="updateField('film_format', $event)"
      :items="Object.entries(FilmFormat)"
      label="Film Format"
      item-title="[1]"
      item-value="[1]"
      required
    ></v-select>

    <v-textarea
      :model-value="camera.notes"
      @update:model-value="updateField('notes', $event)"
      label="Notes"
      rows="3"
    ></v-textarea>
  </v-form>
</template>
