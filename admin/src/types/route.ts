/** 后端 admin_routes 表返回的路由节点（/routes/tree） */
export interface RouteTreeItem {
  routeId: number;
  routeName: string;
  /** Element Plus 图标组件名，例如 DataBoard */
  icon: string | null;
  /** 绝对路径，例如 /forum/approval */
  routePath: string;
  /** 组件文件路径，例如 @/views/forum/approval/index.vue；目录节点为 @/layout/index.vue */
  componentPath: string | null;
  /** 父路由 ID，顶层为 null */
  pid: number | null;
  /** 0 启用，1 禁用 */
  status: number;
  /** 0 目录，1 菜单 */
  routeType: number;
  children: RouteTreeItem[];
}

