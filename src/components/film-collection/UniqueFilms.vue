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

interface BrandFilmStats {
  brand: string;
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

  return Array.from(filmMap.values()).sort((a, b) => {
    const availableDiff =
      b.totalQuantity - b.totalUsed - (a.totalQuantity - a.totalUsed);
    if (availableDiff !== 0) return availableDiff;
    if (a.film_format !== b.film_format) return a.film_format.localeCompare(b.film_format);
    if (a.brand !== b.brand) return a.brand.localeCompare(b.brand);
    return a.name.localeCompare(b.name);
  });
});

const filmsByBrand = computed(() => {
  const brandMap = new Map<string, BrandFilmStats>();

  props.films.forEach((film) => {
    if (!brandMap.has(film.brand)) {
      brandMap.set(film.brand, {
        brand: film.brand,
        totalQuantity: film.quantity || 0,
        totalUsed: film.used || 0,
      });
    } else {
      const existing = brandMap.get(film.brand)!;
      existing.totalQuantity += film.quantity || 0;
      existing.totalUsed += film.used || 0;
    }
  });

  return Array.from(brandMap.values()).sort((a, b) => {
    const availableDiff =
      b.totalQuantity - b.totalUsed - (a.totalQuantity - a.totalUsed);
    if (availableDiff !== 0) return availableDiff;
    return a.brand.localeCompare(b.brand);
  });
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

const brandHeaders = [
  { title: "Brand", key: "brand", sortable: true },
  {
    title: "Available",
    key: "available",
    sortable: true,
    value: (item: BrandFilmStats) => item.totalQuantity - item.totalUsed,
  },
  {
    title: "Used",
    key: "used",
    sortable: true,
    value: (item: BrandFilmStats) => item.totalUsed,
  },
  {
    title: "Total",
    key: "total",
    sortable: true,
    value: (item: BrandFilmStats) => item.totalQuantity,
  },
];
</script>

<template>
  <v-data-table
    :headers="brandHeaders"
    :items="filmsByBrand"
    class="elevation-1"
    :items-per-page="5"
  >
    <template v-slot:top>
      <v-toolbar flat>
        <v-toolbar-title>Available Films by Brand</v-toolbar-title>
      </v-toolbar>
    </template>
    <template v-slot:item.brand="{ item }">
      <v-chip size="small" :color="getBrandColor(item.brand)">
        {{ item.brand }}
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

  <v-data-table
    :headers="headers"
    :items="uniqueFilms"
    class="elevation-1"
    :items-per-page="-1"
  >
    <template v-slot:top>
      <v-toolbar flat>
        <v-toolbar-title>Available Unique Films</v-toolbar-title>
      </v-toolbar>
    </template>
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
