import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'root',
      component: DashboardView,
    },
    {
      path: '/:name',
      name: 'dashboard',
      component: DashboardView,
      props: true,
    },
  ],
})

export default router
