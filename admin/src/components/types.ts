export type TagType = 'primary' | 'success' | 'warning' | 'danger' | 'info';

/** 表格列声明：页面只描述数据，渲染细节交给 DataTable */
export interface TableColumn {
  /** 数据字段名，支持 a.b 形式 */
  prop?: string;
  label: string;
  width?: number | string;
  minWidth?: number | string;
  align?: 'left' | 'center' | 'right';
  fixed?: boolean | 'left' | 'right';
  sortable?: boolean | 'custom';
  /** 自定义单元格插槽名 */
  slot?: string;
  /** 自定义表头插槽名 */
  headerSlot?: string;
  showOverflowTooltip?: boolean;
}

