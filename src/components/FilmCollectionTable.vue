<script setup lang="ts">
import { computed, ref } from "vue";
import { FilmCollection, Event } from "@/types/film-collection";
import VueMarkdown from "vue-markdown-render";
import { v4 as uuid } from "uuid";

defineProps<{
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
}>();

const filmHeaders = [
  { title: "", key: "actions", sortable: false },
  { title: "Date Acquired", key: "date_acquired" },
  { title: "Brand", key: "brand" },
  { title: "Name", key: "name" },
  { title: "ISO", key: "iso" },
  { title: "Format", key: "film_format" },
  { title: "Type", key: "film_type" },
  { title: "Expiry Date", key: "expiry_date" },
  { title: "Album URL", key: "album_url" },
];

const eventHeaders = [
  { title: "Date", key: "date", sortable: true, width: "27%" },
  { title: "Event", key: "event", sortable: true, width: "25%" },
  { title: "Notes", key: "notes", sortable: false, width: "auto" },
  { title: "Actions", key: "actions", sortable: false, width: "15%" },
];

const formatDate = (date: Date) => new Date(date).toLocaleDateString();

const newEvent = ref<Event>({
  id: uuid(),
  event: "",
  date: new Date(),
  notes: "",
});

const expandedItem = ref(undefined);
const editingEvent = ref<{ filmId: number; eventId: string } | null>(null);

const addEvent = (item: FilmCollection) => {
  if (newEvent.value.event && newEvent.value.date) {
    emit("addEvent", item.id, { ...newEvent.value });
    newEvent.value = {
      id: uuid(),
      event: "",
      date: new Date(),
      notes: "",
    };
  }
};

const startEditEvent = (filmId: number, eventId: string) => {
  editingEvent.value = { filmId, eventId };
};

const saveEditEvent = (item: FilmCollection, eventId: string) => {
  if (editingEvent.value) {
    emit(
      "editEvent",
      item.id,
      eventId,
      item.event_log!.find((e) => e.id === eventId)!
    );
    editingEvent.value = null;
  }
};

const cancelEditEvent = () => {
  editingEvent.value = null;
};

const deleteEvent = (item: FilmCollection, eventId: string) => {
  emit("deleteEvent", item.id, eventId);
};

const getSortedEventLog = computed(() => (eventLog: Event[] | undefined) => {
  if (!eventLog) return [];
  return [...eventLog].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
});
</script>

<template>
  <v-data-table
    :headers="filmHeaders"
    :items="films"
    :sort-by="[{ key: 'date_acquired', order: 'desc' }]"
    class="elevation-1"
    show-expand
    v-model:expanded="expandedItem"
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

    <template #item.album_url="{ item }">
      <a v-if="item.album_url" :href="item.album_url" target="_blank">Album</a>
    </template>

    <template v-slot:expanded-row="{ columns, item }">
      <tr>
        <td :colspan="columns.length">
          <v-container>
            <v-row>
              <v-col cols="1" />
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

            <v-row>
              <v-col cols="1" />
              <v-col cols="11">
                <h3>Event Log</h3>
                <v-data-table
                  :headers="eventHeaders"
                  :items="getSortedEventLog(item.event_log)"
                  class="elevation-1"
                  items-per-page="5"
                >
                  <template v-slot:top>
                    <v-row>
                      <v-col cols="3">
                        <v-text-field
                          v-model="newEvent.date"
                          label="Event Date"
                          type="date"
                          density="comfortable"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="3">
                        <v-combobox
                          v-model="newEvent.event"
                          :items="uniqueEvents"
                          label="Event Type"
                          density="comfortable"
                        ></v-combobox>
                      </v-col>
                      <v-col cols="4">
                        <v-textarea
                          v-model="newEvent.notes"
                          label="Notes"
                          density="comfortable"
                          rows="1"
                        ></v-textarea>
                      </v-col>
                      <v-col cols="2" class="pt-4">
                        <v-btn
                          color="primary"
                          @click="addEvent(item)"
                          :disabled="!newEvent.event || !newEvent.date"
                        >
                          Add Event
                        </v-btn>
                      </v-col>
                    </v-row>
                  </template>

                  <template v-slot:item="{ item: event }">
                    <tr>
                      <td>
                        <div
                          v-if="
                            editingEvent?.filmId === item.id &&
                            editingEvent?.eventId === event.id
                          "
                          class="pt-4"
                        >
                          <v-text-field
                            v-model="event.date"
                            type="date"
                            density="compact"
                          ></v-text-field>
                        </div>
                        <template v-else>
                          {{ event.date }}
                        </template>
                      </td>

                      <td>
                        <div
                          v-if="
                            editingEvent?.filmId === item.id &&
                            editingEvent?.eventId === event.id
                          "
                          class="pt-4"
                        >
                          <v-combobox
                            v-model="event.event"
                            :items="uniqueEvents"
                            density="compact"
                          ></v-combobox>
                        </div>
                        <template v-else>
                          {{ event.event }}
                        </template>
                      </td>

                      <td>
                        <div
                          v-if="
                            editingEvent?.filmId === item.id &&
                            editingEvent?.eventId === event.id
                          "
                          class="pt-4"
                        >
                          <v-textarea
                            v-model="event.notes"
                            density="compact"
                            rows="1"
                          ></v-textarea>
                        </div>
                        <template v-else-if="event.notes">
                          <vue-markdown :source="event.notes" />
                        </template>
                      </td>

                      <td>
                        <div
                          v-if="
                            editingEvent?.filmId === item.id &&
                            editingEvent?.eventId === event.id
                          "
                          class="d-flex flex-row ga-2"
                        >
                          <v-btn
                            icon
                            @click="saveEditEvent(item, event.id)"
                            color="primary"
                            size="small"
                          >
                            <v-icon>mdi-check</v-icon>
                          </v-btn>
                          <v-btn
                            icon
                            @click="cancelEditEvent"
                            color="error"
                            size="small"
                          >
                            <v-icon>mdi-close</v-icon>
                          </v-btn>
                        </div>
                        <div v-else class="d-flex flex-row ga-2">
                          <v-btn
                            icon
                            @click="startEditEvent(item.id, event.id)"
                            color="primary"
                            size="small"
                          >
                            <v-icon>mdi-pencil</v-icon>
                          </v-btn>

                          <v-btn
                            icon
                            @click="deleteEvent(item, event.id)"
                            color="error"
                            size="small"
                          >
                            <v-icon>mdi-delete</v-icon>
                          </v-btn>
                        </div>
                      </td>
                    </tr>
                  </template>
                </v-data-table>
              </v-col>
            </v-row>
          </v-container>
        </td>
      </tr>
    </template>
  </v-data-table>
</template>
