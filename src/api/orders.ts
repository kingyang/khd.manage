/**
 * 订单信息
 */
export type Order = {
  id: string;
  sType: string;
  shop_id: string;
  shop_orderTime: Date;
  shop_orderid: string;
  shop_username: string;
  shop_phone: string;
  shop_extdata: string;
  shop_pay: number;
  serviceMark: string;
  serviceMsg: string;
  serviceActiveTime: Date;
  fileLimit: number;
  userOptions: any;
  userActiveTime: Date;
  createTime: Date;
  status: number;
};

export type OrderFile = {
  id: string;
  iType: number;
  fileName: string;
  fileSize: number;
  fileExt: string;
  pages: number;
  msg: string;
  createTime: Date;
  status: number;
};

/**
 * 获取订单
 * @param args
 * @returns
 */
export const getOrders = (args?: any) =>
  get<{ total: number; data: any[] }>('orders', args);

/**
 * 获取订单
 * @param args
 * @returns
 */
export const getOrderFiles = (id: string) =>
  get<OrderFile[]>('orders/files', { id });

/**
 *更新订单
 * @param args
 * @returns
 */
export const updateOrder = (args: Partial<Order>) =>
  post<{ id: string }>('orders/update', args);

export type UploadConfig = {
  /**
   * 上传的地址
   */
  url: string;
  expire: number;
  OSSAccessKeyId: string;
  policy: string;
  Signature: string;
  callback: string;
  key: string;
};

/**
 * 获取上传sts信息
 * @returns
 */
export const getSts = () => get<UploadConfig>('orders/sts');
