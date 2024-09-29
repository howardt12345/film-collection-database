<script setup lang="ts">
import { FilmCollection, FilmType, FilmFormat } from "@/types/film-collection";

const props = defineProps<{
  film: Partial<FilmCollection>;
  uniqueNames: string[];
  uniqueBrands: string[];
  uniqueSources: string[];
}>();

const emit = defineEmits<{
  (e: "update:film", value: Partial<FilmCollection>): void;
}>();

const updateField = (field: keyof FilmCollection, value: any) => {
  emit("update:film", { ...props.film, [field]: value });
};
</script>

<template>
  <v-form @submit.prevent>
    <v-text-field
      :model-value="film.date_acquired"
      @update:model-value="updateField('date_acquired', $event)"
      label="Date Acquired"
      type="date"
      required
    ></v-text-field>
    <v-combobox
      :model-value="film.brand"
      @update:model-value="updateField('brand', $event)"
      :items="uniqueBrands"
      label="Brand"
      required
      clearable
      allow-new-values
      :rules="[(v) => !!v || 'Brand is required']"
    ></v-combobox>
    <v-combobox
      :model-value="film.name"
      @update:model-value="updateField('name', $event)"
      :items="uniqueNames"
      label="Name"
      required
      clearable
      allow-new-values
      :rules="[(v) => !!v || 'Name is required']"
    ></v-combobox>
    <v-text-field
      :model-value="film.iso"
      @update:model-value="updateField('iso', Number($event))"
      label="ISO"
      type="number"
      required
    ></v-text-field>
    <v-select
      :model-value="film.film_format"
      @update:model-value="updateField('film_format', $event as FilmFormat)"
      :items="Object.entries(FilmFormat)"
      label="Film Format"
      item-title="[1]"
      item-value="[1]"
      required
    ></v-select>
    <v-select
      :model-value="film.film_type"
      @update:model-value="updateField('film_type', $event as FilmType)"
      :items="Object.entries(FilmType)"
      label="Film Type"
      item-title="[1]"
      item-value="[1]"
      required
    ></v-select
    ><v-text-field
      :model-value="film.quantity"
      @update:model-value="updateField('quantity', Number($event))"
      label="Quantity"
      type="number"
      min="0"
      required
    ></v-text-field>
    <v-text-field
      :model-value="film.used"
      @update:model-value="updateField('used', Number($event))"
      label="Used"
      type="number"
      min="0"
      :max="film.quantity"
      required
    ></v-text-field>
    <v-combobox
      :model-value="film.source"
      @update:model-value="updateField('source', $event)"
      :items="uniqueSources"
      label="Source"
      clearable
      allow-new-values
    ></v-combobox>
    <v-text-field
      :model-value="film.expiry_date"
      @update:model-value="updateField('expiry_date', $event)"
      label="Expiry Date (YYYY-MM) (Optional)"
      type="month"
    ></v-text-field>
    <v-text-field
      :model-value="film.device"
      @update:model-value="updateField('device', $event)"
      label="Device (Optional)"
    ></v-text-field>
    <v-text-field
      :model-value="film.dx_code"
      @update:model-value="updateField('dx_code', $event)"
      label="DX Code (Optional)"
    ></v-text-field>
    <v-text-field
      :model-value="film.album_url"
      @update:model-value="updateField('album_url', $event)"
      label="Album URL (Optional)"
    ></v-text-field>
    <v-textarea
      :model-value="film.notes"
      @update:model-value="updateField('notes', $event)"
      label="Notes (Optional)"
    ></v-textarea>
  </v-form>
</template>
