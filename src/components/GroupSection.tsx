import { defineComponent, PropType, ref, computed } from 'vue';
import { NAvatar } from 'naive-ui';
import { useRoute } from 'vue-router';

export default defineComponent({
  props: {
    id: Number,
    name: String,
    onClick: Function,
  },
  setup(props, { emit }) {
    const route = useRoute();
    const selected = computed(() => {
      const groupId = Number(route.params.groupId);
      return groupId === props.id;
    });

    return () => <div class={['flex gap-3 p-2 m-y-1 rd-md hover:bg-zinc-3 items-center cursor-default', selected.value && 'bg-[rgba(221,243,238,0.6)]']} onClick={props.onClick as any}>
      <NAvatar src={`https://p.qlogo.cn/gh/${props.id}/${props.id}/0`} size={45} class={'shrink-0'} round />
      <div class={'flex flex-col gap-1 grow w-0'}>
        <div class={'of-hidden ws-nowrap text-ellipsis'}>{props.name}</div>
        <div class={'text-sm c-gray'}>{props.id}</div>
      </div>
    </div>;
  },
});
