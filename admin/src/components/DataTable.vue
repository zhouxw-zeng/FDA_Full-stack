<script setup lang="ts" generic="T extends object">
import type { TableColumn } from './types';

import EmptyState from './EmptyState.vue';

defineOptions({ name: 'DataTable' });

const props = withDefaults(
  defineProps<{
    data: T[];
    columns: TableColumn[];
    loading?: boolean;
    total?: number;
    page?: number;
    pageSize?: number;
    rowKey?: string;
    selectable?: boolean;
    showPagination?: boolean;
    emptyText?: string;
  }>(),
  {
    loading: false,
    total: 0,
    page: 1,
    pageSize: 10,
    rowKey: 'id',
    selectable: false,
    showPagination: true,
    emptyText: '暂无数据',
  },
);

const emit = defineEmits<{
  'update:page': [page: number];
  'update:pageSize': [pageSize: number];
  'selection-change': [rows: T[]];
  'sort-change': [payload: { prop: string; order: string | null }];
}>();

function columnAttrs(column: TableColumn) {
  return {
    prop: column.prop,
    label: column.label,
    width: column.width,
    minWidth: column.minWidth,
    align: column.align ?? 'left',
    fixed: column.fixed,
    sortable: column.sortable ?? false,
    showOverflowTooltip: column.showOverflowTooltip ?? true,
  };
}
</script>

<template>
  <section class="data-table">
    <el-table
      v-loading="props.loading"
      :data="props.data"
      :row-key="props.rowKey"
      border
      highlight-current-row
      @selection-change="emit('selection-change', $event as T[])"
      @sort-change="emit('sort-change', $event as { prop: string; order: string | null })"
    >
      <el-table-column
        v-if="props.selectable"
        type="selection"
        width="46"
        align="center"
        reserve-selection
      />
      <el-table-column
        v-for="column in props.columns"
        :key="column.prop ?? column.label"
        v-bind="columnAttrs(column)"
      >
        <template v-if="column.headerSlot" #header>
          <slot :name="column.headerSlot" />
        </template>
        <template v-if="column.slot" #default="scope">
          <!--
            el-table-column 会用 { row: {}, column: {}, $index: -1 } 探测式调用一次
            默认插槽来收集嵌套列。这里过滤掉该调用，否则业务插槽会拿到空行数据。
          -->
          <slot v-if="scope.$index >= 0" :name="column.slot" v-bind="scope" />
        </template>
      </el-table-column>

      <template #empty>
        <EmptyState :description="props.emptyText" />
      </template>
    </el-table>

    <footer v-if="props.showPagination" class="data-table__footer">
      <el-pagination
        background
        :current-page="props.page"
        :page-size="props.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="props.total"
        layout="total, sizes, prev, pager, next, jumper"
        @update:current-page="emit('update:page', $event)"
        @update:page-size="emit('update:pageSize', $event)"
      />
    </footer>
  </section>
</template>

<style scoped lang="scss">
.data-table {
  background-color: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-lg);
  overflow: hidden;

  &__footer {
    display: flex;
    justify-content: flex-end;
    padding: 12px 16px;
    border-top: 1px solid var(--app-border);
  }

  @media (max-width: 720px) {
    &__footer {
      justify-content: center;
    }
  }
}
</style>

