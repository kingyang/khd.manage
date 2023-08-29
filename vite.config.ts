import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import UnoCSS from 'unocss/vite';
import AutoImport from 'unplugin-auto-import/vite';
import IconsResolver from 'unplugin-icons/resolver';
import Icons from 'unplugin-icons/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';
import eslintPlugin from 'vite-plugin-eslint';
const pathResolve = (dir: string): string => {
  return path.resolve(__dirname, '.', dir);
};
// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': pathResolve('src/'),
    },
  },
  plugins: [
    vue(),
    eslintPlugin({
      fix: true, // enable auto fix
    }),
    vueJsx(),
    AutoImport({
      // targets to transform
      include: [
        /\.tsx$/,
        /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
        /\.vue$/,
        /\.vue\?vue/, // .vue
      ],

      // global imports to register
      imports: ['vue', '@vueuse/core', '@vueuse/math'],
      dts: './types/auto-imports.d.ts',
      dirs: ['./src/store', './src/auto', './src/api'],
      vueTemplate: true,
      // Generate corresponding .eslintrc-auto-import.json file.
      // eslint globals Docs - https://eslint.org/docs/user-guide/configuring/language-options#specifying-globals
      eslintrc: {
        enabled: true, // Default `false`
        filepath: './.eslintrc-auto-import.json', // Default `./.eslintrc-auto-import.json`
        globalsPropValue: true, // Default `true`, (true | false | 'readonly' | 'readable' | 'writable' | 'writeable')
      },
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      dts: './types/auto-components.d.ts',
      resolvers: [ElementPlusResolver(), IconsResolver()],
    }),
    Icons({
      compiler: 'vue3',
      defaultStyle: 'margin: auto',
      defaultClass: 'uicon',
      autoInstall: true,
      scale: 1.4,
    }),
    UnoCSS(),
    visualizer({
      gzipSize: true,
      brotliSize: true,
      emitFile: false,
      open: true, //如果存在本地服务端口，将在打包后自动展示
    }),
  ],
  envPrefix: ['VITE_', 'TAURI_', 'APP_'],
  esbuild: {
    drop: ['console', 'debugger'],
  },
});
