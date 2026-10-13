<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';

defineOptions({ name: 'AuditDialog' });

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    action: 'approve' | 'reject';
    subject?: string;
    loading?: boolean;
  }>(),
  {
    subject: '',
    loading: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [visible: boolean];
  submit: [remark: string];
}>();

const remark = ref('');
const presetReasons = ['内容与分类不符', '包含违规信息', '封面与内容不一致', '资料不完整'];

const title = computed(() => (props.action === 'approve' ? '通过审批' : '驳回申请'));
const isReject = computed(() => props.action === 'reject');

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      remark.value = '';
    }
  },
);

function handleSubmit(): void {
  if (isReject.value && remark.value.trim().length < 4) {
    ElMessage.warning('请填写不少于 4 个字的驳回原因');
    return;
  }
  emit('submit', remark.value.trim());
}
</script>

<template>
  <el-dialog
    :model-value="props.modelValue"
    :title="title"
    width="520px"
    append-to-body
    @update:model-value="emit('update:modelValue', $event)"
  >
    <p class="audit-dialog__subject">
      <span class="audit-dialog__label">审批对象</span>
      {{ props.subject || '-' }}
    </p>

    <div v-if="isReject" class="audit-dialog__reasons">
      <el-tag
        v-for="reason in presetReasons"
        :key="reason"
        class="audit-dialog__reason"
        type="info"
        effect="plain"
        @click="remark = reason"
      >
        {{ reason }}
      </el-tag>
    </div>

    <el-input
      v-model="remark"
      type="textarea"
      :rows="3"
      maxlength="120"
      show-word-limit
      :placeholder="isReject ? '填写驳回原因，将同步通知提交人' : '可填写通过备注（选填）'"
    />

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button
        :type="isReject ? 'danger' : 'primary'"
        :loading="props.loading"
        @click="handleSubmit"
      >
        确认{{ isReject ? '驳回' : '通过' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.audit-dialog {
  &__subject {
    padding: 10px 12px;
    margin-bottom: 12px;
    color: var(--app-ink);
    background-color: var(--app-surface-2);
    border-radius: var(--app-radius);
  }

  &__label {
    margin-right: 8px;
    color: var(--app-ink-3);
  }

  &__reasons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }

  &__reason {
    cursor: pointer;
  }
}
</style>

