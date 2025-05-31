<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useFilmsStore } from '@/stores/films';
import UniqueFilms from '@/components/film-collection/UniqueFilms.vue';

const filmsStore = useFilmsStore();

// Computed properties from stores
const films = computed(() => filmsStore.films);

// Load data on component mount
onMounted(async () => {
  await filmsStore.fetchFilms();
});
</script>

<template>
  <v-container>
    <UniqueFilms :films="films" />
  </v-container>
</template>
