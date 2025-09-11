import { ref } from "vue";

export interface AppError {
  message: string;
  type: "error" | "warning" | "info" | "success";
  duration?: number;
}

export function useErrorHandling() {
  const errors = ref<AppError[]>([]);
  const loading = ref(false);

  const showError = (
    error: string | Error,
    type: AppError["type"] = "error",
    duration = 5000,
  ) => {
    const message = error instanceof Error ? error.message : error;
    const appError: AppError = { message, type, duration };

    errors.value.push(appError);

    if (duration > 0) {
      setTimeout(() => {
        clearError(appError);
      }, duration);
    }
  };

  const clearError = (error: AppError) => {
    const index = errors.value.indexOf(error);
    if (index > -1) {
      errors.value.splice(index, 1);
    }
  };

  const clearAllErrors = () => {
    errors.value = [];
  };

  const handleAsyncOperation = async <T>(
    operation: () => Promise<T>,
    options: {
      loadingMessage?: string;
      successMessage?: string;
      errorMessage?: string;
    } = {},
  ): Promise<T | null> => {
    loading.value = true;

    try {
      const result = await operation();

      if (options.successMessage) {
        showError(options.successMessage, "success", 3000);
      }

      return result;
    } catch (error) {
      const errorMessage =
        options.errorMessage ||
        (error instanceof Error
          ? error.message
          : "An unexpected error occurred");
      showError(errorMessage, "error");
      return null;
    } finally {
      loading.value = false;
    }
  };

  return {
    errors,
    loading,
    showError,
    clearError,
    clearAllErrors,
    handleAsyncOperation,
  };
}
