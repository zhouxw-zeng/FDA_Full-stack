import { createRouter, createWebHistory } from 'vue-router';

import { constantRoutes } from './routes';

const router = createRouter({
  history: createWebHistory(__BASE_PATH__),
  routes: constantRoutes,
  scrollBehavior: () => ({ top: 0, left: 0 }),
});

export default router;

