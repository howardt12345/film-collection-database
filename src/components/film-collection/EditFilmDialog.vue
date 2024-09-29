<script setup lang="ts">
import { ref, watch } from 'vue'
import { FilmCollection } from '@/types/film-collection'
import FilmForm from './FilmForm.vue'

const props = defineProps<{
  modelValue: boolean
  film: FilmCollection | null
  uniqueNames: string[]
  uniqueBrands: string[]
  uniqueSources: string[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', film: FilmCollection): void
}>()

const editingFilm = ref<FilmCollection | null>(null)

watch(() => props.film, (newFilm) => {
  if (newFilm) {
    editingFilm.value = { ...newFilm }
  }
}, { immediate: true })

const updateFilm = (updatedFields: Partial<FilmCollection>) => {
  if (editingFilm.value) {
    editingFilm.value = { ...editingFilm.value, ...updatedFields }
  }
}

const saveFilm = () => {
  if (editingFilm.value) {
    emit('save', editingFilm.value)
  }
  emit('update:modelValue', false)
}
</script>

<template>
  <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" max-width="500">
    <v-card>
      <v-card-title class="mt-2 ml-2">Edit Film Entry</v-card-title>
      <v-card-text>
        <FilmForm
          v-if="editingFilm"
          :film="editingFilm"
          @update:film="updateFilm"
          :unique-names="uniqueNames"
          :unique-brands="uniqueBrands"
          :unique-sources="uniqueSources"
        />
      </v-card-text>
      <v-card-actions>
        <v-btn color="secondary" @click="emit('update:modelValue', false)">Cancel</v-btn>
        <v-btn color="primary" @click="saveFilm">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
