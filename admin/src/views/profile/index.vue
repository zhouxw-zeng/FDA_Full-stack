<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { Key, OfficeBuilding, Phone, Postcard, User } from '@element-plus/icons-vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';

import { PageHeader, UserAvatar } from '@/components';
import { ROLE_LABELS } from '@/constants';
import { useUserStore } from '@/stores/user';
import type { ChangePasswordPayload, UpdateProfilePayload } from '@/types';
import { formatDateTime } from '@/utils/format';

defineOptions({ name: 'Profile' });

const userStore = useUserStore();

const profile = computed(() => userStore.profile);

const profileForm = reactive<UpdateProfilePayload>({
  nickname: profile.value?.nickname ?? '',
  email: profile.value?.email ?? '',
  phone: profile.value?.phone ?? '',
  department: profile.value?.department ?? '',
  bio: profile.value?.bio ?? '',
});

const passwordForm = reactive<ChangePasswordPayload & { confirmPassword: string }>({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const profileRef = ref<FormInstance>();
const passwordRef = ref<FormInstance>();
const savingProfile = ref(false);
const savingPassword = ref(false);

const profileRules: FormRules<UpdateProfilePayload> = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { max: 20, message: '昵称不超过 20 个字符', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
};

const passwordRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '新密码至少 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'));
          return;
        }
        callback();
      },
      trigger: 'blur',
    },
  ],
};

async function saveProfile(): Promise<void> {
  if (!profileRef.value) {
    return;
  }
  const valid = await profileRef.value.validate().catch(() => false);
  if (!valid) {
    return;
  }
  savingProfile.value = true;
  try {
    await userStore.saveProfile({ ...profileForm });
    ElMessage.success('个人信息已更新');
  } finally {
    savingProfile.value = false;
  }
}

async function savePassword(): Promise<void> {
  if (!passwordRef.value) {
    return;
  }
  const valid = await passwordRef.value.validate().catch(() => false);
  if (!valid) {
    return;
  }
  savingPassword.value = true;
  try {
    await userStore.changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    });
    ElMessage.success('密码已更新，下次登录请使用新密码');
    passwordForm.oldPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
    passwordRef.value.resetFields();
  } finally {
    savingPassword.value = false;
  }
}
</script>

<template>
  <div class="profile">
    <PageHeader title="个人信息" description="维护账号资料与登录密码" />

    <div class="profile__layout">
      <aside class="profile__summary">
        <UserAvatar :nickname="profile?.nickname ?? '?'" :src="profile?.avatar" :size="72" />
        <h3>{{ profile?.nickname }}</h3>
        <p class="profile__account">@{{ profile?.username }}</p>

        <div class="profile__roles">
          <el-tag v-for="role in userStore.roles" :key="role" size="small" effect="plain">
            {{ ROLE_LABELS[role] }}
          </el-tag>
        </div>

        <dl class="profile__facts">
          <div>
            <dt><el-icon><OfficeBuilding /></el-icon>所属部门</dt>
            <dd>{{ profile?.department || '-' }}</dd>
          </div>
          <div>
            <dt><el-icon><User /></el-icon>账号编号</dt>
            <dd>{{ profile?.id || '-' }}</dd>
          </div>
          <div>
            <dt><el-icon><Postcard /></el-icon>最近登录</dt>
            <dd>{{ formatDateTime(profile?.lastLoginAt) }}</dd>
          </div>
        </dl>
      </aside>

      <div class="profile__forms">
        <section class="profile__card">
          <header class="profile__card-head">
            <h3>基本资料</h3>
            <span>昵称与联系方式会同步展示在操作日志中</span>
          </header>

          <el-form
            ref="profileRef"
            :model="profileForm"
            :rules="profileRules"
            label-width="88px"
            style="max-width: 520px"
          >
            <el-form-item label="昵称" prop="nickname">
              <el-input v-model="profileForm.nickname" maxlength="20" />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="profileForm.email" :prefix-icon="Postcard" />
            </el-form-item>
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="profileForm.phone" :prefix-icon="Phone" maxlength="11" />
            </el-form-item>
            <el-form-item label="所属部门" prop="department">
              <el-input v-model="profileForm.department" :prefix-icon="OfficeBuilding" />
            </el-form-item>
            <el-form-item label="个人简介" prop="bio">
              <el-input
                v-model="profileForm.bio"
                type="textarea"
                :rows="3"
                maxlength="80"
                show-word-limit
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="savingProfile" @click="saveProfile">
                保存资料
              </el-button>
            </el-form-item>
          </el-form>
        </section>

        <section class="profile__card">
          <header class="profile__card-head">
            <h3>登录密码</h3>
            <span>修改后需要使用新密码重新登录</span>
          </header>

          <el-form
            ref="passwordRef"
            :model="passwordForm"
            :rules="passwordRules"
            label-width="88px"
            style="max-width: 520px"
          >
            <el-form-item label="当前密码" prop="oldPassword">
              <el-input
                v-model="passwordForm.oldPassword"
                type="password"
                show-password
                :prefix-icon="Key"
              />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="passwordForm.newPassword"
                type="password"
                show-password
                :prefix-icon="Key"
              />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="passwordForm.confirmPassword"
                type="password"
                show-password
                :prefix-icon="Key"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="savingPassword" @click="savePassword">
                更新密码
              </el-button>
            </el-form-item>
          </el-form>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.profile {
  &__layout {
    display: grid;
    grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);
    gap: 16px;
    align-items: start;

    @media (max-width: 1080px) {
      grid-template-columns: 1fr;
    }
  }

  &__summary {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    padding: 24px 16px;
    text-align: center;
    background-color: var(--app-surface);
    border: 1px solid var(--app-border);
    border-radius: var(--app-radius-lg);

    h3 {
      color: var(--app-ink);
      font-size: 16px;
      font-weight: 600;
    }
  }

  &__account {
    color: var(--app-ink-3);
    font-size: 12px;
  }

  &__roles {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
    margin-top: 4px;
  }

  &__facts {
    width: 100%;
    padding-top: 16px;
    margin-top: 12px;
    text-align: left;
    border-top: 1px solid var(--app-border);

    div {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 0;
    }

    dt {
      display: inline-flex;
      gap: 6px;
      align-items: center;
      color: var(--app-ink-3);
      font-size: 12px;
    }

    dd {
      margin: 0;
      color: var(--app-ink-2);
      font-size: 12px;
      font-variant-numeric: tabular-nums;
    }
  }

  &__forms {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__card {
    padding: 20px;
    background-color: var(--app-surface);
    border: 1px solid var(--app-border);
    border-radius: var(--app-radius-lg);
  }

  &__card-head {
    margin-bottom: 16px;

    h3 {
      color: var(--app-ink);
      font-size: 15px;
      font-weight: 600;
    }

    span {
      color: var(--app-ink-3);
      font-size: 12px;
    }
  }
}
</style>
