import Index from './views/index.vue';

export default [
  {
    path: '/',
    name: 'index',
    component: Index,
  },
  {
    path: '/dt/:oid?',
    name: 'dt',
    component: () => import('./views/dt.vue'),
  },
  {
    path: '/a2e/:oid?',
    name: 'a2e',
    component: () => import('./views/a2e.vue'),
  },
];
