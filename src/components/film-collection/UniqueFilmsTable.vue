<script setup lang="ts">
import { computed } from "vue";
import { FilmEntry } from "@/types/film-collection";
import { getBrandColor, getFilmNameColor } from "@/utils/colors";

const props = defineProps<{
  films: FilmEntry[];
}>();

interface UniqueFilm {
  brand: string;
  name: string;
  iso: number;
  film_type: string;
  film_format: string;
  totalQuantity: number;
  totalUsed: number;
}

const uniqueFilms = computed(() => {
  const filmMap = new Map<string, UniqueFilm>();

  props.films.forEach((film) => {
    const key = `${film.brand}-${film.name}-${film.iso}-${film.film_type}-${film.film_format}`;

    if (!filmMap.has(key)) {
      filmMap.set(key, {
        brand: film.brand,
        name: film.name,
        iso: film.iso,
        film_type: film.film_type,
        film_format: film.film_format,
        totalQuantity: film.quantity || 0,
        totalUsed: film.used || 0,
      });
    } else {
      const existing = filmMap.get(key)!;
      existing.totalQuantity += film.quantity || 0;
      existing.totalUsed += film.used || 0;
    }
  });

  return Array.from(filmMap.values());
});

const headers = [
  { title: "Brand", key: "brand", sortable: true },
  { title: "Name", key: "name", sortable: true },
  { title: "ISO", key: "iso", sortable: true },
  { title: "Type", key: "film_type", sortable: true },
  { title: "Format", key: "film_format", sortable: true },
  {
    title: "Available",
    key: "available",
    sortable: true,
    value: (item: UniqueFilm) => item.totalQuantity - item.totalUsed,
  },
  {
    title: "Used",
    key: "used",
    sortable: true,
    value: (item: UniqueFilm) => item.totalUsed,
  },
  {
    title: "Total",
    key: "total",
    sortable: true,
    value: (item: UniqueFilm) => item.totalQuantity,
  },
];
</script>

<template>
  <v-data-table
    :headers="headers"
    :items="uniqueFilms"
    class="elevation-1"
    :items-per-page="25"
  >
    <template v-slot:item.brand="{ item }">
      <v-chip size="small" :color="getBrandColor(item.brand)">
        {{ item.brand }}
      </v-chip>
    </template>

    <template v-slot:item.name="{ item }">
      <v-chip size="small" :color="getFilmNameColor(item.name)">
        {{ item.name }}
      </v-chip>
    </template>

    <template v-slot:item.available="{ item }">
      <span
        :class="
          item.totalQuantity - item.totalUsed === 0
            ? 'text-error'
            : item.totalQuantity - item.totalUsed < 3
              ? 'text-warning'
              : 'text-success'
        "
      >
        {{ item.totalQuantity - item.totalUsed }}
      </span>
    </template>

    <template v-slot:item.used="{ item }">
      <span>{{ item.totalUsed }}</span>
    </template>

    <template v-slot:item.total="{ item }">
      <span>{{ item.totalUsed }} / {{ item.totalQuantity }}</span>
    </template>
  </v-data-table>
</template>
