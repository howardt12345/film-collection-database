<script setup lang="ts">
import { ref, computed } from "vue";
import EventLogTable from "./EventLogTable.vue";
import { Event, FilmCollection } from "@/types/film-collection";
import { formatDate } from "@/utils";
import VueMarkdown from "vue-markdown-render";
import {
  differenceInMonths,
  isBefore,
  isAfter,
  subYears,
  subMonths,
  addMonths,
} from "date-fns"; // Import date-fns for date comparison

type TableFilm = FilmCollection & { latest_event_date: string };

const props = defineProps<{
  films: FilmCollection[];
  uniqueEvents: string[];
}>();

const emit = defineEmits<{
  (e: "edit", film: FilmCollection): void;
  (e: "copy", film: FilmCollection): void;
  (e: "delete", film: FilmCollection): void;
  (e: "addEvent", filmId: number, event: Event): void;
  (e: "editEvent", filmId: number, eventId: string, updatedEvent: Event): void;
  (e: "deleteEvent", filmId: number, eventId: string): void;
  (e: "updateUsed", filmId: number, used: number): void;
}>();

const filmHeaders = [
  { title: "", key: "actions", sortable: false },
  { title: "Quantity", key: "used", sortable: true },
  { title: "Date Acquired", key: "date_acquired" },
  { title: "Brand", key: "brand" },
  { title: "Name", key: "name" },
  { title: "ISO", key: "iso" },
  { title: "Format", key: "film_format" },
  { title: "Type", key: "film_type" },
  { title: "Expiry Date", key: "expiry_date" },
  { title: "Latest Event Date", key: "latest_event_date", sortable: true },
];

const expandedItem = ref(undefined);
const search = ref("");

const getLatestEventDate = (film: FilmCollection) => {
  if (!film.event_log || film.event_log.length === 0) {
    return null;
  }
  const latestEvent = film.event_log.reduce((latest, current) =>
    latest.date > current.date ? latest : current
  );
  return latestEvent.date;
};

const sortedFilms = computed<TableFilm[]>(() => {
  return props.films.map(
    (film) =>
      ({
        ...film,
        latest_event_date: getLatestEventDate(film) || "1970-01-01",
      } as TableFilm)
  );
});

const getFilm = (tableFilm: TableFilm) => {
  const { latest_event_date, ...film } = tableFilm;
  return film;
};

const updateUsed = (item: TableFilm, increment: number) => {
  const newUsed = Math.max(
    0,
    Math.min(item.quantity ?? 0, (item.used ?? 0) + increment)
  );
  emit("updateUsed", item.id, newUsed);
};

const getBrandColor = (brand: string) => {
  const brandColors: { [key: string]: string } = {
    'Kodak': 'yellow darken-2',
    'Fuji': 'green darken-2',
    'Cinestill': 'red darken-2',
    'Konica': 'blue darken-2',
    'Ilford': 'grey darken-3',
    'Lomo': 'purple darken-2',
    'Harman': 'orange darken-2',
    'Popho': 'pink lighten-2'
  };

  const lowercaseBrand = brand.toLowerCase();
  for (const [key, color] of Object.entries(brandColors)) {
    if (lowercaseBrand.includes(key.toLowerCase())) {
      return color;
    }
  }
  return '';
};

// Updated function to determine film name color using partial matching
const getFilmNameColor = (name: string) => {
  const nameColors: { [key: string]: string } = {
    'ColorPlus': 'amber lighten-2',
    'Acros': 'grey lighten-3',
    'Superia': 'green lighten-2',
    'Provia': 'blue lighten-2',
    'Velvia': 'red accent-2',
    'Astia': 'orange lighten-2',
    'NPH': 'deep-purple lighten-3',
    'Ektachrome': 'cyan lighten-2',
    'Centuria': 'purple lighten-2',
    'Fujicolor': 'light-green lighten-2',
    'Pro 400H': 'teal lighten-2',
    'Ultramax': 'blue lighten-2',
    'Portra': 'pink lighten-3',
    'Ektar': 'red lighten-2',
    '800T': 'light-blue lighten-2',
    'T-Max': 'blue-grey lighten-2',
    'Pan F': 'grey darken-1',
    'Kentmere': 'brown lighten-2',
    'Simply Ace': 'lime lighten-2',
    'Berlin': 'grey darken-2',
    'Metropolis': 'amber darken-2'
  };

  const lowercaseName = name.toLowerCase();
  for (const [key, color] of Object.entries(nameColors)) {
    if (lowercaseName.includes(key.toLowerCase())) {
      return color;
    }
  }
  return '';
};

