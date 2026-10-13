import { ref, type Ref } from 'vue';

import type { PageQuery, PageResult } from '@/types';

interface UseTableOptions<T, Q extends PageQuery> {
  fetcher: (query: Q) => Promise<PageResult<T>>;
  /** 查询条件初始值，page / pageSize 由 hook 统一管理 */
  defaults: Omit<Q, 'page' | 'pageSize'>;
  pageSize?: number;
  immediate?: boolean;
}

/**
 * 列表页通用逻辑：查询、分页、loading、删除后回填上一页。
 * 各页面只关心 fetcher 与查询条件形状。
 */
export function useTable<T, Q extends PageQuery = PageQuery>(options: UseTableOptions<T, Q>) {
  const pageSize = options.pageSize ?? 10;
  const createQuery = () =>
    ({ ...options.defaults, page: 1, pageSize }) as unknown as Q;

  const list = ref([]) as Ref<T[]>;
  const total = ref(0);
  const loading = ref(false);
  const query = ref<Q>(createQuery());

  async function load(): Promise<void> {
    loading.value = true;
    try {
      const result = await options.fetcher(query.value);
      list.value = result.list;
      total.value = result.total;
    } finally {
      loading.value = false;
    }
  }

  async function search(): Promise<void> {
    query.value.page = 1;
    await load();
  }

  async function reset(): Promise<void> {
    query.value = createQuery();
    await load();
  }

  async function reload(): Promise<void> {
    await load();
  }

  /** 删除最后一条数据时自动回到上一页，避免停在空白页 */
  async function reloadAfterRemove(removedCount = 1): Promise<void> {
    const remaining = total.value - removedCount;
    const maxPage = Math.max(1, Math.ceil(remaining / (query.value.pageSize ?? pageSize)));
    if ((query.value.page ?? 1) > maxPage) {
      query.value.page = maxPage;
    }
    await load();
  }

  async function changePage(page: number): Promise<void> {
    query.value.page = page;
    await load();
  }

  async function changePageSize(size: number): Promise<void> {
    query.value.pageSize = size;
    query.value.page = 1;
    await load();
  }

  if (options.immediate !== false) {
    void load();
  }

  return {
    list,
    total,
    loading,
    query,
    load,
    search,
    reset,
    reload,
    reloadAfterRemove,
    changePage,
    changePageSize,
  };
}

