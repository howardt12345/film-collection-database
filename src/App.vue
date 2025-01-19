<script setup lang="ts">
import { ref, onMounted } from "vue";
import { supabase } from "@/api/supabase";
import { Session } from "@supabase/supabase-js";
import { useRouter } from "vue-router";

const session = ref<Session | null>();
const router = useRouter();

onMounted(() => {
  supabase.auth.getSession().then(({ data }) => {
    session.value = data.session;
  });

  supabase.auth.onAuthStateChange((_, _session) => {
    session.value = _session;
  });
});
</script>

<template>
  <v-app>
    <v-main>
      <v-container v-if="session">
        <div class="d-flex justify-end align-center">
          <span class="mr-4">{{ session?.user.email }}</span>
          <v-btn
            density="comfortable"
            color="primary"
            icon="mdi-logout"
            @click="supabase.auth.signOut()"
          />
        </div>
        <router-view :session="session" />
      </v-container>
      <Auth v-else />
    </v-main>
  </v-app>
</template>
