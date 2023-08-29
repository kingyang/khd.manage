import 'element-plus/es/components/notification/style/css';

// @ts-ignore
import { ElNotification, NotificationOptions } from 'element-plus';

const create =
  (type: '' | 'success' | 'warning' | 'error' | 'info') =>
  (message: string, option?: NotificationOptions) => {
    ElNotification({
      customClass: 'global-notify',
      type,
      message,
      duration: 5000,
      showClose: true,
      ...option,
    });
  };
/**
 * 通知消息
 */
export const notify = {
  open: create(''),
  success: create('success'),
  warning: create('warning'),
  error: create('error'),
  info: create('info'),
};
