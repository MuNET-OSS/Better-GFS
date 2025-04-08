import { createRouter, createWebHistory } from 'vue-router';
import Index from '@/views/Index';
import Protobuf from '@/views/Protobuf';
import SetApiAddress from '@/views/SetApiAddress';

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Index },
    { path: '/protobuf', component: Protobuf },
    { path: '/setup', component: SetApiAddress },
  ],
});
