<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Event, FilmEvent } from "@/types/film-collection";
import { useDateFormatting } from "@/composables/useDateFormatting";
import { useEventsStore } from "@/stores/events";

const { formatDate } = useDateFormatting();
const eventsStore = useEventsStore();

const props = defineProps<{
  modelValue: boolean;
  existingEvents: FilmEvent[];
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "selectEvent", eventId: number, quantity?: number): void;
  (e: "createEvent", event: Omit<Event, "id"> & { quantity?: number }): void;
}>();

const isCreatingNew = ref(false);
const selectedEventId = ref<number | null>(null);

const newEvent = ref<Omit<Event, "id">>({
  film_event_type_id: 1, // Assuming 1 is the ID for "Acquired"
  date: new Date(),
  location: "",
  notes: "",
});

const eventQuantity = ref<number>(1);
const showQuantityField = ref<boolean>(false);

// Watch for changes in event type to determine if quantity field should be shown
watch(() => newEvent.value.film_event_type_id, (newTypeId: number) => {
  showQuantityField.value = true; // Show quantity field for all event types
});

const sortedUniqueEvents = computed(() => {
  const uniqueEvents = [...new Map(props.existingEvents.map(event => [event.id, event])).values()];
  return uniqueEvents.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
});


const addEvent = () => {
  if (isCreatingNew.value) {
    if (newEvent.value.film_event_type_id && newEvent.value.date) {
      // Include quantity in the event data
      emit("createEvent", {
        ...newEvent.value,
        quantity: eventQuantity.value
      });
      resetForm();
    }
  } else if (selectedEventId.value !== null) {
    // Include quantity when selecting an existing event
    emit("selectEvent", selectedEventId.value, eventQuantity.value);
    resetForm();
  }
};

const resetForm = () => {
  isCreatingNew.value = false;
  selectedEventId.value = null;
  eventQuantity.value = 1;
  showQuantityField.value = false;
  newEvent.value = {
    film_event_type_id: 1, // Assuming 1 is the ID for "Acquired"
    date: new Date(),
    location: "",
    notes: "",
  };
  emit("update:modelValue", false);
};
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    max-width="500"
  >
    <v-card>
      <v-card-title>Add Event to Film</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12">
            <v-btn-toggle v-model="isCreatingNew" mandatory>
              <v-btn :value="false">Select Existing</v-btn>
              <v-btn :value="true">Create New</v-btn>
            </v-btn-toggle>
          </v-col>
        </v-row>

        <template v-if="isCreatingNew">
          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model="newEvent.date"
                label="Event Date"
                type="date"
                density="comfortable"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-select
                v-model="newEvent.film_event_type_id"
                :items="eventsStore.eventTypes"
                item-value="id"
                item-title="name"
                label="Event Type"
                density="comfortable"
              ></v-select>
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="newEvent.notes"
                label="Notes"
                density="comfortable"
                rows="3"
              ></v-textarea>
            </v-col>
            <v-col cols="12" v-if="showQuantityField">
              <v-text-field
                v-model="eventQuantity"
                label="Quantity"
                type="number"
                min="1"
                density="comfortable"
                hint="Number of films affected by this event"
              ></v-text-field>
            </v-col>
          </v-row>
        </template>

        <template v-else>
          <v-row>
            <v-col cols="12">
              <v-select
                v-model="selectedEventId"
                :items="sortedUniqueEvents"
                :item-title="
                  (event) => `${event.id}: ${formatDate(event.date)} - ${eventsStore.getEventTypeName(event.film_event_type_id)}`
                "
                item-value="id"
                label="Select Event"
                density="comfortable"
                :return-object="false"
              >
              </v-select>
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="eventQuantity"
                label="Quantity"
                type="number"
                min="1"
                density="comfortable"
                hint="Number of films affected by this event"
              ></v-text-field>
            </v-col>
          </v-row>
        </template>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="secondary" @click="resetForm">Cancel</v-btn>
        <v-btn
          color="primary"
          @click="addEvent"
          :disabled="
            isCreatingNew
              ? !newEvent.film_event_type_id || !newEvent.date
              : !selectedEventId
          "
        >
          Add Event
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
