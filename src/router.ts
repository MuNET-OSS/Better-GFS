import { createRouter, createWebHistory } from 'vue-router';
import Index from '@/views/Index';
import Protobuf from '@/views/Protobuf';
import SetApiAddress from '@/views/SetApiAddress';
import FolderView from '@/views/FolderView';

export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/', component: Index, children: [
        { path: ':groupId', component: FolderView },
        { path: ':groupId/:folderId', component: FolderView },
      ],
    },
    { path: '/protobuf', component: Protobuf },
    { path: '/setup', component: SetApiAddress },
  ],
});
