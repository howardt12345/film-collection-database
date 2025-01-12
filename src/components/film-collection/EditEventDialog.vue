<script setup lang="ts">
import { ref, watch } from "vue";
import { Event, FilmEntry } from "@/types/film-collection";
import { formatDate } from "@/utils";
import { getBrandColor, getFilmNameColor } from "@/utils/colors";

const props = defineProps<{
  modelValue: boolean;
  event: Event | null;
  uniqueEvents: string[];
  uniqueLocations: string[];
  films: FilmEntry[];
  associatedFilmIds: number[];
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "save", event: Omit<Event, "id">, filmIds: number[]): void;
}>();

const editingEvent = ref<Omit<Event, "id">>({
  event_type: "",
  date: new Date(),
  location: "",
  notes: "",
});

const selectedFilmIds = ref<number[]>([]);

watch(
  () => props.event,
  (newEvent) => {
    if (newEvent) {
      editingEvent.value = {
        event_type: newEvent.event_type,
        date: new Date(newEvent.date),
        location: newEvent.location || "",
        notes: newEvent.notes || "",
      };
      selectedFilmIds.value = [...props.associatedFilmIds];
    }
  },
  { immediate: true },
);

const saveEvent = () => {
  emit("save", {
    ...editingEvent.value,
    date: new Date(editingEvent.value.date),
  }, selectedFilmIds.value);
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
      <v-card-title>{{ event ? 'Edit' : 'Create' }} Event</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="6">
            <v-text-field
              :model-value="editingEvent.date instanceof Date
                ? editingEvent.date.toISOString().split('T')[0]
                : editingEvent.date"
              @update:model-value="value => editingEvent.date = new Date(value)"
              label="Event Date"
              type="date"
              density="comfortable"
            ></v-text-field>
          </v-col>
          <v-col cols="6">
            <v-combobox
              v-model="editingEvent.event_type"
              :items="uniqueEvents"
              label="Event Type"
              density="comfortable"
            ></v-combobox>
          </v-col>
          <v-col cols="12">
            <v-combobox
              v-model="editingEvent.location"
              :items="uniqueLocations"
              label="Location"
              density="comfortable"
              clearable
              allow-new-values
            ></v-combobox>
          </v-col>
          <v-col cols="12">
            <v-textarea
              v-model="editingEvent.notes"
              label="Notes"
              density="comfortable"
              rows="3"
              auto-grow
            ></v-textarea>
          </v-col>
          <v-col cols="12">
            <v-select
              v-model="selectedFilmIds"
              :items="films"
              item-value="id"
              label="Associated Films"
              :item-title="
                (film) =>
                  `${formatDate(film.date_acquired)}: ${film.brand} ${film.name}`
              "
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
                      <span class="text-grey mr-2">{{
                        formatDate(item.raw.date_acquired)
                      }}</span>
                      <div class="d-flex align-center gap-1">
                        <v-chip
                          size="small"
                          :color="getBrandColor(item.raw.brand)"
                        >
                          {{ item.raw.brand }}
                        </v-chip>
                        <v-chip
                          size="small"
                          :color="getFilmNameColor(item.raw.name)"
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
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="secondary" @click="emit('update:modelValue', false)"
          >Cancel</v-btn
        >
        <v-btn
          color="primary"
          @click="saveEvent"
          :disabled="!editingEvent.event_type || !editingEvent.date"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
