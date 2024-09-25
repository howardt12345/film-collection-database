<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { FilmCollection, Event } from "@/types/film-collection";
import {
  getFilmCollections,
  createFilmCollection,
  updateFilmCollection,
  deleteFilmCollection,
} from "@/api/film-collection";
import FilmCollectionTable from "./FilmCollectionTable.vue";
import CreateFilmDialog from "./CreateFilmDialog.vue";
import EditFilmDialog from "./EditFilmDialog.vue";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/api/supabase";
defineProps<{
  session: Session | null;
}>();

const filmCollections = ref<FilmCollection[]>([]);
const createDialogVisible = ref(false);
const editDialogVisible = ref(false);
const copyDialogVisible = ref(false);
const deleteDialogVisible = ref(false);

const editingFilm = ref<FilmCollection | null>(null);
const copyingFilm = ref<FilmCollection | null>(null);
const filmToDelete = ref<FilmCollection | null>(null);
const eventToDelete = ref<{ filmId: number; eventId: string } | null>(null);

const uniqueNames = computed(() => [
  ...new Set(filmCollections.value.map((f) => f.name)),
]);
const uniqueBrands = computed(() => [
  ...new Set(filmCollections.value.map((f) => f.brand)),
]);
const uniqueSources = computed(() => [
  ...new Set(filmCollections.value.map((f) => f.source).filter(Boolean)),
]);
const uniqueEvents = computed(() => [
  ...new Set(
    filmCollections.value
      .flatMap((f) => f?.event_log?.map((e) => e.event))
      .filter((event): event is string => Boolean(event))
  ),
]);

const fetchFilmCollections = async () => {
  filmCollections.value = await getFilmCollections();
};
onMounted(fetchFilmCollections);

const createNewFilm = async (newFilm: FilmCollection) => {
  const data = await createFilmCollection({
    ...newFilm,
    event_log: newFilm.event_log || [
      {
        event: "Acquired",
        date: newFilm.date_acquired,
      } as Event,
    ],
  });
  filmCollections.value.push(data);
  createDialogVisible.value = false;
};

const editFilm = (film: FilmCollection) => {
  editingFilm.value = { ...film };
  editDialogVisible.value = true;
};

const copyFilm = (film: FilmCollection) => {
  copyingFilm.value = { ...film };
  copyDialogVisible.value = true;
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
  }
};

const saveEditedFilm = async (editedFilm: FilmCollection) => {
  const index = filmCollections.value.findIndex((f) => f.id === editedFilm.id);
  if (index !== -1) {
    filmCollections.value[index] = editedFilm;
  }
  await updateFilmCollection(editedFilm.id, editedFilm);
  editDialogVisible.value = false;
  editingFilm.value = null;
};

const addEventToFilm = async (filmId: number, newEvent: Event) => {
  const film = filmCollections.value.find((f) => f.id === filmId);
  if (film) {
    if (!film.event_log) {
      film.event_log = [];
    }
    film.event_log.push(newEvent);
    await updateFilmCollection(filmId, film);
  }
};

const editEvent = async (
  filmId: number,
  eventId: string,
  updatedEvent: Event
) => {
  const film = filmCollections.value.find((f) => f.id === filmId);
  if (film) {
    const eventIndex = film.event_log?.findIndex((e) => e.id === eventId);
    if (!!eventIndex && eventIndex !== -1 && film?.event_log) {
      film.event_log[eventIndex] = updatedEvent;
      await updateFilmCollection(filmId, film);
    }
  }
};

const confirmDeleteEvent = (filmId: number, eventId: string) => {
  eventToDelete.value = { filmId, eventId };
  deleteDialogVisible.value = true;
};

const dismissDeleteEvent = () => {
  eventToDelete.value = null;
  deleteDialogVisible.value = false;
};

const deleteEvent = async () => {
  if (eventToDelete.value) {
    const film = filmCollections.value.find(
      (f) => f.id === eventToDelete.value!.filmId
    );
    if (film) {
      console.log(film.event_log);
      film.event_log = film.event_log?.filter(
        (e) => e.id !== eventToDelete.value!.eventId
      );
      console.log(film.event_log);
      await updateFilmCollection(film.id, film);
    }
    eventToDelete.value = null;
    deleteDialogVisible.value = false;
  }
};
</script>

<template>
  <v-container>
    <v-row class="ma-2 mb-4">
      <div class="d-flex align-center ga-4">
        <v-btn color="primary" @click="createDialogVisible = true">
          New Film Entry
        </v-btn>
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
      :unique-events="uniqueEvents"
      @edit="editFilm"
      @copy="copyFilm"
      @delete="confirmDeleteFilm"
      @add-event="addEventToFilm"
      @edit-event="editEvent"
      @delete-event="confirmDeleteEvent"
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

    <v-dialog v-model="deleteDialogVisible" max-width="500">
      <v-card>
        <v-card-title class="headline">Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete this
          <template v-if="eventToDelete">event</template>
          <template v-else>film collection entry</template>?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="dismissDeleteEvent">Cancel</v-btn>
          <v-btn
            color="red"
            @click="eventToDelete ? deleteEvent() : deleteFilm()"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
