/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from "@/plugins";
import { createRouter, createWebHistory } from 'vue-router';

// Components
import App from "./App.vue";
import FilmCollection from "./components/film-collection/FilmCollection.vue";

// Composables
import { createApp } from "vue";

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: FilmCollection,
      props: (route) => ({
        search: route.query.search,
      }),
    },
  ],
});

const app = createApp(App);

registerPlugins(app);
app.use(router); // Add router to app

app.mount("#app");
