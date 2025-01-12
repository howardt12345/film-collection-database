<script setup lang="ts">
import { ref, computed } from "vue";
import { Event, FilmEntry } from "@/types/film-collection";
import VueMarkdown from "vue-markdown-render";
import { getBrandColor, getFilmNameColor } from "@/utils/colors";
import { formatDate } from "@/utils";

const props = defineProps<{
  events: (Event & { film_ids: number[] })[];
  uniqueEvents: string[];
  films: FilmEntry[];
}>();

const emit = defineEmits<{
  (e: "addEvent", filmId: number, event: Omit<Event, "id">): void;
  (e: "addFilmToEvent", filmId: number, eventId: number): void;
  (e: "deleteEvent", filmId: number, eventId: number): void;
}>();

const eventHeaders = [
  { title: "Date", key: "date", sortable: true, width: "20%" },
  { title: "Event Type", key: "event_type", sortable: true, width: "20%" },
  { title: "Location", key: "location", sortable: true, width: "20%" },
  { title: "Notes", key: "notes", sortable: false, width: "35%" },
  { title: "Associated Films", key: "films", sortable: false, width: "25%" },
];

const newEvent = ref<Omit<Event, "id">>({
  event_type: "",
  date: new Date(),
  location: "",
  notes: "",
});
const selectedFilmIds = ref<number[]>([]);

// For adding films to existing events
const addingFilmsToEventId = ref<number | null>(null);
const filmsToAdd = ref<number[]>([]);

const sortedEvents = computed(() =>
  [...(props.events || [])].sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  })
);

const sortedFilms = computed(() =>
  [...props.films].sort((a, b) => {
    // First sort by date (newest first)
    const dateCompare = new Date(b.date_acquired).getTime() - new Date(a.date_acquired).getTime();
    if (dateCompare !== 0) return dateCompare;

    // Then by brand
    const brandCompare = a.brand.localeCompare(b.brand);
    if (brandCompare !== 0) return brandCompare;

    // Finally by name
    return a.name.localeCompare(b.name);
  })
);

const getAssociatedFilms = (eventId: number) => {
  const event = props.events?.find(e => e.id === eventId);
  if (!event?.film_ids) return [];
  return props.films.filter(film => event.film_ids.includes(film.id));
};

const addEvent = () => {
  if (newEvent.value.event_type && newEvent.value.date && selectedFilmIds.value.length > 0) {
    selectedFilmIds.value.forEach((filmId) => {
      emit("addEvent", filmId, { ...newEvent.value });
    });

    newEvent.value = {
      event_type: "",
      date: new Date(),
      location: "",
      notes: "",
    };
    selectedFilmIds.value = [];
  }
};

const startAddingFilmsToEvent = (eventId: number) => {
  addingFilmsToEventId.value = eventId;
  filmsToAdd.value = [];
};

const confirmAddFilmsToEvent = () => {
  if (addingFilmsToEventId.value && filmsToAdd.value.length > 0) {
    filmsToAdd.value.forEach(filmId => {
      emit("addFilmToEvent", filmId, addingFilmsToEventId.value!);
    });
    addingFilmsToEventId.value = null;
    filmsToAdd.value = [];
  }
};

const cancelAddFilmsToEvent = () => {
  addingFilmsToEventId.value = null;
  filmsToAdd.value = [];
};

const getAvailableFilms = (eventId: number) => {
  const event = props.events?.find(e => e.id === eventId);
  if (!event?.film_ids) return sortedFilms.value;
  return sortedFilms.value.filter(film => !event.film_ids.includes(film.id));
};
</script>

