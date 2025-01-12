<script setup lang="ts">
import { ref, computed } from "vue";
import { Event } from "@/types/film-collection";

const props = defineProps<{
  modelValue: boolean;
  existingEvents: (Event & { film_ids: number[] })[];
  uniqueEvents: string[];
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "selectEvent", eventId: number): void;
  (e: "createEvent", event: Omit<Event, "id">): void;
}>();

const isCreatingNew = ref(false);
const selectedEventId = ref<number | null>(null);

const newEvent = ref<Omit<Event, "id">>({
  event_type: "",
  date: new Date(),
  location: "",
  notes: "",
});

const sortedEvents = computed(() =>
  [...props.existingEvents].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  ),
);

const addEvent = () => {
  if (isCreatingNew.value) {
    if (newEvent.value.event_type && newEvent.value.date) {
      emit("createEvent", { ...newEvent.value });
      resetForm();
    }
  } else if (selectedEventId.value) {
    emit("selectEvent", selectedEventId.value);
    resetForm();
  }
};

const resetForm = () => {
  isCreatingNew.value = false;
  selectedEventId.value = null;
  newEvent.value = {
    event_type: "",
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
              <v-combobox
                v-model="newEvent.event_type"
                :items="uniqueEvents"
                label="Event Type"
                density="comfortable"
              ></v-combobox>
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="newEvent.notes"
                label="Notes"
                density="comfortable"
                rows="3"
              ></v-textarea>
            </v-col>
          </v-row>
        </template>

        <template v-else>
          <v-row>
            <v-col cols="12">
              <v-select
                v-model="selectedEventId"
                :items="sortedEvents"
                item-title="event_type"
                item-value="id"
                label="Select Event"
                density="comfortable"
                :return-object="false"
              >
                <template v-slot:item="{ item }">
                  <v-list-item>
                    <template v-slot:prepend>
                      <div class="d-flex align-center gap-4">
                        <span class="text-grey">{{ item.raw.date }}</span>
                        <span>{{ item.raw.event_type }}</span>
                      </div>
                    </template>
                  </v-list-item>
                </template>
              </v-select>
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
              ? !newEvent.event_type || !newEvent.date
              : !selectedEventId
          "
        >
          Add Event
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
