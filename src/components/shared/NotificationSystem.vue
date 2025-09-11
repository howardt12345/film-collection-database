<script setup lang="ts">
import { useErrorHandling } from "@/composables/useErrorHandling";

const { errors, clearError } = useErrorHandling();

const getColor = (type: string) => {
  switch (type) {
    case "error":
      return "error";
    case "success":
      return "success";
    case "warning":
      return "warning";
    case "info":
      return "info";
    default:
      return "info";
  }
};

const getIcon = (type: string) => {
  switch (type) {
    case "error":
      return "mdi-alert-circle";
    case "success":
      return "mdi-check-circle";
    case "warning":
      return "mdi-alert";
    case "info":
      return "mdi-information";
    default:
      return "mdi-information";
  }
};
</script>

<template>
  <div class="notification-system">
    <v-snackbar
      v-for="error in errors"
      :key="error.message + error.type"
      :model-value="true"
      :color="getColor(error.type)"
      :timeout="error.duration || 5000"
      multi-line
      vertical
      @update:model-value="!$event && clearError(error)"
    >
      <div class="d-flex align-center">
        <v-icon :icon="getIcon(error.type)" class="mr-2" />
        {{ error.message }}
      </div>

      <template #actions>
        <v-btn color="white" variant="text" @click="clearError(error)">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<style scoped>
.notification-system {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 9999;
}
</style>
