<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useCamerasStore } from '@/stores/cameras';
import { useEventsStore } from '@/stores/events';
import { Camera } from '@/types/film-collection';
import CameraTable from '@/components/film-collection/camera/CameraTable.vue';
import CreateCameraDialog from '@/components/film-collection/camera/CreateCameraDialog.vue';
import EditCameraDialog from '@/components/film-collection/camera/EditCameraDialog.vue';

const camerasStore = useCamerasStore();
const eventsStore = useEventsStore();

// UI state
const createCameraDialog = ref(false);
const editCameraDialog = ref(false);
const editingCamera = ref<Camera | null>(null);

// Computed properties from stores
const cameras = computed(() => camerasStore.sortedCameras);
const filmEvents = computed(() => eventsStore.events);
const uniqueCameraBrands = computed(() => camerasStore.uniqueBrands);

// Load data on component mount
onMounted(async () => {
  await Promise.all([
    eventsStore.fetchEvents(),
    camerasStore.fetchCameras(),
  ]);
});

// Camera CRUD operations
const handleCreateCamera = async (camera: Camera) => {
  await camerasStore.createCamera(camera);
  createCameraDialog.value = false;
};

const editCamera = (camera: Camera) => {
  editingCamera.value = { ...camera };
  editCameraDialog.value = true;
};

const handleUpdateCamera = async (camera: Camera) => {
  await camerasStore.updateCamera(camera.id, camera);
  editCameraDialog.value = false;
  editingCamera.value = null;
};

const confirmDeleteCamera = async (camera: Camera) => {
  if (confirm(`Are you sure you want to delete ${camera.brand} ${camera.model}?`)) {
    await camerasStore.deleteCamera(camera.id);
  }
};
</script>

<template>
  <v-container>
    <div class="d-flex align-center ga-4 mb-2">
      <v-btn color="primary" @click="createCameraDialog = true">
        New Camera
      </v-btn>
    </div>

    <CameraTable
      :cameras="cameras"
      :filmEvents="filmEvents"
      @edit="editCamera"
      @delete="confirmDeleteCamera"
    />

    <CreateCameraDialog
      v-model="createCameraDialog"
      :unique-brands="uniqueCameraBrands"
      @create="handleCreateCamera"
    />

    <EditCameraDialog
      v-model="editCameraDialog"
      :camera="editingCamera"
      :unique-brands="uniqueCameraBrands"
      @save="handleUpdateCamera"
    />
  </v-container>
</template>
