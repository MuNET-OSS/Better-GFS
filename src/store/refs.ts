import { useStorage } from '@vueuse/core';
import useAsync from '@/hooks/useAsync';
import napcat from '@/api/napcat';

export const apiAddress = useStorage('napcatHttpApi', '');

export const myInfo = useAsync(() => {
  if (!apiAddress.value)
    return null;
  return napcat.getMe();
});
