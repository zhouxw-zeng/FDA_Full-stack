import { ElMessageBox } from 'element-plus';

interface ConfirmOptions {
  title?: string;
  type?: 'warning' | 'info' | 'error';
  confirmText?: string;
  cancelText?: string;
  /** 危险操作：确认按钮使用红色 */
  danger?: boolean;
}

/** 统一的二次确认，避免各页面自己拼 ElMessageBox 参数 */
export function useConfirm() {
  async function confirm(message: string, options: ConfirmOptions = {}): Promise<boolean> {
    try {
      await ElMessageBox.confirm(message, options.title ?? '操作确认', {
        type: options.type ?? 'warning',
        confirmButtonText: options.confirmText ?? '确定',
        cancelButtonText: options.cancelText ?? '取消',
        confirmButtonClass: options.danger ? 'el-button--danger' : undefined,
        draggable: true,
      });
      return true;
    } catch {
      return false;
    }
  }

  return { confirm };
}

