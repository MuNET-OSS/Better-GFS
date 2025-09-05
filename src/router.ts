import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router';

export default createRouter({
  history: import.meta.env.VITE_HASH_HISTORY ? createWebHashHistory() : createWebHistory(),
  routes: [
    {
      path: '/', component: () => import('./views/Index'), children: [
        { path: ':groupId', component: () => import('./views/FolderView'), name: 'groupRoot' },
        { path: ':groupId/:folderId', component: () => import('./views/FolderView'), name: 'groupFolder' },
      ],
      name: 'index',
    },
    { path: '/protobuf', component: () => import('./views/Protobuf') },
    { path: '/setup', component: () => import('./views/SetApiAddress'), name: 'setup' },
    { path: '/token/:token', component: () => import('./views/token'), name: 'token' },
  ],
});
