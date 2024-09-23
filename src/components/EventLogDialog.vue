<script setup lang="ts">
import { Event } from "@/types/film-collection";

defineProps<{
  modelValue: boolean;
  events: Event[];
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    max-width="500"
  >
    <v-card>
      <v-card-title>Event Log</v-card-title>
      <v-card-text>
        <v-list>
          <v-list-item v-for="event in events" :key="event.date.toLocaleString() + event.event">
            <v-list-item-title>
              {{ new Date(event.date).toISOString().slice(0, 10) }} -
              {{ event.event }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" @click="emit('update:modelValue', false)">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
