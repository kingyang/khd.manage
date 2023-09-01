<script lang="ts" setup>
import dayjs from 'dayjs';
import {
  UploadFile,
  UploadFiles,
  UploadRequestOptions,
  UploadUserFile,
} from 'element-plus';
import Split from 'split.js';

import { Order, OrderFile, UploadConfig } from '@/api/orders';
import UploadFilled from '~icons/ep/upload-filled';

const shops: Record<string, string> = {
  1: '晶',
  2: '康',
};
const shopArr = Object.entries(shops);

const sTypes: Record<string, string> = {
  a2e: '转Word',
  dt: '文档翻译',
};

const sTypeArr = Object.entries(sTypes);
const statuses: Record<string, string> = {
  '10': '待付费',
  '19': '待发货',
  '20': '用户提交',
  '30': '处理(自动待)',
  '31': '处理(自动中)',
  '32': '处理(异常)',
  '35': '处理(人工待)',
  '36': '处理(人工中)',
  '37': '处理(人工异常)',
  '38': '处理(待审核)',
  '40': '异常',
  '41': '异常(用户重新提交)',
  '42': '异常(费用不足)',
  '50': '处理完毕',
  '90': '关闭',
};

const statusArr: [number, string][] = Object.entries(statuses).map(i => [
  parseInt(i[0]),
  i[1],
]);
const refMain = ref<HTMLElement>();
const refLeft = ref<HTMLElement>();
const refContent = ref<HTMLElement>();

const state = reactive({
  data: [] as Order[],
  total: 0,
  dialogVisible: true,
  form: {} as Order,
  isNew: false,
  files: [] as OrderFile[],
  page: 1,
});

const form = ref<Partial<Order>>({
  sType: sTypeArr[0][0],
  status: statusArr[0][0],
  fileLimit: 1,
});

const filters = ref<Partial<Order> & { keyword?: string }>({});
const router = useRouter();
const { copy } = useClipboard();

watch(
  () => [filters.value, state.page],
  () => {
    loadOrders();
  },
  {
    deep: true,
  },
);

