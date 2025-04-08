import { defineComponent } from 'vue';
import { dateZhCN, NConfigProvider, NMessageProvider, NNotificationProvider, zhCN } from 'naive-ui';
import { RouterView } from 'vue-router';

export default defineComponent({
  render() {
    return (
      <NConfigProvider locale={zhCN} dateLocale={dateZhCN}>
        <NMessageProvider>
          <NNotificationProvider>
            <RouterView />
          </NNotificationProvider>
        </NMessageProvider>
      </NConfigProvider>
    );
  },
});
