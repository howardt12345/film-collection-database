<script setup lang="ts">
import { computed, ref } from "vue";
import VueMarkdown from "vue-markdown-render";
import { Event } from "@/types/film-collection";

const props = defineProps<{
  events: Event[];
  uniqueEvents: string[];
}>();

const emit = defineEmits<{
  (e: "addEvent", event: Omit<Event, "id">): void;
  (e: "editEvent", eventId: number, updatedEvent: Event): void;
  (e: "deleteEvent", eventId: number): void;
}>();

const eventHeaders = [
  { title: "Date", key: "date", sortable: true, width: "27%" },
  { title: "Event", key: "event_type", sortable: true, width: "25%" },
  { title: "Notes", key: "notes", sortable: false, width: "auto" },
  { title: "Actions", key: "actions", sortable: false, width: "15%" },
];

const newEvent = ref<Omit<Event, "id">>({
  event_type: "",
  date: new Date(),
  notes: "",
});

const editingEvent = ref<number | null>(null);

const addEvent = () => {
  if (newEvent.value.event_type && newEvent.value.date) {
    emit("addEvent", { ...newEvent.value });
    newEvent.value = {
      event_type: "",
      date: new Date(),
      notes: "",
    };
  }
};

const startEditEvent = (eventId: number) => {
  editingEvent.value = eventId;
};

const saveEditEvent = (eventId: number) => {
  const updatedEvent = props.events.find((e) => e.id === eventId);
  if (updatedEvent) {
    emit("editEvent", eventId, updatedEvent);
    editingEvent.value = null;
  }
};

const cancelEditEvent = () => {
  editingEvent.value = null;
};

const deleteEvent = (eventId: number) => {
  emit("deleteEvent", eventId);
};

const sortedEvents = computed(() =>
  [...props.events].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
);
</script>

<template>
  <v-data-table
    :headers="eventHeaders"
    :items="sortedEvents"
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
            v-model="newEvent.event_type"
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
            @click="addEvent"
            :disabled="!newEvent.event_type || !newEvent.date"
          >
            Add Event
          </v-btn>
        </v-col>
      </v-row>
    </template>

    <template v-slot:item="{ item: event }">
      <tr>
        <td>
          <div v-if="editingEvent === event.id" class="pt-4">
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
          <div v-if="editingEvent === event.id" class="pt-4">
            <v-combobox
              v-model="event.event_type"
              :items="uniqueEvents"
              density="compact"
            ></v-combobox>
          </div>
          <template v-else>
            {{ event.event_type }}
          </template>
        </td>

        <td>
          <div v-if="editingEvent === event.id" class="pt-4">
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
          <div v-if="editingEvent === event.id" class="d-flex flex-row ga-2">
            <v-btn
              icon
              @click="saveEditEvent(event.id)"
              color="primary"
              size="small"
            >
              <v-icon>mdi-check</v-icon>
            </v-btn>
            <v-btn icon @click="cancelEditEvent" color="error" size="small">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
          <div v-else class="d-flex flex-row ga-2">
            <v-btn
              icon
              @click="startEditEvent(event.id)"
              color="primary"
              size="small"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn
              icon
              @click="deleteEvent(event.id)"
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
</template>
