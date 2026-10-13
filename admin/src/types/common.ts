/** 后端统一响应结构 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/** 分页请求参数 */
export interface PageQuery {
  page?: number;
  /** 每页条数，后端参数名为 size */
  size?: number;
  keyword?: string;
}

/** 分页响应结构 */
export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  /** 后端为兼容旧前端同时返回 pageSize */
  pageSize?: number;
}

/** 通用下拉选项 */
export interface SelectOption<T = string> {
  label: string;
  value: T;
}

/** 排序方向 */
export type SortOrder = 'ascending' | 'descending';

