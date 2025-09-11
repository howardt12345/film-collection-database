import { ref, computed } from "vue";
import { Camera } from "@/types/film-collection";
import {
  getCameras,
  createCamera,
  updateCamera,
  deleteCamera,
} from "@/api/film-collection";
import { useErrorHandling } from "./useErrorHandling";
import { useLoadingState } from "./useLoadingState";

export function useCameras() {
  const { handleAsyncOperation } = useErrorHandling();
  const { withLoading, isLoading } = useLoadingState();

  const cameras = ref<Camera[]>([]);

  // Computed unique values
  const uniqueCameraBrands = computed(() =>
    Array.from(new Set(cameras.value.map((c) => c.brand))),
  );

  // Actions
  const loadCameras = async (): Promise<boolean> => {
    const result = await handleAsyncOperation(
      () => withLoading("loadCameras", () => getCameras()),
      { errorMessage: "Failed to load cameras" },
    );

    if (result) {
      cameras.value = result;
      return true;
    }
    return false;
  };

  const createCameraAction = async (
    camera: Omit<Camera, "id">,
  ): Promise<Camera | null> => {
    const result = await handleAsyncOperation(
      () => withLoading("createCamera", () => createCamera(camera as Camera)),
      {
        successMessage: "Camera added successfully",
        errorMessage: "Failed to create camera",
      },
    );

    if (result) {
      cameras.value.push(result);
      return result;
    }
    return null;
  };

  const updateCameraAction = async (
    cameraId: number,
    updates: Partial<Camera>,
  ): Promise<boolean> => {
    const result = await handleAsyncOperation(
      () =>
        withLoading("updateCamera", () =>
          updateCamera(cameraId, updates as Camera),
        ),
      {
        successMessage: "Camera updated successfully",
        errorMessage: "Failed to update camera",
      },
    );

    if (result) {
      const index = cameras.value.findIndex((c) => c.id === cameraId);
      if (index !== -1) {
        cameras.value[index] = { ...cameras.value[index], ...updates };
      }
      return true;
    }
    return false;
  };

  const deleteCameraAction = async (cameraId: number): Promise<boolean> => {
    const camera = cameras.value.find((c) => c.id === cameraId);
    if (!camera) return false;

    // Show confirmation dialog (this should be handled by the component)
    const confirmed = confirm(
      `Are you sure you want to delete ${camera.brand} ${camera.model}?`,
    );

    if (!confirmed) return false;

    const result = await handleAsyncOperation(
      () => withLoading("deleteCamera", () => deleteCamera(cameraId)),
      {
        successMessage: "Camera deleted successfully",
        errorMessage: "Failed to delete camera",
      },
    );

    if (result !== null) {
      cameras.value = cameras.value.filter((c) => c.id !== cameraId);
      return true;
    }
    return false;
  };

  const getCameraById = (cameraId: number): Camera | undefined => {
    return cameras.value.find((c) => c.id === cameraId);
  };

  return {
    // State
    cameras,
    uniqueCameraBrands,

    // Loading states
    isLoadingCameras: computed(() => isLoading("loadCameras")),
    isCreatingCamera: computed(() => isLoading("createCamera")),
    isUpdatingCamera: computed(() => isLoading("updateCamera")),
    isDeletingCamera: computed(() => isLoading("deleteCamera")),

    // Actions
    loadCameras,
    createCameraAction,
    updateCameraAction,
    deleteCameraAction,
    getCameraById,
  };
}
