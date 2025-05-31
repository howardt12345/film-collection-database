<script setup lang="ts">
import { ref, onMounted } from "vue";
import { supabase } from "@/api/supabase";
import { Session } from "@supabase/supabase-js";
import Auth from "@/components/Auth.vue";

const session = ref<Session | null>();

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
    <v-app-bar v-if="session" color="primary" density="compact">
      <v-app-bar-title>Film Collection</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-tabs>
        <v-tab to="/films">Films</v-tab>
        <v-tab to="/events">Events</v-tab>
        <v-tab to="/cameras">Cameras</v-tab>
        <v-tab to="/unique-films">Unique Films</v-tab>
      </v-tabs>
      <v-spacer></v-spacer>
      <span class="mr-4">{{ session?.user.email }}</span>
      <v-btn
        density="comfortable"
        color="white"
        icon="mdi-logout"
        @click="supabase.auth.signOut()"
      />
    </v-app-bar>

    <v-main>
      <v-container v-if="session">
        <router-view :session="session" />
      </v-container>
      <Auth v-else />
    </v-main>
  </v-app>
</template>
