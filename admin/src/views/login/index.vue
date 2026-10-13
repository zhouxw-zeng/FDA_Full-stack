<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Lock, User } from '@element-plus/icons-vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';

import { usePermissionStore } from '@/stores/permission';
import { useUserStore } from '@/stores/user';
import type { LoginParams } from '@/types';

defineOptions({ name: 'LoginPage' });

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const permissionStore = usePermissionStore();

const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive<LoginParams>({
  username: 'admin',
  password: '123456',
  remember: true,
});

const rules: FormRules<LoginParams> = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, message: '账号至少 3 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
};

const demoAccounts = [
  { label: '超级管理员', username: 'admin' },
  { label: '论坛运营', username: 'forum' },
  { label: '广告运营', username: 'ads' },
];

function fillAccount(username: string): void {
  form.username = username;
  form.password = '123456';
}

async function handleSubmit(): Promise<void> {
  if (!formRef.value) {
    return;
  }
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) {
    return;
  }

  loading.value = true;
  try {
    await userStore.login({ ...form });
    permissionStore.reset();
    ElMessage.success('登录成功');
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard';
    await router.replace(redirect);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login">
    <section class="login__brand">
      <div class="login__brand-inner">
        <span class="login__logo">相</span>
        <h1 class="login__name">相册视频论坛</h1>
        <p class="login__slogan">相册 · 视频 · 社区运营</p>
      </div>
    </section>

    <section class="login__panel">
      <div class="login__form">
        <header class="login__form-head">
          <h2>登录管理后台</h2>
          <p>请使用平台分配的运营账号登录</p>
        </header>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          size="large"
          @submit.prevent="handleSubmit"
        >
          <el-form-item label="账号" prop="username">
            <el-input v-model="form.username" :prefix-icon="User" placeholder="请输入账号" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              :prefix-icon="Lock"
              placeholder="请输入密码"
              @keyup.enter="handleSubmit"
            />
          </el-form-item>

          <div class="login__row">
            <el-checkbox v-model="form.remember">记住账号</el-checkbox>
          </div>

          <el-button
            type="primary"
            class="login__submit"
            size="large"
            :loading="loading"
            @click="handleSubmit"
          >
            登录
          </el-button>
        </el-form>

        <div class="login__demo">
          <span class="login__demo-label">演示账号</span>
          <div class="login__demo-list">
            <el-button
              v-for="account in demoAccounts"
              :key="account.username"
              size="small"
              plain
              @click="fillAccount(account.username)"
            >
              {{ account.label }}
            </el-button>
          </div>
          <p class="login__demo-tip">账号密码统一为 123456，数据由本地 mock 提供</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.login {
  display: flex;
  height: 100%;
  background-color: var(--app-surface);

  &__brand {
    position: relative;
    display: flex;
    flex: 1 1 46%;
    align-items: flex-end;
    padding: 48px;
    overflow: hidden;
    background-color: var(--app-sidebar-bg);
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
    background-size: 32px 32px;
  }

  &__brand-inner {
    position: relative;
    z-index: 1;
    max-width: 420px;
  }

  &__logo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    color: #fff;
    font-size: 18px;
    font-weight: 600;
    background-color: var(--app-primary);
    border-radius: var(--app-radius-lg);
  }

  &__name {
    margin-top: 20px;
    color: #fff;
    font-size: 30px;
    font-weight: 600;
    letter-spacing: 0;
  }

  &__slogan {
    margin-top: 8px;
    color: var(--app-sidebar-ink);
    font-size: 14px;
  }

  &__panel {
    display: flex;
    flex: 1 1 54%;
    align-items: center;
    justify-content: center;
    padding: 32px;
  }

  &__form {
    width: 100%;
    max-width: 360px;
  }

  &__form-head {
    margin-bottom: 24px;

    h2 {
      color: var(--app-ink);
      font-size: 22px;
      font-weight: 600;
    }

    p {
      margin-top: 6px;
      color: var(--app-ink-3);
      font-size: 13px;
    }
  }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  &__submit {
    width: 100%;
  }

  &__demo {
    padding-top: 20px;
    margin-top: 24px;
    border-top: 1px dashed var(--app-border);
  }

  &__demo-label {
    color: var(--app-ink-3);
    font-size: 12px;
  }

  &__demo-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
  }

  &__demo-tip {
    margin-top: 10px;
    color: var(--app-ink-3);
    font-size: 12px;
  }

  @media (max-width: 900px) {
    &__brand {
      display: none;
    }
  }
}
</style>

