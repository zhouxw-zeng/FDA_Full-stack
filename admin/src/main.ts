import { createPinia } from 'pinia';
import { createApp } from 'vue';

import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import '@/styles/index.scss';

import App from './App.vue';
import { UNAUTHORIZED_EVENT } from './api/request';
import router from './router';
import { setupRouterGuard } from './router/guards';
import { useAppStore } from './stores/app';
import { usePermissionStore } from './stores/permission';
import { useUserStore } from './stores/user';

async function bootstrap(): Promise<void> {
  // 构建期常量：USE_MOCK=false 时该分支在代码分割前就被移除，mock 依赖不会进包
  if (__USE_MOCK__) {
    const { setupMock } = await import('./mock');
    setupMock();
  }

  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia);
  useAppStore().applyTheme();

  setupRouterGuard(router);
  app.use(router);
  app.use(ElementPlus, { locale: zhCn });

  window.addEventListener(UNAUTHORIZED_EVENT, () => {
    useUserStore().clearAuth();
    usePermissionStore().reset();
    void router.replace({
      name: 'Login',
      query: { redirect: router.currentRoute.value.fullPath },
    });
  });

  app.mount('#app');
}

void bootstrap();
