<script lang="ts" setup>
import 'element-plus/es/components/message-box/style/css';

import {
  UploadFile,
  UploadFiles,
  UploadRawFile,
  UploadRequestOptions,
  UploadUserFile,
} from 'element-plus';
import { ElMessageBox } from 'element-plus';
import { FunctionalComponent, SVGAttributes } from 'vue';

import { Order, UploadConfig } from '@/api/common';
import EpCircleCheckFilled from '~icons/ep/circle-check-filled';
import EpCircleCloseFilled from '~icons/ep/circle-close-filled';
import EpDataAnalysis from '~icons/ep/data-analysis';
import Edit from '~icons/ep/edit';
import UploadFilled from '~icons/ep/upload-filled';

const props = defineProps<{
  title: string;
  /**
   * 服务类型
   */
  sType: string;
  /**
   * 用户选项
   */
  userOptions: Record<string, any>;
  /**
   * 文件上传格式化
   */
  accept: string;

  /**
   * 文件最大(M)
   */
  fileMaxSize: number;
  /**
   * 是否能编辑
   */
  // canEdit: boolean;
}>();

const emit = defineEmits(['orderLoaded']);

// const canEdit = computed(() => props.canEdit);
const canEdit = computed(() => [20, 41].includes(state.order.status));
const accepts = computed(() =>
  props.accept.split(',').map(i => i.trim().toLowerCase()),
);
const state = reactive({
  /**
   * 临时上传文件
   */
  uploadFiles: [] as UploadUserFile[],
  /**
   * 上传凭证
   */
  sts: {} as UploadConfig,
  /**
   * 当前订单信息
   */
  order: {} as Order,
  /**
   * 是否出错
   */
  isErr: false,

  /**
   * 加载中状态
   */
  loading: false,
});

const isSmallScreen = useMediaQuery('(max-width: 640px)');
const uploadData = computed(() => {
  const stsConfig = state.sts;
  return {
    OSSAccessKeyId: stsConfig.OSSAccessKeyId,
    policy: stsConfig.policy,
    Signature: stsConfig.Signature,
    callback: stsConfig.callback,
  };
});

type Status = 'success' | 'error' | 'wait' | 'finish' | 'process';
const allSteps: {
  title: string;
  prefix: string;
  shows?: number[];
  status?: Status;
  icon: FunctionalComponent<SVGAttributes, any, any>;
}[] = [
  {
    title: '提交资料',
    icon: Edit,
    prefix: '2',
  },
  {
    title: '正在处理',
    icon: EpDataAnalysis,
    prefix: '3',
  },
  {
    title: '处理异常',
    icon: EpCircleCloseFilled,
    status: 'error',
    prefix: '4',
    shows: '40,41,42,43'.split(',').map(n => Number(n)),
  },
  {
    title: '处理结束',
    icon: EpCircleCheckFilled,
    prefix: '5',
  },
];
const statusSteps = computed(() => {
  const statusNum = state.order.status;
  const statusStr = statusNum + '';
  const ss = allSteps.filter(s => !s.shows || s.shows.includes(statusNum));
  const idx = ss.findIndex(s => statusStr.startsWith(s.prefix));
  console.debug('steps', idx, ss.length);
  return {
    steps: ss.map((item, n) => {
      let status: Status = 'wait';
      if (n < idx) {
        status = 'finish';
      } else if (n === idx) {
        status = 'process';
      } else {
        status = 'wait';
      }
      if (idx === n && idx === ss.length - 1) {
        status = 'success';
      }
      return {
        status,
        ...item,
      };
    }),
    complete: idx === ss.length - 1,
  };
});

const showAlert = computed(
  () => state.order.serviceMsg && state.order.status.toString().startsWith('4'),
);
const userFiles = computed(() => {
  return state.order.files?.filter(f => f.iType === 1) || [];
});
const sysFiles = computed(() => {
  return state.order.files?.filter(f => f.iType === 2) || [];
});

const oid = useRouteParams<string>('oid');

// 定时清理
const { pause, resume } = useTimeoutPoll(() => {
  state.uploadFiles = state.uploadFiles.filter(
    f => f.status !== 'success' && f.status !== 'fail',
  );
  if (!state.uploadFiles.length) {
    pause();
  }
}, 2000);

const httpRequest = (options: UploadRequestOptions) => {
  const key = `${state.sts.key}${options.file.name}`;
  const ext = oid.value;
  return ajaxUpload({
    ...options,
    data: { ...options.data, key, 'x:ext1': ext, 'x:ext2': props.sType },
  });
};
const fileSizeFormatter = (row: any) => {
  return fileSize(row.fileSize);
};
const fileNameFormatter = (row: any) => {
  return row.fileName + row.fileExt;
};

