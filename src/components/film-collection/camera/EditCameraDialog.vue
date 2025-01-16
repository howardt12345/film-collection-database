<script setup lang="ts">
import { ref, watch } from "vue";
import { Camera } from "@/types/film-collection";
import CameraForm from "../../forms/CameraForm.vue";

const props = defineProps<{
  modelValue: boolean;
  camera: Camera | null;
  uniqueBrands: string[];
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "save", camera: Camera): void;
}>();

const editingCamera = ref<Camera | null>(null);

watch(
  () => props.camera,
  (newCamera) => {
    if (newCamera) {
      editingCamera.value = { ...newCamera };
    }
  },
  { immediate: true },
);
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    max-width="500"
  >
    <v-card v-if="editingCamera">
      <v-card-title>Edit Camera</v-card-title>
      <v-card-text>
        <CameraForm
          v-model:camera="editingCamera"
          :unique-brands="uniqueBrands"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="secondary" @click="emit('update:modelValue', false)">Cancel</v-btn>
        <v-btn color="primary" @click="emit('save', editingCamera)">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