// Function to get the number of months until the expiry date
const getExpiryStatus = (expiryDate: string | undefined) => {
  if (!expiryDate) {
    return "Unknown expiry date";
  }
  const now = new Date();
  const expiry = new Date(expiryDate);
  const monthsDiff = differenceInMonths(expiry, now);

  if (monthsDiff > 12) {
    const yearsDiff = Math.floor(monthsDiff / 12);
    return `${yearsDiff} year${yearsDiff > 1 ? "s" : ""} left`;
  } else if (monthsDiff > 1) {
    return `${monthsDiff} months left`;
  } else if (monthsDiff === 1) {
    return "1 month left";
  } else if (monthsDiff === 0) {
    return "Expires this month";
  } else {
    const pastMonths = Math.abs(monthsDiff);
    if (pastMonths > 12) {
      const pastYears = Math.floor(pastMonths / 12);
      return `Expired ${pastYears} year${pastYears > 1 ? "s" : ""} ago`;
    } else if (pastMonths === 1) {
      return `Expired 1 month ago`;
    } else {
      return `Expired ${pastMonths} months ago`;
    }
  }
};

// Function to determine the CSS class based on the expiry date
const getExpiryDateClass = (expiryDate: string | undefined) => {
  if (!expiryDate) {
    return "text-error"; // No expiry date -> text-error
  }

  const now = new Date();
  const expiry = new Date(expiryDate);

  // Calculate the range 6 months before and after the current date
  const sixMonthsBefore = subMonths(now, 6);
  const sixMonthsAfter = addMonths(now, 6);

  // Check if the expiry date is within 6 months before or after the current date
  if (isAfter(expiry, sixMonthsBefore) && isBefore(expiry, sixMonthsAfter)) {
    return "text-primary"; // Expiry date is within 6 months of the current date
  }

  if (isAfter(expiry, now)) {
    // Expiry date is in the future but not within 6 months
    return "text-secondary"; // Expiry date is in the future
  } else {
    // Expiry date is in the past but not within 6 months
    const tenYearsAgo = subYears(now, 10);
    return isBefore(expiry, tenYearsAgo) ? "text-error" : "text-warning"; // More than 10 years ago -> text-error, otherwise text-warning
  }
};

</script>

