import { markRaw, type Component } from 'vue';
import {
  ChatLineSquare,
  DataAnalysis,
  DataBoard,
  Document,
  DocumentChecked,
  Folder,
  Menu as MenuIcon,
  Monitor,
  Operation,
  Picture,
  Promotion,
  Setting,
  Tickets,
  TrendCharts,
  User,
  UserFilled,
  VideoCamera,
  View,
} from '@element-plus/icons-vue';

/**
 * 后端 admin_routes.icon 存的是图标组件名（例如 DataBoard）。
 * 这里显式登记允许使用的图标，避免为了支持任意字符串而把整套图标库打进包里。
 * 新增路由图标时在这里补一行即可。
 */
const MENU_ICONS: Record<string, Component> = {
  DataBoard: markRaw(DataBoard),
  ChatLineSquare: markRaw(ChatLineSquare),
  DocumentChecked: markRaw(DocumentChecked),
  UserFilled: markRaw(UserFilled),
  User: markRaw(User),
  Promotion: markRaw(Promotion),
  TrendCharts: markRaw(TrendCharts),
  View: markRaw(View),
  Setting: markRaw(Setting),
  Monitor: markRaw(Monitor),
  Operation: markRaw(Operation),
  DataAnalysis: markRaw(DataAnalysis),
  Picture: markRaw(Picture),
  VideoCamera: markRaw(VideoCamera),
  Tickets: markRaw(Tickets),
  Document: markRaw(Document),
  Folder: markRaw(Folder),
};

const FALLBACK_ICON = markRaw(MenuIcon);

/** 图标名找不到时回退到通用图标，保证菜单结构不出错 */
export function resolveMenuIcon(name: string | null | undefined): Component {
  if (!name) {
    return FALLBACK_ICON;
  }
  return MENU_ICONS[name] ?? FALLBACK_ICON;
}

