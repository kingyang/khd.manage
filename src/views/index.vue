<script lang="ts" setup>
import dayjs from 'dayjs';
import Split from 'split.js';

import { Order } from '@/api/common';

const refMain = ref<HTMLElement>();
const refLeft = ref<HTMLElement>();
const refContent = ref<HTMLElement>();

const state = reactive({
  data: [] as Order[],
  total: 0,
});
const router = useRouter();
const { copy } = useClipboard();

const loadOrders = async () => {
  const { total, data } = await getOrders();
  state.total = total;
  state.data = data;
};

const sTypes: Record<string, string> = {
  dt: '文档翻译',
  a2e: '转Word',
};

const statuses: Record<string, string> = {
  '10': '待付费',
  '19': '待发货',
  '20': '用户提交',
  '30': '处理中',
  '35': '处理(待审核)',
  '40': '异常',
  '41': '异常(用户重新提交)',
  '42': '异常(费用不足)',
  '50': '处理完毕',
  '90': '关闭',
};
const sTypeFormatter = (order: Order) => {
  return `【${order.sType}】${sTypes[order.sType]}`;
};
const statusFormatter = (order: Order) => {
  return statuses[order.status];
};
const timeFormatter = (_order: Order, _column: any, cellValue: Date) => {
  if (!cellValue) {
    return '';
  }
  return dayjs().to(cellValue) as string;
};

/**
 *
 * @param order 发货
 */
const onStatusFahuo = async (order: Order) => {
  await updateOrder({ id: order.id, status: 20 });
  const item = state.data.find(o => o.id === order.id);
  if (item) {
    item.status = 20;
    item.serviceActiveTime = new Date();
  }
  await copy(`https://s.eed.cn/#/${order.sType}/${order.id}
【使用方法】
【1】点击上面链接打开(或复制到PC或手机浏览器)
【2】根据页面提示进行操作
【3】有疑问随时旺旺沟通`);
  notify.success(
    `${sTypeFormatter(order)}(${
      order.id
    })发货成功。发货信息已经复制到剪贴板中！`,
  );
};

onMounted(() => {
  if (!sessionStorage.getItem('token')) {
    router.push('/login');
    return;
  }
  if (refLeft.value && refContent.value) {
    Split([refLeft.value as HTMLElement, refContent.value as HTMLElement], {
      sizes: [40, 60],
      gutterSize: 5,
      direction: 'vertical',
    });
  }
  loadOrders();
});
</script>

<template>
  <div ref="refMain" class="w-full h-full">
    <div ref="refLeft">
      <el-table :data="state.data" style="width: 100%">
        <el-table-column fixed="left" width="160">
          <template #default="scope">
            <el-button
              link
              type="default"
              size="small"
              @click.prevent="onStatusFahuo(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              link
              type="primary"
              size="small"
              @click.prevent="onStatusFahuo(scope.row)"
            >
              发货
            </el-button>
          </template>
        </el-table-column>
        <el-table-column
          prop="status"
          label="状态"
          width="100"
          :formatter="statusFormatter"
        />
        <el-table-column prop="id" label="编号" width="100" />
        <el-table-column
          prop="sType"
          label="业务"
          width="140"
          :formatter="sTypeFormatter"
        />
        <el-table-column
          prop="serviceActiveTime"
          label="服务时间"
          width="100"
          :formatter="timeFormatter"
        />

        <el-table-column
          prop="userActiveTime"
          label="用户活动"
          width="100"
          :formatter="timeFormatter"
        />
        <el-table-column
          prop="createTime"
          label="创建时间"
          width="100"
          :formatter="timeFormatter"
        />
        <el-table-column label="订单信息" width="200" />
        <el-table-column prop="userOptions" label="用户选项" />
      </el-table>
    </div>
    <div ref="refContent"></div>
  </div>
</template>
<style></style>
