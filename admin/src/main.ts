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
import { resetDynamicRoutes } from './router/register';
import { useAppStore } from './stores/app';
import { usePermissionStore } from './stores/permission';
import { useUserStore } from './stores/user';

async function bootstrap(): Promise<void> {
  // 论坛 / 客户 / 广告 / 分析等模块后端尚未实现，开发环境用本地数据兜底；
  // 登录、刷新令牌、路由树始终走真实接口（mock 未命中的请求会透传）。
  if (__USE_BUSINESS_MOCK__) {
    const { setupBusinessMock } = await import('./mock');
    setupBusinessMock();
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
    resetDynamicRoutes(router);
    void router.replace({
      name: 'Login',
      query: { redirect: router.currentRoute.value.fullPath },
    });
  });

  app.mount('#app');
}

void bootstrap();
