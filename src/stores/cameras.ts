import { defineStore } from 'pinia';
import { Camera } from '@/types/film-collection';
import {
  getCameras,
  createCamera,
  updateCamera,
  deleteCamera,
} from '@/api/film-collection';
import { useEventsStore } from './events';

export const useCamerasStore = defineStore('cameras', {
  state: () => ({
    cameras: [] as Camera[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getCameraById: (state) => (id: number) => {
      return state.cameras.find((camera) => camera.id === id);
    },

    uniqueBrands: (state) => {
      return Array.from(new Set(state.cameras.map((camera) => camera.brand)))
        .filter(Boolean)
        .sort();
    },

    sortedCameras: (state) => {
      return [...state.cameras].sort((a, b) => {
        const brandCompare = a.brand.localeCompare(b.brand);
        if (brandCompare !== 0) return brandCompare;
        return a.model.localeCompare(b.model);
      });
    },

    activeCameras: (state) => {
      return state.cameras.filter((camera) => !camera.date_sold);
    },
  },

  actions: {
    async fetchCameras() {
      this.loading = true;
      this.error = null;
      try {
        this.cameras = await getCameras();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error fetching cameras:', error);
      } finally {
        this.loading = false;
      }
    },

    async createCamera(camera: Omit<Camera, 'id'>) {
      this.loading = true;
      this.error = null;
      try {
        const newCamera = await createCamera(camera);
        this.cameras.push(newCamera);
        return newCamera;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error creating camera:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateCamera(id: number, cameraData: Partial<Camera>) {
      this.loading = true;
      this.error = null;
      try {
        const updatedCamera = await updateCamera(id, cameraData);

        // Update local state
        const index = this.cameras.findIndex((c) => c.id === id);
        if (index !== -1) {
          this.cameras[index] = updatedCamera;
        }

        return updatedCamera;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error updating camera:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteCamera(id: number) {
      this.loading = true;
      this.error = null;
      try {
        await deleteCamera(id);

        // Remove from local state
        this.cameras = this.cameras.filter((c) => c.id !== id);

        // Also update events store to remove this camera from events
        const eventsStore = useEventsStore();
        await this.removeCameraFromEvents(id);

        return true;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error deleting camera:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async removeCameraFromEvents(cameraId: number) {
      const eventsStore = useEventsStore();

      // Find all events that have this camera
      const eventsWithCamera = eventsStore.events.filter(
        (event) => event.camera_ids?.includes(cameraId)
      );

      // Remove the camera from each event
      for (const event of eventsWithCamera) {
        const updatedCameraIds = (event.camera_ids || []).filter(
          (id) => id !== cameraId
        );

        await eventsStore.updateEventCameras(event.id, updatedCameraIds);
      }
    }
  },
});