const loadOrders = async () => {
  const { total, data } = await getOrders({
    page: state.page,
    ...filters.value,
  });
  state.total = total;
  state.data = data;
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

const orderUrl = (order: Order) =>
  import.meta.env.MODE === 'development'
    ? `http://localhost:5174/#/${order.sType}/${order.id}`
    : `https://s.eed.cn/#/${order.sType}/${order.id}`;

/**
 * 用户链接
 * @param order
 */
const onOrderUserLink = async (order: Order) => {
  await copy(`${orderUrl(order)}
【使用方法】
【1】点击上面链接打开(或复制到PC或手机浏览器)
【2】根据页面提示进行操作
【3】有疑问随时旺旺沟通`);
  notify.success(
    `${sTypeFormatter(order)}(${order.id})用户链接已经复制到剪贴板中！`,
  );
};
/**
 *
 * @param order 发货
 */
const onOrderFahuo = async (order: Order) => {
  await updateOrder({ id: order.id, status: 20 });
  const item = state.data.find(o => o.id === order.id);
  if (item) {
    item.status = 20;
    item.serviceActiveTime = new Date();
  }
  await copy(`${orderUrl(order)}
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

const onOrderNew = () => {
  onRowClick({ status: 19, fileLimit: 1, createTime: new Date() });
};
const onRowClick = async (order?: Partial<Order>) => {
  state.dialogVisible = true;
  form.value = { ...order };
  if (order?.id) {
    state.isNew = false;
    state.files = await getOrderFiles(order.id);
  } else {
    state.isNew = true;
    state.files = [];
  }
};

const onSave = async () => {
  const { id } = await updateOrder(form.value);
  console.debug('Order', id);
  form.value.serviceActiveTime = new Date();
  if (state.isNew) {
    form.value.id = id;
    state.data = [{ ...(form.value as Order) }, ...state.data];
  } else {
    const idx = state.data.findIndex(i => i.id === id);
    if (idx >= 0) {
      state.data[idx] = { ...(form.value as Order) };
    }
    console.debug('onSave', idx);
  }
  state.isNew = false;
};

const userFiles = computed(
  () => state.files.filter(f => f.iType === 1) as OrderFile[],
);
const sysFiles = computed(
  () => state.files.filter(f => f.iType === 2) as OrderFile[],
);

const uerFileStatus: Record<string, string> = {
  0: '待确认',
  1: '正常(待处理)',
  2: '正常(处理中)',
  3: '正常(已处理)',
  4: '正常(仅展示)',
  5: '处理异常',
  9: '删除',
};

const uerFileStatusArr = Object.entries(uerFileStatus);
const sysFilesStatus: Record<string, string> = {
  3: '正常',
  8: '预览',
  9: '删除',
};
const sysFilesStatusArr = Object.entries(sysFilesStatus);

const onFileStatusChange = async (orderFile: OrderFile, status: any) => {
  const res = await updateOrderFile(orderFile.id, status);
  console.debug('onFileStatusChange', res);
  if (res) {
    orderFile.status = status;
  }
};

const fileSizeFormatter = (row: any) => {
  return fileSize(row.fileSize);
};
const fileNameFormatter = (row: any) => {
  return row.fileName + row.fileExt;
};
const uerFileStatusFormatter = (orderFile: OrderFile) => {
  return uerFileStatus[orderFile.status] || '未知';
};
const sysFileStatusFormatter = (orderFile: OrderFile) => {
  return sysFilesStatus[orderFile.status] || '未知';
};

const uploadFiles = ref<UploadUserFile[]>([]);
const sts = ref<UploadConfig>({} as UploadConfig);
const uploadData = computed(() => {
  const stsConfig = sts.value;
  return {
    OSSAccessKeyId: stsConfig.OSSAccessKeyId,
    policy: stsConfig.policy,
    Signature: stsConfig.Signature,
    callback: stsConfig.callback,
  };
});
// 定时清理
const { pause, resume } = useTimeoutPoll(() => {
  uploadFiles.value = uploadFiles.value.filter(
    f => f.status !== 'success' && f.status !== 'fail',
  );
  if (!uploadFiles.value.length) {
    pause();
  }
}, 2000);
const httpRequest = (options: UploadRequestOptions) => {
  const oid = form.value.id;
  if (!oid) {
    notify.error('上传失败,未知订单');
    throw new Error('上传失败,未知订单');
  }
  const key = `${sts.value.key}${oid}/out/${options.file.name}`;

  return ajaxUpload({
    ...options,
    data: { ...options.data, key, 'x:ext1': oid, 'x:ext2': '2' },
  });
};
const onUploadError = (
  error: Error,
  uploadFile: UploadFile,
  uploadFiles: UploadFiles,
) => {
  console.debug('onError', error, uploadFile, uploadFiles);
  notify.error(`${uploadFile.name} ${error.message}`);
};
const loadOrderDebounce = useDebounceFn(async () => {
  if (form.value.id) state.files = await getOrderFiles(form.value.id);
}, 2000);

/**
 * 上传成功.
 * @param response
 * @param uploadFile
 * @param uploadFiles
 */
const onUploadSuccess = (
  response: any,
  uploadFile: UploadFile,
  uploadFiles: UploadFiles,
) => {
  if (!response || !isObject(response)) {
    response = {};
  }
  response.time = new Date().getTime();
  uploadFile.response = response;
  console.debug('onUploadSuccess', response, uploadFile, uploadFiles);
  resume();
  loadOrderDebounce();
};
const onBeforeUpload = async () => {
  if (isEmpty(sts.value) || sts.value.expire - 1000 * 20 < Date.now()) {
    sts.value = await getSts();
  }
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
  <div ref="refMain" class="w-full h-full orders">
    <div ref="refLeft">
      <div class="flex flex-col h-full">
        <div class="p-5">
          <el-button type="primary" size="small" @click.prevent="onOrderNew">
            新建订单
          </el-button>

          <span class="ml-10px"> 店铺: </span>
          <el-select v-model="filters.shop_id" class="w-100px" clearable>
            <el-option
              v-for="(item, i) in shopArr"
              :key="i"
              :label="item[1]"
              :value="item[0]"
            />
          </el-select>
          <span class="ml-10px"> 业务: </span>
          <el-select v-model="filters.sType" class="w-100px" clearable>
            <el-option
              v-for="(item, i) in sTypeArr"
              :key="i"
              :label="item[1]"
              :value="item[0]"
            />
          </el-select>
          <span class="ml-5px"> 状态: </span>
          <el-select v-model="filters.status" class="w-100px" clearable>
            <el-option
              v-for="(item, i) in statusArr"
              :key="i"
              :label="item[1]"
              :value="item[0]"
            />
          </el-select>
          <span class="ml-5px"> 订单: </span>
          <el-input
            v-model="filters.keyword"
            placeholder="订单信息"
            class="w-200px"
            clearable
          />
        </div>
        <div class="flex-auto overflow-y-auto">
          <el-table
            :data="state.data"
            stripe
            highlight-current-row
            style="width: 100%"
            @row-click="onRowClick"
          >
            <el-table-column fixed="left" width="120">
              <template #default="scope">
                <a :href="`${orderUrl(scope.row)}?from=admin`" target="_blank">
                  打开
                </a>
                <el-button
                  v-if="scope.row.status === 19"
                  link
                  type="primary"
                  size="small"
                  @click.prevent="onOrderFahuo(scope.row)"
                >
                  <span class="c-green">发货</span>
                </el-button>
                <el-button
                  v-else
                  link
                  type="primary"
                  size="small"
                  @click.prevent="onOrderUserLink(scope.row)"
                >
                  <span>链接</span>
                </el-button>
              </template>
            </el-table-column>
            <el-table-column
              prop="status"
              label="状态"
              width="160"
              :formatter="statusFormatter"
            />
            <el-table-column prop="id" label="编号" width="140" />
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
            <el-table-column prop="fileLimit" label="文件数量" width="100" />
            <el-table-column prop="serviceMark" label="备注" width="200" />
            <el-table-column prop="serviceMsg" label="消息" width="200" />
            <el-table-column label="订单信息" width="200" />
            <!-- <el-table-column prop="userOptions" label="用户选项" /> -->
          </el-table>
        </div>
        <el-pagination
          v-model:current-page="state.page"
          layout="prev, pager, next"
          :total="state.total"
          :page-size="50"
        />
      </div>
    </div>
    <div ref="refContent">
      <div class="flex h-full">
        <div class="p-5 c-gray cursor-pointer">
          <el-button type="primary" @click="onSave"> 保存 </el-button>
          <div class="mt-10px" @click="scrollToId('base')">基本信息</div>
          <div class="mt-10px" @click="scrollToId('userfiles')">用户文件</div>
          <div class="mt-10px" @click="scrollToId('sysfiles')">系统文件</div>
          <div class="mt-10px" @click="scrollToId('logs')">处理日志</div>
        </div>
        <div class="flex-auto overflow-y-auto">
          <div>
            <div class="mt-5">
              编号:<span class="ml-5">{{ form.id }}</span>
            </div>
            <el-divider id="base" content-position="left">基本信息</el-divider>

            <el-form :model="form" label-width="120px">
              <el-form-item label="服务类型">
                <el-select v-model="form.sType">
                  <el-option
                    v-for="(item, i) in sTypeArr"
                    :key="i"
                    :label="item[1]"
                    :value="item[0]"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="状态">
                <el-select v-model="form.status">
                  <el-option
                    v-for="(item, i) in statusArr"
                    :key="i"
                    :label="item[1]"
                    :value="item[0]"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="店铺">
                <el-select v-model="form.shop_id" clearable>
                  <el-option
                    v-for="(item, i) in shopArr"
                    :key="i"
                    :label="item[1]"
                    :value="item[0]"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="下单时间">
                <el-date-picker v-model="form.shop_orderTime" type="datetime" />
              </el-form-item>
              <el-form-item label="订单编号">
                <el-input v-model="form.shop_orderid" />
              </el-form-item>
              <el-form-item label="用户">
                <el-input v-model="form.shop_username" />
              </el-form-item>
              <el-form-item label="支付">
                <el-input-number
                  v-model="form.shop_pay"
                  :precision="2"
                  :step="0.1"
                  :max="500"
                />
              </el-form-item>
              <el-form-item label="订单扩展">
                <el-input v-model="form.shop_extdata" type="textarea" />
              </el-form-item>

              <el-form-item label="备注(后台可见)">
                <el-input v-model="form.serviceMark" type="textarea" />
              </el-form-item>
              <el-form-item label="消息(用户可见)">
                <el-input v-model="form.serviceMsg" type="textarea" />
              </el-form-item>
              <el-form-item label="用户选项">
                <el-input v-model="form.userOptions" type="textarea" />
              </el-form-item>
              <el-form-item label="文件数量">
                <el-input-number
                  v-model="form.fileLimit"
                  :step="1"
                  :max="500"
                />
              </el-form-item>

              <el-form-item>
                <el-button type="primary" class="w-200px" @click="onSave">
                  保存
                </el-button>
              </el-form-item>
            </el-form>
            <el-divider id="userfiles" content-position="left">
              用户文件
            </el-divider>
            <el-table
              :data="userFiles"
              stripe
              style="width: 100%"
              max-height="250"
            >
              <el-table-column label="状态" width="140">
                <template #default="scope">
                  <el-popover placement="right" :width="400" trigger="click">
                    <template #reference>
                      <el-button link>
                        {{ uerFileStatusFormatter(scope.row) }}
                      </el-button>
                    </template>

                    <el-radio-group
                      :model-value="`${scope.row.status}`"
                      size="large"
                      @change="onFileStatusChange(scope.row, $event)"
                    >
                      <el-radio
                        v-for="(item, i) in uerFileStatusArr"
                        :key="i"
                        :label="item[0]"
                      >
                        {{ item[1] }}
                      </el-radio>
                    </el-radio-group>
                  </el-popover>
                </template>
              </el-table-column>
              <el-table-column
                prop="fileName"
                label="文件"
                :formatter="fileNameFormatter"
              >
              </el-table-column>
              <el-table-column prop="fileExt" label="后缀" width="180" />
              <el-table-column
                v-if="!isSmallScreen"
                prop="fileSize"
                label="大小"
                width="100"
                :formatter="fileSizeFormatter"
              />
              <el-table-column prop="pages" label="页数" width="100" />
              <el-table-column
                prop="createTime"
                label="时间"
                width="100"
                :formatter="timeFormatter"
              />

              <template #empty> 暂无文件 </template>
            </el-table>
            <el-divider id="sysfiles" content-position="left">
              系统文件
            </el-divider>
            <el-table
              :data="sysFiles"
              stripe
              style="width: 100%"
              max-height="250"
            >
              <el-table-column label="状态" width="100">
                <template #default="scope">
                  <el-popover placement="right" :width="400" trigger="click">
                    <template #reference>
                      <el-button link>
                        {{ sysFileStatusFormatter(scope.row) }}
                      </el-button>
                    </template>
                    <el-radio-group
                      :model-value="`${scope.row.status}`"
                      size="large"
                      @change="onFileStatusChange(scope.row, $event)"
                    >
                      <el-radio
                        v-for="(item, i) in sysFilesStatusArr"
                        :key="i"
                        :label="item[0]"
                      >
                        {{ item[1] }}
                      </el-radio>
                    </el-radio-group>
                  </el-popover>
                </template>
              </el-table-column>

              <el-table-column
                prop="fileName"
                label="文件"
                :formatter="fileNameFormatter"
              >
              </el-table-column>
              <el-table-column
                v-if="!isSmallScreen"
                prop="fileSize"
                label="大小"
                width="100"
                :formatter="fileSizeFormatter"
              />
              <template #empty> 暂无文件 </template>
            </el-table>

            <el-upload
              v-if="!state.isNew"
              v-model:file-list="uploadFiles"
              :action="sts.url"
              :data="uploadData"
              :http-request="httpRequest"
              :on-error="onUploadError"
              :on-success="onUploadSuccess"
              :before-upload="onBeforeUpload"
              drag
              multiple
            >
              <el-icon class="el-icon--upload">
                <upload-filled />
              </el-icon>
              <div class="el-upload__text">
                拖拽文件到此处 或 <em>点击选择文件</em>
              </div>
            </el-upload>
            <el-divider id="logs" content-position="left">
              处理日志
            </el-divider>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.orders {
  font-size: 14px;
  :deep(.el-divider__text) {
    color: gray;
    font-weight: bold;
  }
  :deep(.el-divider) {
    margin-top: 60px;
  }
}
</style>
