/** 拼接父子路由路径，供递归菜单使用 */
export function resolveMenuPath(basePath: string, path: string): string {
  if (path.startsWith('/')) {
    return path;
  }
  if (!path) {
    return basePath || '/';
  }
  return `${basePath}/${path}`.replace(/\/{2,}/g, '/');
}

