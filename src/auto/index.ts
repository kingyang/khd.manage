export { useRouteParams } from '@vueuse/router';

/**
 * 文件大小 字节转换单位
 * @param size
 * @returns {string|*}
 */
export const fileSize = (size: number) => {
  if (!size) return '';
  if (size < pow1024(1)) return size + ' B';
  if (size < pow1024(2)) return (size / pow1024(1)).toFixed(2) + ' KB';
  if (size < pow1024(3)) return (size / pow1024(2)).toFixed(2) + ' MB';
  if (size < pow1024(4)) return (size / pow1024(3)).toFixed(2) + ' GB';
  return (size / pow1024(4)).toFixed(2) + ' TB';
};

// 求次幂
function pow1024(num: number) {
  return Math.pow(1024, num);
}

// 定义一个函数，接受一个id参数
export function scrollToId(id: string) {
  // 获取元素
  const element = document.getElementById(id);
  // 判断元素是否存在
  if (element) {
    // 调用scrollIntoView方法，传入一个选项对象
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    // 打印错误信息
    console.error('Element not found');
  }
}

export const object2array = (obj: any) => {
  const arr: any[] = [];
  for (const key in obj) {
    arr.push([key, obj[key]]);
  }
  return arr;
};

export const array2object = (arr: any) => {
  const obj: Record<any, any> = {};
  for (const item of arr) {
    const [key, val] = item;
    obj[key] = val;
  }
  return obj;
};
