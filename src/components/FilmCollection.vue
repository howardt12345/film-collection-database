<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { FilmCollection, Event, FilmEvent } from "@/types/film-collection";
import {
  getFilmCollections,
  createFilmCollection,
  updateFilmCollection,
  deleteFilmCollection,
} from "@/api/film-collection";
import FilmCollectionTable from "./FilmCollectionTable.vue";
import CreateFilmDialog from "./CreateFilmDialog.vue";
import EditFilmDialog from "./EditFilmDialog.vue";
import EventLogDialog from "./EventLogDialog.vue";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/api/supabase";
defineProps<{
  session: Session | null;
}>();

const filmCollections = ref<FilmCollection[]>([]);
const createDialogVisible = ref(false);
const editDialogVisible = ref(false);
const copyDialogVisible = ref(false);
const eventLogDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const selectedFilm = ref<FilmCollection | undefined>(undefined);

const editingFilm = ref<FilmCollection | null>(null);
const copyingFilm = ref<FilmCollection | null>(null);
const selectedItemEvents = ref<Event[] | undefined>([]);
const filmToDelete = ref<FilmCollection | null>(null);

const uniqueNames = computed(() => [
  ...new Set(filmCollections.value.map((f) => f.name)),
]);
const uniqueBrands = computed(() => [
  ...new Set(filmCollections.value.map((f) => f.brand)),
]);
const uniqueSources = computed(() => [
  ...new Set(filmCollections.value.map((f) => f.source).filter(Boolean)),
]);

const fetchFilmCollections = async () => {
  filmCollections.value = await getFilmCollections();
};
onMounted(fetchFilmCollections);

const createNewFilm = async (newFilm: FilmCollection) => {
  const data = await createFilmCollection({
    ...newFilm,
    event_log: [
      {
        event: FilmEvent.acquired,
        date: newFilm.date_acquired,
      } as Event,
    ],
  });
  filmCollections.value.push(data);
  createDialogVisible.value = false;
};

const selectFilm = (film: FilmCollection | undefined) => {
  console.log(film);
  selectedFilm.value = film;
};

const editFilm = async (film: FilmCollection) => {
  editingFilm.value = { ...film };
  editDialogVisible.value = true;
};

const confirmDeleteFilm = (film: FilmCollection) => {
  filmToDelete.value = film;
  deleteDialogVisible.value = true;
};

const deleteFilm = async () => {
  if (filmToDelete.value) {
    await deleteFilmCollection(filmToDelete.value.id);
    filmCollections.value = filmCollections.value.filter(
      (f) => f.id !== filmToDelete.value!.id
    );
    filmToDelete.value = null;
    deleteDialogVisible.value = false;
    selectedFilm.value = undefined;
  }
};

const copyFilm = (film: FilmCollection) => {
  copyingFilm.value = { ...film };
  copyDialogVisible.value = true;
};

const saveEditedFilm = async (editedFilm: FilmCollection) => {
  const index = filmCollections.value.findIndex((f) => f.id === editedFilm.id);
  if (index !== -1) {
    filmCollections.value[index] = editedFilm;
  }
  await updateFilmCollection(editedFilm.id, editedFilm);
  editDialogVisible.value = false;
  editingFilm.value = null;
  selectedFilm.value = editedFilm;
};

const showEventLog = (item: FilmCollection) => {
  selectedItemEvents.value = item.event_log || [];
  eventLogDialogVisible.value = true;
};
</script>

<template>
  <v-container>
    <v-row class="ma-2 mb-4">
      <div class="d-flex align-center ga-4">
        <v-btn color="primary" @click="createDialogVisible = true">
          New Film Entry
        </v-btn>
        <div v-if="selectedFilm !== undefined" class="d-flex align-center ga-2">
          <v-btn icon @click="editFilm(selectedFilm)">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn icon @click="copyFilm(selectedFilm)">
            <v-icon>mdi-content-copy</v-icon>
          </v-btn>
          <v-btn color="red" icon @click="confirmDeleteFilm(selectedFilm)">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </div>
      </div>

      <v-col class="d-flex justify-end align-center">
        <span class="mr-4">{{ session?.user.email }}</span>
        <v-btn
          density="comfortable"
          color="primary"
          icon="mdi-logout"
          @click="supabase.auth.signOut()"
        />
      </v-col>
    </v-row>

    <FilmCollectionTable
      :films="filmCollections"
      @select="selectFilm"
      @show-event-log="showEventLog"
    />

    <CreateFilmDialog
      v-model="createDialogVisible"
      :unique-names="uniqueNames"
      :unique-brands="uniqueBrands"
      :unique-sources="uniqueSources"
      @create="createNewFilm"
    />

    <EditFilmDialog
      v-model="editDialogVisible"
      :film="editingFilm"
      :unique-names="uniqueNames"
      :unique-brands="uniqueBrands"
      :unique-sources="uniqueSources"
      @save="saveEditedFilm"
    />

    <EditFilmDialog
      v-if="copyingFilm"
      v-model="copyDialogVisible"
      :film="copyingFilm"
      :unique-names="uniqueNames"
      :unique-brands="uniqueBrands"
      :unique-sources="uniqueSources"
      @save="createNewFilm"
    />

    <EventLogDialog
      v-if="eventLogDialogVisible && selectedItemEvents"
      v-model="eventLogDialogVisible"
      :events="selectedItemEvents"
    />

    <v-dialog v-model="deleteDialogVisible" max-width="500">
      <v-card>
        <v-card-title class="headline">Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete this film collection entry?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="deleteDialogVisible = false">
            Cancel
          </v-btn>
          <v-btn color="red" @click="deleteFilm">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
