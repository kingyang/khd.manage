import './style.css';
import 'virtual:uno.css';
import 'virtual:unocss-devtools';
import 'dayjs/locale/zh-cn';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { createApp } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';

import App from './App.vue';
import routes from './routes';

dayjs.locale('zh-cn');
dayjs.extend(relativeTime);

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
createApp(App).use(router).mount('#app');
