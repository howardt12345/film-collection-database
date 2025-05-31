<script setup lang="ts">
import { ref, watch } from "vue";
import { Event, FilmEntry, Camera } from "@/types/film-collection";
import { useDateFormatting } from "@/composables/useDateFormatting";
import { getBrandColor, getFilmNameColor } from "@/utils/colors";
import { useEventsStore } from "@/stores/events";

const { formatDate } = useDateFormatting();
const eventsStore = useEventsStore();

const props = defineProps<{
  modelValue: boolean;
  event: Event | null;
  uniqueLocations: string[];
  films: FilmEntry[];
  associatedFilmIds: number[];
  cameras: Camera[];
  associatedCameraIds: number[];
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "save", event: Omit<Event, "id">, filmIds: number[], cameraIds: number[], quantities: Record<number, number>): void;
}>();

const editingEvent = ref<Omit<Event, "id">>({
  film_event_type_id: 0,
  date: new Date(),
  location: "",
  notes: "",
});

const selectedFilmIds = ref<number[]>([]);
const selectedCameraIds = ref<number[]>([]);
const filmQuantities = ref<Record<number, number>>({});

watch(
  () => props.event,
  (newEvent) => {
    if (newEvent) {
      editingEvent.value = {
        film_event_type_id: newEvent.film_event_type_id,
        date: new Date(newEvent.date),
        location: newEvent.location || "",
        notes: newEvent.notes || "",
      };
      selectedFilmIds.value = [...props.associatedFilmIds];
      selectedCameraIds.value = [...props.associatedCameraIds];

      // Initialize quantities from store
      filmQuantities.value = {};
      props.associatedFilmIds.forEach(filmId => {
        const association = eventsStore.getFilmEventAssociation(filmId, newEvent.id);
        filmQuantities.value[filmId] = association?.quantity || 1;
      });
    }
  },
  { immediate: true },
);

const saveEvent = () => {
  emit("save", {
    ...editingEvent.value,
    date: new Date(editingEvent.value.date),
  }, selectedFilmIds.value, selectedCameraIds.value, filmQuantities.value);
  emit("update:modelValue", false);
};

// Update quantities when films are selected/deselected
watch(selectedFilmIds, (newFilmIds) => {
  // Add new films with default quantity
  newFilmIds.forEach(filmId => {
    if (filmQuantities.value[filmId] === undefined) {
      filmQuantities.value[filmId] = 1;
    }
  });

  // Remove quantities for deselected films
  Object.keys(filmQuantities.value).forEach(filmIdStr => {
    const filmId = parseInt(filmIdStr);
    if (!newFilmIds.includes(filmId)) {
      delete filmQuantities.value[filmId];
    }
  });
});
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
            <v-select
              v-model="editingEvent.film_event_type_id"
              :items="eventsStore.eventTypes"
              item-value="id"
              item-title="name"
              label="Event Type"
              density="comfortable"
            ></v-select>
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

          <!-- Film Quantities Section -->
          <v-col cols="12" v-if="selectedFilmIds.length > 0">
            <v-card variant="outlined" class="pa-3 mb-3">
              <v-card-title class="text-subtitle-1 pb-2">Film Quantities</v-card-title>
              <v-row v-for="filmId in selectedFilmIds" :key="filmId" class="py-1">
                <v-col cols="8">
                  {{ props.films.find(f => f.id === filmId)?.brand }}
                  {{ props.films.find(f => f.id === filmId)?.name }}
                </v-col>
                <v-col cols="4">
                  <v-text-field
                    v-model="filmQuantities[filmId]"
                    type="number"
                    min="1"
                    density="compact"
                    hide-details
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-card>
          </v-col>
          <v-col cols="12">
            <v-select
              v-model="selectedCameraIds"
              :items="cameras"
              item-value="id"
              label="Associated Cameras"
              :item-title="(camera) => `${camera.brand} ${camera.model}`"
              multiple
              chips
              closable-chips
              density="comfortable"
            />
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="secondary" @click="emit('update:modelValue', false)">Cancel</v-btn>
        <v-btn
          color="primary"
          @click="saveEvent"
          :disabled="!editingEvent.film_event_type_id || !editingEvent.date"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
