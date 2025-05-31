import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

// Views
import FilmsView from '@/views/FilmsView.vue';
import EventsView from '@/views/EventsView.vue';
import CamerasView from '@/views/CamerasView.vue';
import UniqueFilmsView from '@/views/UniqueFilmsView.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/films',
  },
  {
    path: '/films',
    name: 'Films',
    component: FilmsView,
    props: (route) => ({
      search: route.query.search,
    }),
  },
  {
    path: '/events',
    name: 'Events',
    component: EventsView,
  },
  {
    path: '/cameras',
    name: 'Cameras',
    component: CamerasView,
  },
  {
    path: '/unique-films',
    name: 'UniqueFilms',
    component: UniqueFilmsView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
