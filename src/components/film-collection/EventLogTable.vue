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
  (e: "deleteEvent", filmId: number, eventId: number): void;
  (e: "updateEvent", eventId: number, event: Omit<Event, "id">): void;
  (e: "removeEvent", eventId: number): void;
  (e: "editFilmsOnEvent", eventId: number, filmIds: number[]): void;
}>();

const eventHeaders = [
  { title: "", key: "actions", sortable: false },
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

// Add editing state
const editingEventId = ref<number | null>(null);
const editingEvent = ref<Omit<Event, "id">>({
  event_type: "",
  date: new Date(),
  location: "",
  notes: "",
});

const editingFilms = ref<number[]>([]);

const sortedEvents = computed(() =>
  [...(props.events || [])].sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return b.date.getTime() - a.date.getTime();
  })
);

const sortedFilms = computed(() =>
  [...props.films].sort((a, b) => {
    // First sort by date (newest first)
    const dateCompare = b.date_acquired.getTime() - a.date_acquired.getTime();
    if (dateCompare !== 0) return dateCompare;

    // Then by brand
    const brandCompare = a.brand.localeCompare(b.brand);
    if (brandCompare !== 0) return brandCompare;

    // Finally by name
    return a.name.localeCompare(b.name);
  })
);

const getAssociatedFilms = (eventId: number) => {
  const event = props.events?.find((e) => e.id === eventId);
  if (!event?.film_ids) return [];
  return props.films.filter((film) => event.film_ids.includes(film.id));
};

const addEvent = () => {
  if (
    newEvent.value.event_type &&
    newEvent.value.date &&
    selectedFilmIds.value.length > 0
  ) {
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

const startEditing = (event: Event) => {
  editingEventId.value = event.id;
  editingEvent.value = {
    event_type: event.event_type,
    date: new Date(event.date),
    location: event.location || "",
    notes: event.notes || "",
  };
  editingFilms.value = getAssociatedFilms(event.id).map((f) => f.id);
};

const saveEdit = () => {
  if (editingEventId.value) {
    emit("updateEvent", editingEventId.value, editingEvent.value);
    emit("editFilmsOnEvent", editingEventId.value, editingFilms.value);
    editingEventId.value = null;
    editingFilms.value = [];
  }
};

const cancelEdit = () => {
  editingEventId.value = null;
  editingFilms.value = [];
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
      <v-row class="ma-2">
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
            :item-title="film => `${formatDate(film.date_acquired)}: ${film.brand} ${film.name}`"
            :return-object="false"
            multiple
            chips
            closable-chips
            density="comfortable"
          >
            <template v-slot:item="{ item, props: itemProps }">
              <v-list-item v-bind="itemProps">
                <template v-slot:title>
                  <div class="d-flex align-center gap-4">
                    <span class="text-grey mr-2">{{ formatDate(item.raw.date_acquired) }}</span>
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
      <template v-if="editingEventId === item.id">
        <v-text-field
          v-model="editingEvent.date"
          type="date"
          density="compact"
          hide-details
        />
      </template>
      <template v-else>
        {{ formatDate(item.date) }}
      </template>
    </template>

    <template v-slot:item.event_type="{ item }">
      <template v-if="editingEventId === item.id">
        <v-combobox
          v-model="editingEvent.event_type"
          :items="uniqueEvents"
          density="compact"
          hide-details
        />
      </template>
      <template v-else>
        {{ item.event_type }}
      </template>
    </template>

    <template v-slot:item.notes="{ item }">
      <template v-if="editingEventId === item.id">
        <v-textarea
          v-model="editingEvent.notes"
          density="compact"
          hide-details
          rows="2"
          auto-grow
        />
      </template>
      <template v-else>
        <vue-markdown v-if="item.notes" :source="item.notes" />
      </template>
    </template>

    <template v-slot:item.films="{ item }">
      <template v-if="editingEventId === item.id">
        <v-select
          v-model="editingFilms"
          :items="props.films"
          item-value="id"
          :item-title="film => `${formatDate(film.date_acquired)}:  ${film.brand} ${film.name}`"
          :return-object="false"
          multiple
          chips
          closable-chips
          density="comfortable"
        >
          <template v-slot:item="{ item, props: itemProps }">
            <v-list-item v-bind="itemProps">
              <template v-slot:title>
                <div class="d-flex align-center gap-4">
                  <span class="text-grey mr-2">{{ formatDate(item.raw.date_acquired) }}</span>
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
      </template>
      <template v-else>
        <div class="d-flex flex-wrap gap-1">
          <v-chip
            v-for="film in getAssociatedFilms(item.id)"
            :key="film.id"
            size="small"
            :color="getFilmNameColor(film.name)"
            :text-color="getFilmNameColor(film.name) ? 'white' : ''"
          >
            {{ formatDate(film.date_acquired) }}: {{ film.brand }} {{ film.name }}
          </v-chip>
        </div>
      </template>
    </template>

    <template v-slot:item.actions="{ item }">
      <template v-if="editingEventId === item.id">
        <div class="d-flex gap-2">
          <v-btn icon size="small" color="success" @click="saveEdit">
            <v-icon>mdi-check</v-icon>
          </v-btn>
          <v-btn icon size="small" color="error" @click="cancelEdit">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </template>
      <template v-else>
        <div class="d-flex gap-2">
          <v-btn icon size="small" color="primary" @click="startEditing(item)">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
        </div>
      </template>
    </template>
  </v-data-table>
</template>
