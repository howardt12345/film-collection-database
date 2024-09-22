<script setup lang="ts">
import { ref } from 'vue'
import { type FilmCollection, FilmEvent, FilmFormat, FilmType } from '@/types'

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Name', key: 'name' },
  { title: 'Brand', key: 'brand' },
  { title: 'Type', key: 'film_type' },
  { title: 'Format', key: 'film_format' },
  { title: 'ISO', key: 'iso' },
  { title: 'Created At', key: 'created_at' },
  { title: 'Date Acquired', key: 'date_acquired' },
  { title: 'Expiry Date', key: 'expiry_date' },
  { title: 'Source', key: 'source' },
  { title: 'Event Log', key: 'event_log' },
  { title: 'DX Code', key: 'dx_code' },
  { title: 'Album URL', key: 'album_url' },
]

const filmCollections = ref<FilmCollection[]>([
// Add sample data here
])

const dialogVisible = ref(false)
const selectedItemEvents = ref([])

const showEventLog = (item: FilmCollection) => {
  selectedItemEvents.value = item.event_log || []
  dialogVisible.value = true
}
</script>

<template>
  <v-container>
    <v-data-table
      class="elevation-1"
      :headers="headers"
      :items="filmCollections"
      :items-per-page="5"
    >
      <template #item.film_type="{ item }">
        {{ FilmType[item.film_type] }}
      </template>
      <template #item.film_format="{ item }">
        {{ FilmFormat[item.film_format].slice(1) }}
      </template>
      <template #item.created_at="{ item }">
        {{ new Date(item.created_at).toLocaleDateString() }}
      </template>
      <template #item.date_acquired="{ item }">
        {{ new Date(item.date_acquired).toLocaleDateString() }}
      </template>
      <template #item.event_log="{ item }">
        <v-btn @click="showEventLog(item)">View Events</v-btn>
      </template>
    </v-data-table>

    <v-dialog v-model="dialogVisible" max-width="500">
      <v-card>
        <v-card-title>Event Log</v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item v-for="event in selectedItemEvents" :key="event.date">
              <v-list-item-title>
                {{ new Date(event.date).toLocaleString() }} -
                {{ FilmEvent[event.event] }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" text @click="dialogVisible = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
