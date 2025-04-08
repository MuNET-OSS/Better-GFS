import { defineComponent, PropType, ref, computed } from 'vue';
import { NButton, NFlex, NInput, useMessage } from 'naive-ui';
import { apiAddress } from '@/store/refs';
import { useRouter } from 'vue-router';

export default defineComponent({
  // props: {
  // },
  setup(props, { emit }) {
    const message = useMessage();
    const router = useRouter();
    const start = () => {
      if (!apiAddress.value) {
        message.error('请输入地址');
        return;
      }
      if (!apiAddress.value.startsWith('http')) {
        apiAddress.value = `http://${apiAddress.value}`;
      }
      if (apiAddress.value.endsWith('/')) {
        apiAddress.value = apiAddress.value.slice(0, -1);
      }
      router.replace('/');
    };

    return () => <div class="h-100vh flex items-center justify-center">
      <NFlex>
        输入 NapCat API 地址
        <NInput v-model:value={apiAddress.value} />
        <NButton onClick={start}>启动！</NButton>
      </NFlex>
    </div>;
  },
});
