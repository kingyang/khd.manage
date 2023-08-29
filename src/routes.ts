import Index from './views/index.vue';
import Login from './views/login.vue';

export default [
  {
    path: '/',
    name: 'index',
    component: Index,
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
  },
];
