<script lang="ts" setup>
import { Order } from '@/api/common';

import UserFlow from './componens/UserFlow.vue';
const sType = 'a2e';
const accept =
  '.pdf,.bmp,.dib,.rle,.dcx,.djvu,.djv,.xls,.pdf,.gif,.jb2,.jbig2,.jp2,.j2k,.jpf,.jpx,.jpg,.jpeg,.pcx,.png,.tif,.tif,.xps,.wdp,.wmp,.hdp';
/**
 * 最大尺寸
 */
const fileMaxSize = 500;
const langs = [
  ['Chinese Simplified and English', '简体中文和英语'],
  ['Chinese Simplified', '简体中文'],
  ['Chinese Traditional', '繁体中文'],
  ['English', '英语'],
  ['Japanese', '日语'],
  ['Korean', '韩语'],
  ['Chinese Traditional and English', '繁体中文和英语'],
  ['Japanese and English', '日语和英语'],
];
const targets = [
  ['docx', 'Word文档'],
  ['xlsx', 'Excel文档'],
  ['pptx', 'Ppt文档'],
];
const userOptions = reactive({
  lang: langs[0][0],
  target: targets[0][0],
});

const onOrderLoaded = (order: Order) => {
  if (!order) {
    return;
  }
  userOptions.lang = order?.userOptions?.lang || langs[0][0];
  userOptions.target = order?.userOptions?.target || targets[0][0];
};
</script>
<template>
  <UserFlow
    title="文档转换(图片/PDF转可编辑Word/Excel/PPT)"
    :accept="accept"
    :s-type="sType"
    :user-options="userOptions"
    :file-max-size="fileMaxSize"
    @order-loaded="onOrderLoaded"
  >
    <template #userOptions="slotProps">
      <div class="text-center m4">
        <span class="inline-block">
          文档语种:
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
        </span>

        <span class="inline-block">
          目标文档:
          <el-select
            v-model="userOptions.target"
            class="m-2"
            placeholder="Select"
            size="large"
            :disabled="!slotProps.canEdit"
          >
            <el-option
              v-for="item in targets"
              :key="item[0]"
              :label="item[1]"
              :value="item[0]"
            />
          </el-select>
        </span>
      </div>
    </template>
    <template #help>
      支持格式
      <ol class="text-list">
        <li>支持文档.pdf</li>
        <li>
          支持图片.bmp .dib .rle .dcx .djvu .djv .xls .pdf .gif .jb2 .jbig2 .jp2
          .j2k .jpf .jpx .jpg .jpeg .pcx .png .tif .tif .xps .wdp .wmp .hdp
        </li>
        <li>输出格式:Word/Excel/PPT</li>
      </ol>
      常见问题
      <ol class="text-list">
        <li>若文件超过{{ fileMaxSize }}M，请联系客服</li>
        <li>若文档语种是它语言，请联系客服</li>
        <li>小文件一般3~5分钟，大文件需要根据更长，刷新页面看一下处理状态</li>
      </ol>
      其它
      <ol class="text-list">
        <li>
          24:00~8:00 客服不在线（代转人员在线，可转换文档）有问题请旺旺留言
        </li>
      </ol>
    </template>
  </UserFlow>
</template>
<style lang="scss" scoped>
.text-list li {
  margin: 5px 0 5px 0;
  font-size: 16px;
}
</style>
