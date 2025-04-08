import { createRouter, createWebHistory } from 'vue-router';
import Index from '@/views/Index';
import Protobuf from '@/views/Protobuf';

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Index },
    { path: '/protobuf', component: Protobuf },
  ],
});
