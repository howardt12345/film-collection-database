<script setup lang="ts">
import { ref, onMounted } from 'vue'
import  { supabase } from '@/api/supabase'
import { Session } from '@supabase/supabase-js';

const session = ref<Session | null>()

onMounted(() => {
  supabase.auth.getSession().then(({ data }) => {
    session.value = data.session
  })

  supabase.auth.onAuthStateChange((_, _session) => {
    session.value = _session
  })
})
</script>


<template>
  <v-app>
    <v-main>
      <FilmCollection v-if="session" :session="session" />
      <Auth v-else />
    </v-main>
  </v-app>
</template>