<template>
  <v-data-table
    :headers="eventHeaders"
    :items="sortedEvents"
    class="elevation-1"
    items-per-page="10"
  >
    <template v-slot:top>
      <v-row>
        <v-col cols="2">
          <v-text-field
            v-model="newEvent.date"
            label="Event Date"
            type="date"
            density="comfortable"
          ></v-text-field>
        </v-col>
        <v-col cols="2">
          <v-combobox
            v-model="newEvent.event_type"
            :items="uniqueEvents"
            label="Event Type"
            density="comfortable"
          ></v-combobox>
        </v-col>
        <v-col cols="3">
          <v-textarea
            v-model="newEvent.notes"
            label="Notes"
            density="comfortable"
            rows="1"
          ></v-textarea>
        </v-col>
        <v-col cols="3">
          <v-select
            v-model="selectedFilmIds"
            :items="sortedFilms"
            item-value="id"
            label="Select Films"
            multiple
            chips
            closable-chips
            :return-object="false"
            density="comfortable"
          >
            <template v-slot:selection="{ item }">
              <div class="d-flex align-center gap-1">
                <v-chip
                  size="small"
                  :color="
                    getBrandColor(
                      films.find((f) => f.id === item.value)?.brand || ''
                    )
                  "
                  :text-color="
                    getBrandColor(
                      films.find((f) => f.id === item.value)?.brand || ''
                    )
                      ? 'white'
                      : ''
                  "
                >
                  {{ films.find((f) => f.id === item.value)?.brand }}
                </v-chip>
                <v-chip
                  size="small"
                  :color="
                    getFilmNameColor(
                      films.find((f) => f.id === item.value)?.name || ''
                    )
                  "
                  :text-color="
                    getFilmNameColor(
                      films.find((f) => f.id === item.value)?.name || ''
                    )
                      ? 'white'
                      : ''
                  "
                >
                  {{ films.find((f) => f.id === item.value)?.name }}
                </v-chip>
              </div>
            </template>

            <template v-slot:item="{ item, props }">
              <v-list-item v-bind="props">
                <template v-slot:prepend
                  ><div class="d-flex align-center gap-4">
                    <span class="text-grey mr-2">{{
                      formatDate(item.raw.date_acquired)
                    }}</span>
                    <div class="d-flex align-center gap-1">
                      <v-chip
                        size="small"
                        :color="getBrandColor(item.raw.brand)"
                        :text-color="
                          getBrandColor(item.raw.brand) ? 'white' : ''
                        "
                      >
                        {{ item.raw.brand }}
                      </v-chip>
                      <v-chip
                        size="small"
                        :color="getFilmNameColor(item.raw.name)"
                        :text-color="
                          getFilmNameColor(item.raw.name) ? 'white' : ''
                        "
                      >
                        {{ item.raw.name }}
                      </v-chip>
                    </div>
                  </div>
                </template>
              </v-list-item>
            </template>
          </v-select>
        </v-col>
        <v-col cols="2" class="pt-4">
          <v-btn
            color="primary"
            @click="addEvent"
            :disabled="
              !newEvent.event_type ||
              !newEvent.date ||
              selectedFilmIds.length === 0
            "
          >
            Add Event
          </v-btn>
        </v-col>
      </v-row>
    </template>

    <template v-slot:item.date="{ item }">
      {{ formatDate(item.date) }}
    </template>

    <template v-slot:item.event_type="{ item }">
      {{ item.event_type }}
    </template>

    <template v-slot:item.notes="{ item }">
      <vue-markdown v-if="item.notes" :source="item.notes" />
    </template>

    <template v-slot:item.films="{ item }">
      <div v-if="addingFilmsToEventId === item.id">
        <v-select
          v-model="filmsToAdd"
          :items="getAvailableFilms(item.id)"
          item-value="id"
          label="Add Films"
          multiple
          chips
          closable-chips
          density="comfortable"
        >
          <template v-slot:selection="{ item }">
            <div class="d-flex align-center gap-1">
              <v-chip
                size="small"
                :color="getBrandColor(films.find(f => f.id === item.value)?.brand || '')"
                :text-color="getBrandColor(films.find(f => f.id === item.value)?.brand || '') ? 'white' : ''"
              >
                {{ films.find(f => f.id === item.value)?.brand }}
              </v-chip>
              <v-chip
                size="small"
                :color="getFilmNameColor(films.find(f => f.id === item.value)?.name || '')"
                :text-color="getFilmNameColor(films.find(f => f.id === item.value)?.name || '') ? 'white' : ''"
              >
                {{ films.find(f => f.id === item.value)?.name }}
              </v-chip>
            </div>
          </template>

          <template v-slot:item="{ item, props }">
            <v-list-item v-bind="props">
              <template v-slot:prepend>
                <div class="d-flex align-center gap-4">
                  <span class="text-grey">{{ formatDate(item.raw.date_acquired) }}</span>
                  <div class="d-flex align-center gap-1">
                    <v-chip
                      size="small"
                      :color="getBrandColor(item.raw.brand)"
                      :text-color="getBrandColor(item.raw.brand) ? 'white' : ''"
                    >
                      {{ item.raw.brand }}
                    </v-chip>
                    <v-chip
                      size="small"
                      :color="getFilmNameColor(item.raw.name)"
                      :text-color="getFilmNameColor(item.raw.name) ? 'white' : ''"
                    >
                      {{ item.raw.name }}
                    </v-chip>
                  </div>
                </div>
              </template>
            </v-list-item>
          </template>
        </v-select>
        <div class="d-flex justify-end gap-2 mt-2">
          <v-btn size="small" color="secondary" @click="cancelAddFilmsToEvent">
            Cancel
          </v-btn>
          <v-btn
            size="small"
            color="primary"
            @click="confirmAddFilmsToEvent"
            :disabled="filmsToAdd.length === 0"
          >
            Add
          </v-btn>
        </div>
      </div>
      <div v-else class="d-flex justify-space-between align-center">
        <div class="d-flex flex-wrap gap-1">
          <v-chip
            v-for="film in getAssociatedFilms(item.id)"
            :key="film.id"
            size="small"
            :color="film.film_type.toLowerCase()"
          >
            {{ film.brand }} {{ film.name }}
          </v-chip>
        </div>
        <v-btn
          icon
          size="small"
          color="primary"
          @click="startAddingFilmsToEvent(item.id)"
        >
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </div>
    </template>
  </v-data-table>
</template>
