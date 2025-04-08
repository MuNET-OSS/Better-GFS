import { defineComponent, PropType, ref, computed } from 'vue';
import { MediaPreviewType } from '@/enums';
import { useVModel } from '@vueuse/core';
import { NModal } from 'naive-ui';

export default defineComponent({
  props: {
    url: String,
    type: Number as PropType<MediaPreviewType>,
  },
  setup(props, { emit }) {
    const type = useVModel(props, 'type', emit);

    return () => <NModal
      preset="card"
      class="w-60vw"
      title="媒体预览"
      show={type.value != 0}
      onUpdateShow={() => {
        type.value = MediaPreviewType.None;
      }}
    >
      {{
        default: () => {
          switch (type.value) {
            case MediaPreviewType.Image:
              return <img src={props.url} class="w-full h-80vh object-contain" />;
            case MediaPreviewType.Video:
              return <video src={props.url} class="w-full h-80vh object-contain" controls />;
            case MediaPreviewType.Audio:
              return <audio src={props.url} class="w-full h-80vh object-contain" controls />;
            default:
              return <div>不支持的文件类型</div>;
          }
        },
      }}
    </NModal>;
  },
});
