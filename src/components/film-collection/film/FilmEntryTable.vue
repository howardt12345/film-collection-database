<script setup lang="ts">
import { ref, computed, watch } from "vue";
import FilmEventLogTable from "./FilmEventLogTable.vue";
import { Event, FilmEntry } from "@/types/film-collection";
import { useDateFormatting } from "@/composables/useDateFormatting";
import { useEventsStore } from "@/stores/events";
import VueMarkdown from "vue-markdown-render";

const eventsStore = useEventsStore();

const { formatDate } = useDateFormatting();
import {
  differenceInMonths,
  isBefore,
  isAfter,
  subYears,
  subMonths,
  addMonths,
} from "date-fns";
import { getBrandColor, getFilmNameColor } from "@/utils/colors";
import AddEventToFilmDialog from "./AddEventToFilmDialog.vue";

const props = defineProps<{
  films: FilmEntry[];
  eventsByFilm: Record<number, Event[]>;
  search?: string;
}>();

const emit = defineEmits<{
  (e: "edit", film: FilmEntry): void;
  (e: "copy", film: FilmEntry): void;
  (e: "delete", film: FilmEntry): void;
  (e: "removeEventFromFilm", filmId: number, eventId: number): void;
  (e: "addExistingEventToFilm", filmId: number, eventId: number, quantity?: number): void;
  (
    e: "createAndAddEventToFilm",
    filmId: number,
    event: Omit<Event, "id"> & { quantity?: number },
  ): void;
  (e: "updateUsed", filmId: number, used: number): void;
  (e: "searchChange", value: string): void;
}>();

const filmHeaders = [
  { title: "", key: "actions", sortable: false },
  { title: "Quantity", key: "used", sortable: true },
  { title: "Date Acquired", key: "date_acquired" },
  { title: "Expiry Date", key: "expiry_date" },
  { title: "Brand", key: "brand" },
  { title: "Name", key: "name" },
  { title: "ISO", key: "iso" },
  { title: "Format", key: "film_format" },
  { title: "Type", key: "film_type" },
  { title: "Rare", key: "rare" },
  { title: "Frozen", key: "date_frozen" },
  { title: "Latest Event Date", key: "latest_event.date", sortable: true },
];

const search = ref(props.search || "");

const expandedItem = ref<string[]>([]);

const addEventDialog = ref(false);
const selectedFilmForEvent = ref<FilmEntry | null>(null);

const updateUsed = (item: FilmEntry, increment: number) => {
  const newUsed = Math.max(
    0,
    Math.min(item.quantity ?? 0, (item.used ?? 0) + increment),
  );
  emit("updateUsed", item.id, newUsed);
};

// Function to get the number of months until the expiry date
const getExpiryStatus = (item: FilmEntry) => {
  const expiryDate = item.expiry_date;

  let status = "";

  if (!expiryDate) {
    status = "Unknown expiry date";
  } else {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const monthsDiff = differenceInMonths(expiry, now);

    if (monthsDiff > 12) {
      const yearsDiff = Math.floor(monthsDiff / 12);
      status = `${yearsDiff} year${yearsDiff > 1 ? "s" : ""} left`;
    } else if (monthsDiff > 1) {
      status = `${monthsDiff} months left`;
    } else if (monthsDiff === 1) {
      status = "1 month left";
    } else if (monthsDiff === 0) {
      status = "Expires this month";
    } else {
      const pastMonths = Math.abs(monthsDiff);
      if (pastMonths > 12) {
        const pastYears = Math.floor(pastMonths / 12);
        status = `Expired ${pastYears} year${pastYears > 1 ? "s" : ""} ago`;
      } else if (pastMonths === 1) {
        status = `Expired 1 month ago`;
      } else {
        status = `Expired ${pastMonths} months ago`;
      }
    }
  }

  return status;
};

