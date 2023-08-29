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
export const getSts = (oid: string) => get<UploadConfig>('common/sts', { oid });

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
  shop_extdata: string;
  shop_pay: string;
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

const prepareOrder = (order: Order) => {
  if (!order) {
    return order;
  }
  if (order.userOptions) {
    order.userOptions = JSON.parse(order.userOptions);
  }
  return order;
};

/**
 * 获取订单信息
 * @param id
 * @returns
 */
export const getOrder = (id: string, sType: string) =>
  get<Order>('common/order', { id, sType }).then(prepareOrder);

/**
 * 确认提交
 * @param id
 * @param sType
 * @param userOptions
 * @returns
 */
export const startOrder = (id: string, sType: string, userOptions: any) =>
  put<Order>('common/order', {
    id,
    sType,
    userOptions: JSON.stringify(userOptions),
  }).then(prepareOrder);

/**
 *  删除文件
 * @param id
 * @param sType
 * @param fid
 * @returns
 */
export const delOrder = (id: string, sType: string, fid: string) =>
  del<Order>('common/order', { id, sType, fid }).then(prepareOrder);