/**
 * 禁止手动删除文件
 */
const onUploadBeforeRemove = () => {
  return false;
};

const onBeforeUpload = (rawFile: UploadRawFile) => {
  const fileName = rawFile.name;
  const idx = fileName.lastIndexOf('.');
  const ext = fileName.substring(idx)?.toLocaleLowerCase();
  let flag = true;
  if (rawFile.size > props.fileMaxSize * 1012 * 1024) {
    notify.error(`文件过大: ${fileName} `);
    flag = false;
  } else if (!accepts.value.includes(ext)) {
    notify.error(`不支持的格式: ${fileName} `);
    flag = false;
  }
  if (!flag) {
    const uploadFile = state.uploadFiles.find(f => f.uid === rawFile.uid);
    if (uploadFile) {
      uploadFile.status = 'fail';
    }
    resume();
  }
  return flag;
};
/**
 * 上传失败
 * @param error
 * @param uploadFile
 * @param uploadFiles
 */
const onUploadError = (
  error: Error,
  uploadFile: UploadFile,
  uploadFiles: UploadFiles,
) => {
  console.debug('onError', error, uploadFile, uploadFiles);
  notify.error(`${uploadFile.name} ${error.message}`);
};

const onStart = () => {
  if (state.order?.files.length > 0) {
    state.loading = true;
    ElMessageBox.confirm(
      '亲，提交后就不可再上传文件或修改资料。(需要联系客服人员处理)',
      '提交确认',
      {
        confirmButtonText: '确定提交',
        cancelButtonText: '取消',
        type: 'warning',
      },
    ).then(async () => {
      await loadOrder(
        await startOrder(oid.value, props.sType, props.userOptions),
      );
      state.loading = false;
    });
  }
};
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

const loadOrder = async (order?: Order) => {
  if (!order) {
    order = await getOrder(oid.value, props.sType);
  }
  state.order = order;
  emit('orderLoaded', order);

  if (state.order) {
    state.isErr = false;
    if (canEdit.value && isEmpty(state.sts)) {
      state.sts = await getSts(oid.value);
    }
  } else {
    state.isErr = true;
  }
};
const shortTitle = (title: string, len = 20) => {
  if (title.length <= len) {
    return title;
  }
  const len2 = Math.ceil(len / 2);
  return `${title.substring(0, len2)}...${title.substring(
    title.length - len2,
    title.length,
  )}`;
};
const loadOrderDebounce = useDebounceFn(loadOrder, 2000);

const onUserFileDelete = async (fid: string) => {
  loadOrder(await delOrder(oid.value, props.sType, fid));
};
onMounted(() => {
  window.document.title = props.title;
  loadOrder();
});
</script>

