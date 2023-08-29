import office from './office.json';
export interface ILink {
  title: string;
  desc: string;
  url: string;
  logo?: string;
}

export interface IMenuItem {
  title: string;
  icon: string;
  subMenu: {
    title: string;
    links: ILink[];
  }[];
}

/** 菜单导航数据 */
export const menus: IMenuItem[] = [office];

/** 链接汇总，供查找 */
export const AllLinks = menus.reduce((acc, item) => {
  return [...acc, ...item.subMenu.map(it => it.links).flat(2)];
}, [] as ILink[]);