<template>
  <v-card flat class="pa-0">
    <template v-slot:text>
      <v-text-field
        v-model="search"
        label="Search"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        hide-details
        single-line
      ></v-text-field>
    </template>
    <v-data-table
      :headers="filmHeaders"
      :items="sortedFilms"
      :sort-by="[{ key: 'date_acquired', order: 'desc' }]"
      class="elevation-1"
      show-expand
      v-model:expanded="expandedItem"
      :search="search"
    >
      <template #item.actions="{ item }">
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props" size="small" elevation="0">
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="emit('edit', getFilm(item))">
              <v-list-item-title>
                <v-icon>mdi-pencil</v-icon>
                <span class="ml-2">Edit</span>
              </v-list-item-title>
            </v-list-item>
            <v-list-item @click="emit('copy', getFilm(item))">
              <v-list-item-title>
                <v-icon>mdi-content-copy</v-icon>
                <span class="ml-2">Copy</span>
              </v-list-item-title>
            </v-list-item>
            <v-list-item @click="emit('delete', getFilm(item))">
              <v-list-item-title>
                <v-icon>mdi-delete</v-icon>
                <span class="ml-2">Delete</span>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>

      <template #item.brand="{ item }">
        <v-chip
          :color="getBrandColor(item.brand)"
          :text-color="getBrandColor(item.brand) ? 'white' : ''"
          small
        >
          {{ item.brand }}
        </v-chip>
      </template>

      <template #item.name="{ item }">
        <v-chip
          :color="getFilmNameColor(item.name)"
          :text-color="getFilmNameColor(item.name) ? 'white' : ''"
          small
        >
          {{ item.name }}
        </v-chip>
      </template>

      <template #item.expiry_date="{ item }">
        <v-tooltip
          :text="getExpiryStatus(item.expiry_date)"
          location="top"
        >
          <template v-slot:activator="{ props }">
            <span
              :class="getExpiryDateClass(item.expiry_date)"
              v-bind="props"
              >{{ item.expiry_date || "N/A" }}</span
            >
          </template>
        </v-tooltip>
      </template>

      <template #item.latest_event_date="{ item }">
        {{
          item.latest_event_date !== "1970-01-01"
            ? item.latest_event_date
            : "N/A"
        }}
      </template>

      <template #item.used="{ item }">
        <v-tooltip
          :text="`${item.quantity - (item.used ?? 0)} remaining`"
          location="top"
        >
          <template v-slot:activator="{ props }">
            <div class="d-flex align-center" v-bind="props">
              <v-btn
                icon
                size="x-small"
                @click="updateUsed(item, -1)"
                :disabled="(item.used ?? 0) <= 0"
              >
                <v-icon>mdi-minus</v-icon>
              </v-btn>
              <span
                class="mx-2 text-no-wrap"
                :class="
                  item.used === item.quantity
                    ? 'text-success'
                    : item.used < item.quantity && item.used > 0
                    ? 'text-primary'
                    : 'primary'
                "
                >{{ item.used }} / {{ item.quantity }}
              </span>
              <v-btn
                icon
                size="x-small"
                @click="updateUsed(item, 1)"
                :disabled="(item.used ?? 0) >= (item.quantity ?? 0)"
              >
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </div>
          </template>
        </v-tooltip>
      </template>

      <template v-slot:expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length">
            <v-container>
              <v-row>
                <v-col cols="1">
                  <!-- Album URL Icon Button -->
                  <v-btn
                    v-if="item.album_url"
                    :href="item.album_url"
                    target="_blank"
                    icon
                    variant="outlined"
                    size="small"
                    elevation="0"
                  >
                    <v-icon>mdi-album</v-icon>
                  </v-btn>
                </v-col>
                <v-col cols="3">
                  <strong>Source:</strong> {{ item.source }}
                </v-col>
                <v-col cols="2">
                  <strong>DX Code:</strong> {{ item.dx_code || "N/A" }}
                </v-col>
                <v-col cols="4">
                  <strong>Device:</strong> {{ item.device || "N/A" }}
                </v-col>
                <v-col cols="2">
                  <strong>Created At:</strong> {{ formatDate(item.created_at) }}
                </v-col>
              </v-row>

              <v-row v-if="!!item.notes">
                <v-col cols="1" />
                <v-col cols="11">
                  <h3>Notes</h3>
                  <vue-markdown :source="item.notes" />
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="1" />
                <v-col cols="11">
                  <h3>Event Log</h3>
                  <EventLogTable
                    :film="item"
                    :unique-events="uniqueEvents"
                    @add-event="(event: Event) => emit('addEvent', item.id, event)"
                    @edit-event="
                    (eventId: string, updatedEvent: Event) =>
                      emit('editEvent', item.id, eventId, updatedEvent)
                  "
                    @delete-event="
                    (eventId: string) => emit('deleteEvent', item.id, eventId)
                  "
                  />
                </v-col>
              </v-row>
            </v-container>
          </td>
        </tr>
      </template>
    </v-data-table>
  </v-card>
</template>