<template>
  <div class="widthMax">
    <el-result
      v-if="state.isErr"
      icon="error"
      title="错误提示"
      sub-title="亲，订单不存在或者发生了错误，请联系客服人员。"
    >
    </el-result>
    <template v-else>
      <div class="c-black text-size-8 font-black text-center p4">
        {{ title }}
      </div>
      <el-steps :space="200" :active="1" simple class="lt-sm:pl-2! lt-sm-pr-2!">
        <el-step
          v-for="(item, i) in statusSteps.steps"
          :key="i"
          :title="item.title"
          :icon="item.icon"
          :status="item.status"
        />
      </el-steps>
      <div v-if="showAlert" class="mt-4">
        <el-alert
          type="error"
          :description="state.order.serviceMsg"
          :closable="false"
          show-icon
        />
      </div>
      <template v-if="statusSteps.complete">
        <el-divider content-position="left">任务结果</el-divider>
        <template>
          <div class="c-red-6 p5">三天会自动删除，请及时下载</div>
          <el-table
            v-if="sysFiles.length"
            :data="sysFiles"
            stripe
            style="width: 100%"
            max-height="250"
          >
            <el-table-column prop="fileName" label="文件">
              <template #default="scope">
                <div v-if="isSmallScreen">
                  <div>
                    {{ fileNameFormatter(scope.row) }}
                  </div>
                  <div class="c-gray-300">
                    <span>大小:{{ fileSizeFormatter(scope.row) }}</span>
                    <span v-if="scope.row.pages" class="ml-4">
                      页数:{{ scope.row.pages }}
                    </span>
                    <el-button link type="primary" size="small" class="ml-4">
                      下载
                    </el-button>
                  </div>
                </div>
                <template v-else>
                  {{ fileNameFormatter(scope.row) }}
                </template>
              </template>
            </el-table-column>
            <el-table-column
              v-if="!isSmallScreen"
              prop="fileSize"
              label="大小"
              width="100"
              :formatter="fileSizeFormatter"
            />
            <el-table-column
              v-if="!isSmallScreen"
              prop="pages"
              label="页数"
              width="100"
            />
            <el-table-column
              v-if="!isSmallScreen && canEdit"
              fixed="right"
              width="60"
            >
              <template #default="scope">
                <el-popconfirm
                  v-if="scope.row.status === 1"
                  :title="`确定要删除《${scope.row.fileName}》吗？`"
                  :width="200"
                  confirm-button-text="确定"
                  cancel-button-text="取消"
                  @confirm="onUserFileDelete(scope.row.id)"
                >
                  <template #reference>
                    <el-button link type="primary" size="small">
                      删除
                    </el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
            <template #empty> 暂无文件 </template>
          </el-table>
        </template>
      </template>
      <el-divider content-position="left">用户资料</el-divider>
      <el-upload
        v-if="canEdit"
        v-model:file-list="state.uploadFiles"
        :action="state.sts.url"
        :data="uploadData"
        :http-request="httpRequest"
        :on-error="onUploadError"
        :on-success="onUploadSuccess"
        :before-remove="onUploadBeforeRemove"
        :before-upload="onBeforeUpload"
        :accept="accept"
        drag
        multiple
      >
        <el-icon class="el-icon--upload">
          <upload-filled />
        </el-icon>
        <div class="el-upload__text">
          拖拽文件到此处 或 <em>点击选择文件</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            <span class="ml-5">1.单个文件最大{{ fileMaxSize }}M</span>
            <span class="ml-5">2.相同文件名会被覆盖</span>
            <span class="ml-5">3.上传的文件三天左右会自动删除</span>
          </div>
        </template>
      </el-upload>
      <el-table :data="userFiles" stripe style="width: 100%">
        <el-table-column prop="fileName" label="文件">
          <template #default="scope">
            <div v-if="isSmallScreen">
              <div>
                {{ fileNameFormatter(scope.row) }}
              </div>
              <div class="c-gray-300">
                <span>大小:{{ fileSizeFormatter(scope.row) }}</span>
                <span v-if="scope.row.pages" class="ml-4">
                  页数:{{ scope.row.pages }}
                </span>
                <el-popconfirm
                  v-if="canEdit && scope.row.status === 1"
                  :title="`删除《${shortTitle(scope.row.fileName)}》吗？`"
                  :width="200"
                  confirm-button-text="确定"
                  cancel-button-text="取消"
                  @confirm="onUserFileDelete(scope.row.id)"
                >
                  <template #reference>
                    <el-button link type="primary" size="small" class="ml-4">
                      删除
                    </el-button>
                  </template>
                </el-popconfirm>
              </div>
            </div>
            <template v-else>
              {{ fileNameFormatter(scope.row) }}
            </template>
          </template>
        </el-table-column>
        <el-table-column
          v-if="!isSmallScreen"
          prop="fileSize"
          label="大小"
          width="100"
          :formatter="fileSizeFormatter"
        />
        <el-table-column
          v-if="!isSmallScreen"
          prop="pages"
          label="页数"
          width="100"
        />
        <el-table-column
          v-if="!isSmallScreen && canEdit"
          fixed="right"
          width="60"
        >
          <template #default="scope">
            <el-popconfirm
              v-if="scope.row.status === 1"
              :title="`确定要删除《${scope.row.fileName}》吗？`"
              :width="200"
              confirm-button-text="确定"
              cancel-button-text="取消"
              @confirm="onUserFileDelete(scope.row.id)"
            >
              <template #reference>
                <el-button link type="primary" size="small"> 删除 </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
        <template #empty> 暂无文件 </template>
      </el-table>
      <slot name="userOptions" :can-edit="canEdit"></slot>

      <div v-if="canEdit" class="text-center m4">
        <el-button
          type="primary"
          size="large"
          :loading="state.loading"
          :disabled="
            state.loading ||
            !state.order ||
            !state.order?.files ||
            state.order?.files.length === 0
          "
          @click="onStart"
        >
          提交资料
        </el-button>
      </div>
      <el-divider content-position="left">帮助说明</el-divider>
      <div class="help p5 c-gray-6">
        <slot name="help" :can-edit="canEdit"></slot>
      </div>
    </template>
    <el-backtop :right="100" :bottom="100" />
  </div>
</template>
<style lang="scss" scoped>
.el-upload__tip {
  /* position: relative;
  margin-top: -25px; */
  color: #f56c6c;
}
.widthMax {
  :deep(.el-divider__text) {
    color: gray;
  }
}
.help {
  word-wrap: break-word;
  word-break: normal;
}
</style>
