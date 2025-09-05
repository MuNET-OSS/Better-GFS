import { defineComponent } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { token } from '@/store/refs';

export default defineComponent({
  setup(){
    const route = useRoute();
    const router = useRouter();

    token.value = route.params.token as string;
    router.replace({ name: 'index' });
  }
});
