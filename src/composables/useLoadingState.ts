import { ref, computed } from "vue";

export function useLoadingState() {
  const loadingStates = ref<Record<string, boolean>>({});

  const setLoading = (key: string, isLoading: boolean) => {
    loadingStates.value[key] = isLoading;
  };

  const isLoading = (key: string): boolean => {
    return loadingStates.value[key] || false;
  };

  const isAnyLoading = computed(() => {
    return Object.values(loadingStates.value).some(Boolean);
  });

  const withLoading = async <T>(
    key: string,
    operation: () => Promise<T>,
  ): Promise<T> => {
    setLoading(key, true);
    try {
      return await operation();
    } finally {
      setLoading(key, false);
    }
  };

  return {
    loadingStates,
    setLoading,
    isLoading,
    isAnyLoading,
    withLoading,
  };
}
