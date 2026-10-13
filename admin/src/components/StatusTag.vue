<script setup lang="ts">
import { computed } from 'vue';

import {
  AD_STATUS_LABELS,
  AD_STATUS_TAG,
  AUDIT_STATUS_LABELS,
  AUDIT_STATUS_TAG,
  CUSTOMER_ENABLED_LABELS,
  CUSTOMER_ENABLED_TAG,
  FORUM_ENABLED_LABELS,
  FORUM_ENABLED_TAG,
  MODEL_STATUS_LABELS,
  MODEL_STATUS_TAG,
} from '@/constants';

import type { TagType } from './types';

defineOptions({ name: 'StatusTag' });

const props = defineProps<{
  kind: 'audit' | 'forumEnabled' | 'customerEnabled' | 'ad' | 'modelStatus';
  value: string | number;
}>();

const maps = {
  audit: { labels: AUDIT_STATUS_LABELS, tags: AUDIT_STATUS_TAG },
  forumEnabled: { labels: FORUM_ENABLED_LABELS, tags: FORUM_ENABLED_TAG },
  customerEnabled: { labels: CUSTOMER_ENABLED_LABELS, tags: CUSTOMER_ENABLED_TAG },
  ad: { labels: AD_STATUS_LABELS, tags: AD_STATUS_TAG },
  modelStatus: { labels: MODEL_STATUS_LABELS, tags: MODEL_STATUS_TAG },
} as const;

const key = computed(() => String(props.value));

const label = computed(
  () => (maps[props.kind].labels as Record<string, string>)[key.value] ?? String(props.value),
);

const type = computed<TagType>(
  () => ((maps[props.kind].tags as Record<string, TagType>)[key.value] ?? 'info') as TagType,
);
</script>

<template>
  <el-tag :type="type" size="small" effect="light" disable-transitions>{{ label }}</el-tag>
</template>

