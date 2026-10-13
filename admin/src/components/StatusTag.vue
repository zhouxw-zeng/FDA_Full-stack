<script setup lang="ts">
import { computed } from 'vue';

import {
  AD_STATUS_LABELS,
  AD_STATUS_TAG,
  AUDIT_STATUS_LABELS,
  AUDIT_STATUS_TAG,
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_STATUS_TAG,
} from '@/constants';

import type { TagType } from './types';

defineOptions({ name: 'StatusTag' });

const props = defineProps<{
  kind: 'audit' | 'customer' | 'ad';
  value: string;
}>();

const maps = {
  audit: { labels: AUDIT_STATUS_LABELS, tags: AUDIT_STATUS_TAG },
  customer: { labels: CUSTOMER_STATUS_LABELS, tags: CUSTOMER_STATUS_TAG },
  ad: { labels: AD_STATUS_LABELS, tags: AD_STATUS_TAG },
} as const;

const label = computed(
  () => (maps[props.kind].labels as Record<string, string>)[props.value] ?? props.value,
);

const type = computed<TagType>(
  () => ((maps[props.kind].tags as Record<string, TagType>)[props.value] ?? 'info') as TagType,
);
</script>

<template>
  <el-tag :type="type" size="small" effect="light" disable-transitions>{{ label }}</el-tag>
</template>

