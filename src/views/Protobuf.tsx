import { defineComponent, PropType, ref, computed } from 'vue';
import { NButton, NFlex, NInput } from 'naive-ui';
import pb from '@/utils/pb';


export default defineComponent({
  // props: {
  // },
  setup(props, { emit }) {
    const json = ref('');
    const protoHex = ref('');

    return () => <div>
      <div class="grid cols-2">
        <NInput type="textarea" v-model:value={json.value} autosize={{ minRows: 20, maxRows: 20 }} />
        <NInput type="textarea" v-model:value={protoHex.value} autosize={{ minRows: 20, maxRows: 20 }} />
      </div>
      <NFlex>
        <NButton
          onClick={() => {
            const data = JSON.parse(json.value);
            const buffer = pb.encode(data);
            protoHex.value = Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
          }}
        >
          编码
        </NButton>
        <NButton
          onClick={() => {
            const buffer = Buffer.from(protoHex.value, 'hex');
            const data = pb.decode(buffer);
            json.value = JSON.stringify(data, null, 2);
          }}
        >
          解码
        </NButton>
      </NFlex>
    </div>;
  },
});
