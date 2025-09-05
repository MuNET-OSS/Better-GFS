import { defineComponent, PropType, ref, computed, onMounted, watch } from 'vue';
import { apiAddress, myInfo } from '@/store/refs';
import { RouterView, useRouter, useRoute } from 'vue-router';
import useAsync from '@/hooks/useAsync';
import { whenever } from '@vueuse/core';
import { useMessage } from 'naive-ui';
import napcat from '@/api/napcat';
import GroupSection from '@/components/GroupSection';

export default defineComponent({
  // props: {
  // },
  setup(props, { emit }) {
    const router = useRouter();
    const route = useRoute();
    const message = useMessage();
    const isAuthError = ref(false);
    const isSidebarOpen = ref(false);

    // 检查是否选择了群组
    const hasSelectedGroup = computed(() => {
      return route.name === 'groupRoot' && route.params.groupId;
    });

    onMounted(() => {
      if (!apiAddress.value)
        router.replace({ name: 'setup' });

      // 如果没有选择群组，在移动端默认打开侧栏
      if (!hasSelectedGroup.value && window.innerWidth < 768) {
        isSidebarOpen.value = true;
      }
    });

    // 监听路由变化，当没有选择群组时在移动端打开侧栏
    watch(() => route.name, (newRouteName) => {
      if (newRouteName !== 'groupRoot' && window.innerWidth < 768) {
        isSidebarOpen.value = true;
      }
    });

    const myGroups = useAsync(() => {
      if (!myInfo.data.value && !import.meta.env.VITE_VIEWER_ONLY)
        return null;
      return napcat.getGroups();
    }, []);

    whenever(() => myInfo.error.value || myGroups.error.value, error => {
      if (import.meta.env.VITE_VIEWER_ONLY && error?.message === '无权限') {
        isAuthError.value = true;
      }
      else {
        message.error(error.message);
        router.replace({ name: 'setup' });
      }
    });

    // 移动端侧栏控制函数
    const toggleSidebar = () => {
      isSidebarOpen.value = !isSidebarOpen.value;
    };

    const closeSidebar = () => {
      isSidebarOpen.value = false;
    };

    return () => isAuthError.value ?
      <div class="flex bg-red-1/50 text-red-9 text-8 flex justify-center items-center font-bold h-100dvh">
        鉴权失败，请再获取一个访问 URL
      </div>
      :
      <div class={'flex h-screen'}>
        {/* 侧栏 */}
        <div class={[
          'fixed md:static top-0 left-0 h-full w-80 bg-white md:border-none border-r border-gray-200 z-50 transition-transform duration-300 ease-in-out',
          'md:translate-x-0',
          isSidebarOpen.value ? 'translate-x-0' : '-translate-x-full'
        ]}>
          {/* 移动端侧栏头部 */}
          <div class={'md:hidden flex items-center justify-between p-4 border-b border-gray-200'}>
            <h2 class={'text-lg font-semibold'}>群组列表</h2>
            <button
              onClick={closeSidebar}
              class={'p-2 rounded-md hover:bg-gray-100 transition-colors text-xl'}
            >
              ✕
            </button>
          </div>

          {/* 群组列表 */}
          <div class={'h-full overflow-y-auto p-2'}>
            {myGroups.data.value?.map(it =>
              <GroupSection
                key={it.group_id}
                id={it.group_id}
                name={it.group_name}
                onClick={() => {
                  router.push({ name: 'groupRoot', params: { groupId: it.group_id } });
                  closeSidebar(); // 移动端点击后关闭侧栏
                }}
              />
            )}
          </div>
        </div>

        {/* 主内容区域 */}
        <div class={'flex-1 flex flex-col min-w-0'}>
          {/* 移动端顶部栏 */}
          <div class={'md:hidden flex items-center justify-between p-4 bg-white'}>
            <button
              onClick={toggleSidebar}
              class={'p-2 rounded-md hover:bg-gray-100 transition-colors'}
            >
              群组列表
            </button>
            <div>群文件</div>
            <div class={'w-10'}></div> {/* 占位符保持居中 */}
          </div>

          {/* 路由内容 */}
          <div class={'flex-1 overflow-hidden'}>
            <RouterView />
          </div>
        </div>

        {/* 侧栏遮罩层 (仅移动端) */}
        {isSidebarOpen.value && (
          <div
            class={'md:hidden fixed inset-0 bg-black bg-opacity-50 z-40'}
            onClick={closeSidebar}
          />
        )}
      </div>;
  },
});
