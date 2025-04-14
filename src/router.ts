import { createRouter, createWebHashHistory } from 'vue-router';

export default createRouter({
  history: createWebHashHistory(),
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
  ],
});