// Function to determine the CSS class based on the expiry date and latest event
const getExpiryDateClass = (item: FilmEntry) => {
  const expiryDate = item.expiry_date;
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

const openAddEventDialog = (film: FilmEntry) => {
  selectedFilmForEvent.value = film;
  addEventDialog.value = true;
};

const handleEventAdd = (eventId: number, quantity?: number) => {
  if (selectedFilmForEvent.value) {
    emit("addExistingEventToFilm", selectedFilmForEvent.value.id, eventId, quantity);
  }
};

const handleEventCreate = (event: Omit<Event, "id"> & { quantity?: number }) => {
  if (selectedFilmForEvent.value) {
    emit("createAndAddEventToFilm", selectedFilmForEvent.value.id, event);
  }
};

const allEvents = computed(() =>
  Object.values(props.eventsByFilm)
    .flat()
    .map((event) => ({
      ...event,
      film_ids: [], // Add film_ids property
    })),
);

// Watch for search changes and emit them
watch(search, (newValue) => {
  emit("searchChange", newValue);
});

// Watch for search prop changes and update the search ref
watch(
  () => props.search,
  (newValue) => {
    search.value = newValue || "";
  },
);

const filteredFilms = computed(() => {
  const searchTerms = search.value.trim().toLowerCase().split(" ");

  return props.films.filter((film) => {
    const attributes = [
      film.name.toLowerCase(),
      film.brand.toLowerCase(),
      `${film.brand} ${film.name}`.toLowerCase(),
      formatDate(film.date_acquired).toLowerCase(),
      film.film_format.toLowerCase(),
      film.film_type.toLowerCase(),
      `ISO ${film.iso}`.toLowerCase(),
    ];

    return searchTerms.every((term) =>
      attributes.some((attribute) => attribute.includes(term)),
    );
  });
});
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
        clearable
      ></v-text-field>
    </template>
    <v-data-table
      :headers="filmHeaders"
      :items="filteredFilms"
      :sort-by="[{ key: 'date_acquired', order: 'desc' }]"
      class="elevation-1"
      show-expand
      v-model:expanded="expandedItem"
      :items-per-page="-1"
    >
      <template #item.actions="{ item }">
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props" size="small" elevation="0">
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="emit('edit', item)">
              <v-list-item-title>
                <v-icon>mdi-pencil</v-icon>
                <span class="ml-2">Edit</span>
              </v-list-item-title>
            </v-list-item>
            <v-list-item @click="emit('copy', item)">
              <v-list-item-title>
                <v-icon>mdi-content-copy</v-icon>
                <span class="ml-2">Copy</span>
              </v-list-item-title>
            </v-list-item>
            <v-list-item @click="emit('delete', item)">
              <v-list-item-title>
                <v-icon>mdi-delete</v-icon>
                <span class="ml-2">Delete</span>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>

      <template #item.rare="{ item }">
        <v-icon v-if="item.rare" color="secondary">mdi-check</v-icon>
        <v-icon v-else color="warning">mdi-close</v-icon>
      </template>

      <template #item.date_frozen="{ item }">
        <v-tooltip
          :text="
            item.date_frozen
              ? `Frozen since ${formatDate(item.date_frozen)}`
              : 'Film not currently frozen'
          "
          location="top"
        >
          <template v-slot:activator="{ props }">
            <v-icon v-if="item.date_frozen && item.quantity - item.used > 0" color="primary" v-bind="props"
              >mdi-snowflake</v-icon
            >
          </template>
        </v-tooltip>
      </template>

      <template #item.date_acquired="{ item }">
        {{ formatDate(item.date_acquired) }}
      </template>

      <template #item.brand="{ item }">
        <v-chip
          :color="getBrandColor(item.brand)"
          :text-color="getBrandColor(item.brand) ? 'white' : ''"
          small
          style="cursor: pointer"
          @click="emit('searchChange', item.brand)"
        >
          {{ item.brand }}
        </v-chip>
      </template>

      <template #item.name="{ item }">
        <v-chip
          :color="getFilmNameColor(item.name)"
          :text-color="getFilmNameColor(item.name) ? 'white' : ''"
          small
          style="cursor: pointer"
          @click="emit('searchChange', item.name)"
        >
          {{ item.name }}
        </v-chip>
      </template>

      <template #item.expiry_date="{ item }">
        <v-tooltip :text="getExpiryStatus(item)" location="top">
          <template v-slot:activator="{ props }">
            <span :class="getExpiryDateClass(item)" v-bind="props">{{
              item.expiry_date || "N/A"
            }}</span>
          </template>
        </v-tooltip>
      </template>
      <template #item.latest_event.date="{ item }">
        {{
          item.latest_event?.date ? formatDate(item.latest_event.date) : "N/A"
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
                  <div class="d-flex justify-space-between align-center mb-4">
                    <h3>Event Log</h3>
                    <v-btn
                      color="primary"
                      size="small"
                      @click="openAddEventDialog(item)"
                    >
                      Add Event
                    </v-btn>
                  </div>
                  <FilmEventLogTable
                    :events="eventsByFilm[item.id] || []"
                    @remove-event="
                      (eventId) => emit('removeEventFromFilm', item.id, eventId)
                    "
                  />
                </v-col>
              </v-row>
            </v-container>
          </td>
        </tr>
      </template>
    </v-data-table>

    <AddEventToFilmDialog
      v-model="addEventDialog"
      :existing-events="allEvents"
      :unique-events="eventsStore.uniqueEventTypeNames"
      @select-event="handleEventAdd"
      @create-event="handleEventCreate"
    />
  </v-card>
</template>
