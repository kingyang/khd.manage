import { Order } from './common';

/**
 * 获取订单
 * @param args
 * @returns
 */
export const getOrders = (args?: any) =>
  get<{ total: number; data: any[] }>('orders', args);

/**
 *更新订单
 * @param args
 * @returns
 */
export const updateOrder = (args: Partial<Order> & { id: string }) =>
  post('orders/update', args);
