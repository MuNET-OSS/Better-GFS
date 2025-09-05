import { useStorage } from '@vueuse/core';
import useAsync from '@/hooks/useAsync';
import napcat from '@/api/napcat';
import { computed } from 'vue';

export const apiAddress = import.meta.env.VITE_API_BASE_URL ? computed({
  get: () => import.meta.env.VITE_API_BASE_URL,
  set: () => {
  },
}) : useStorage('napcatHttpApi', '');

export const token = useStorage('bearerToken', '');

export const myInfo = useAsync(() => {
  if (import.meta.env.VITE_VIEWER_ONLY) return null;
  if (!apiAddress.value)
    return null;
  return napcat.getMe();
});
