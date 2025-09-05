import { defineComponent, PropType, ref, computed, onMounted } from 'vue';
import { apiAddress, myInfo } from '@/store/refs';
import { RouterView, useRouter } from 'vue-router';
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
    const message = useMessage();
    const isAuthError = ref(false);
    onMounted(() => {
      if (!apiAddress.value)
        router.replace({ name: 'setup' });
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

    return () => isAuthError.value ?
      <div class="flex bg-red-1/50 text-red-9 text-8 flex justify-center items-center font-bold h-100dvh">
        鉴权失败，请再获取一个访问 URL
      </div>
      :
      <div class={'grid cols-[300px_minmax(0,1fr)] gap-4'}>
        <div class={'h-100vh overflow-y-auto p-2'}>
          {myGroups.data.value?.map(it =>
            <GroupSection
              key={it.group_id} id={it.group_id} name={it.group_name} onClick={() => {
              router.push({ name: 'groupRoot', params: { groupId: it.group_id } });
            }}
            />)}
        </div>
        <RouterView />
      </div>;
  },
});
