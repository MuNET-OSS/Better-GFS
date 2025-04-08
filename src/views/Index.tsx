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
    onMounted(() => {
      if (!apiAddress.value)
        router.replace('/setup');
    });

    const myGroups = useAsync(() => {
      if (!myInfo.data.value)
        return null;
      return napcat.getGroups();
    }, []);

    whenever(() => myInfo.error.value || myGroups.error.value, error => {
      message.error(error.message);
      router.replace('/setup');
    });

    return () => <div class={'grid cols-[300px_minmax(0,1fr)] gap-4'}>
      <div class={'h-100vh overflow-y-auto p-2'}>
        {myGroups.data.value?.map(it =>
          <GroupSection
            key={it.group_id} id={it.group_id} name={it.group_name} onClick={() => {
            router.push(`/${it.group_id}/`);
          }}
          />)}
      </div>
      <RouterView/>
    </div>;
  },
});
