<script setup lang="ts">
import { ref, computed } from "vue";
import FilmEventLogTable from "./FilmEventLogTable.vue";
import { Event, FilmEntry } from "@/types/film-collection";
import { formatDate } from "@/utils";
import VueMarkdown from "vue-markdown-render";
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
  uniqueEvents: string[];
  eventsByFilm: Record<number, Event[]>;
}>();

const emit = defineEmits<{
  (e: "edit", film: FilmEntry): void;
  (e: "copy", film: FilmEntry): void;
  (e: "delete", film: FilmEntry): void;
  (e: "removeEventFromFilm", filmId: number, eventId: number): void;
  (e: "addExistingEventToFilm", filmId: number, eventId: number): void;
  (
    e: "createAndAddEventToFilm",
    filmId: number,
    event: Omit<Event, "id">,
  ): void;
  (e: "updateUsed", filmId: number, used: number): void;
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
  { title: "Latest Event Date", key: "latest_event.date", sortable: true },
];

const search = ref("");

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

const openAddEventDialog = (film: FilmEntry) => {
  selectedFilmForEvent.value = film;
  addEventDialog.value = true;
};

const handleEventAdd = (eventId: number) => {
  if (selectedFilmForEvent.value) {
    emit("addExistingEventToFilm", selectedFilmForEvent.value.id, eventId);
  }
};

const handleEventCreate = (event: Omit<Event, "id">) => {
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
      :items="films"
      :sort-by="[{ key: 'date_acquired', order: 'desc' }]"
      class="elevation-1"
      show-expand
      v-model:expanded="expandedItem"
      :search="search"
      :items-per-page="25"
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

      <template #item.date_acquired="{ item }">
        {{ formatDate(item.date_acquired) }}
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
        <v-tooltip :text="getExpiryStatus(item.expiry_date)" location="top">
          <template v-slot:activator="{ props }">
            <span
              :class="getExpiryDateClass(item.expiry_date)"
              v-bind="props"
              >{{ item.expiry_date || "N/A" }}</span
            >
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
      :unique-events="uniqueEvents"
      @select-event="handleEventAdd"
      @create-event="handleEventCreate"
    />
  </v-card>
</template>
