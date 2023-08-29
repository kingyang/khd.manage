<script lang="ts" setup>
import { Order } from '@/api/common';

import UserFlow from './componens/UserFlow.vue';
const sType = 'dt';
const accept = '.doc,.docx,.ppt,.pptx,.xls,.xls,.pdf';
/**
 * 最大尺寸
 */
const fileMaxSize = 40;
const langs = [
  ['zh', '中文(简体)'],
  ['en', '英语'],
  ['ru', '俄语'],
  ['fra', '法语'],
  ['de', '德语'],
  ['kor', '韩语'],
  ['jp', '日语'],
  ['other', '其他语言联系客服'],
];
const userOptions = reactive({
  lang: langs[0][0],
});

const onOrderLoaded = (order: Order) => {
  userOptions.lang = order?.userOptions?.lang || langs[0][0];
};
</script>
<template>
  <UserFlow
    title="文档翻译"
    :accept="accept"
    :s-type="sType"
    :user-options="userOptions"
    :file-max-size="fileMaxSize"
    @order-loaded="onOrderLoaded"
  >
    <template #userOptions="slotProps">
      <div class="text-center m4">
        目标语言:
        <el-select
          v-model="userOptions.lang"
          class="m-2"
          placeholder="Select"
          size="large"
          :disabled="!slotProps.canEdit"
        >
          <el-option
            v-for="item in langs"
            :key="item[0]"
            :label="item[1]"
            :value="item[0]"
          />
        </el-select>
      </div>
    </template>
    <template #help>
      <div>支持格式:{{ accept }}</div>
      <div>文件超过{{ fileMaxSize }}M,请联系客服</div>
    </template>
  </UserFlow>
</template>
