import fs from 'fs';
import path from 'path';
import externalGlobals from 'rollup-plugin-external-globals';
import { Plugin, UserConfig } from 'vite';

export interface Module {
  name: string;
  var: string;
  path: string | string[];
  css?: string | string[];
}

export interface Options {
  modules: (Module | ((prodUrl: string) => Module))[];
  prodUrl?: string;
}

/**
 * get npm module version
 * @param name
 * @returns
 */
function getModuleVersion(name: string): string {
  const pwd = process.cwd();
  const pkgFile = path.join(pwd, 'node_modules', name, 'package.json');
  if (fs.existsSync(pkgFile)) {
    const pkgJson = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
    return pkgJson.version;
  }

  return '';
}

/**
 * 是否完整的 url
 * @param path
 * @returns
 */
function isFullPath(path: string) {
  return path.startsWith('http:') ||
    path.startsWith('https:') ||
    path.startsWith('//')
    ? true
    : false;
}

function renderUrl(
  url: string,
  data: {
    name: string;
    version: string;
    path: string;
  },
) {
  const { path } = data;
  if (isFullPath(path)) {
    url = path;
  }
  return url
    .replace(/\{name\}/g, data.name)
    .replace(/\{version\}/g, data.version)
    .replace(/\{path\}/g, path);
}

function PluginImportToCDN(options: Options): Plugin[] {
  const {
    modules = [],
    prodUrl = 'https://cdn.jsdelivr.net/npm/{name}@{version}/{path}',
  } = options;

  let isBuild = false;

  const data = modules.map(m => {
    let v: Module;
    if (typeof m === 'function') {
      v = m(prodUrl);
    } else {
      v = m;
    }
    const version = getModuleVersion(v.name);
    let pathList: string[] = [];
    if (!Array.isArray(v.path)) {
      pathList.push(v.path);
    } else {
      pathList = v.path;
    }

    const data = {
      ...v,
      version,
    };

    pathList = pathList.map(p => {
      if (!version && !isFullPath(p)) {
        throw new Error(
          `modules: ${data.name} package.json file does not exist`,
        );
      }
      return renderUrl(prodUrl, {
        ...data,
        path: p,
      });
    });

    let css = v.css || [];
    if (!Array.isArray(css) && css) {
      css = [css];
    }

    const cssList = !Array.isArray(css)
      ? []
      : css.map(c =>
          renderUrl(prodUrl, {
            ...data,
            path: c,
          }),
        );

    return {
      ...v,
      version,
      pathList,
      cssList,
    };
  });

  const externalMap: {
    [name: string]: string;
  } = {};

  data.forEach(v => {
    externalMap[v.name] = v.var;
  });

  const externalLibs = Object.keys(externalMap);

  const plugins: Plugin[] = [
    {
      name: 'vite-plugin-cdn-import',
      config(_, { command }) {
        const userConfig: UserConfig = {
          build: {
            rollupOptions: {},
          },
        };

        if (command === 'build') {
          isBuild = true;

          userConfig!.build!.rollupOptions = {
            external: [...externalLibs],
            plugins: [externalGlobals(externalMap)],
          };
        } else {
          isBuild = false;
        }

        return userConfig;
      },
      transformIndexHtml(html) {
        const cssCode = data
          .map(v =>
            v.cssList
              .map(css => `<link href="${css}" rel="stylesheet">`)
              .join('\n'),
          )
          .filter(v => v)
          .join('\n');

        const jsCode = !isBuild
          ? ''
          : data
              .map(p =>
                p.pathList
                  .map(
                    url =>
                      `<script  type="module" crossorigin src="${url}"></script>`,
                  )
                  .join('\n'),
              )
              .join('\n');

        return html.replace(/<\/title>/i, `</title>${cssCode}\n${jsCode}`);
      },
    },
  ];

  return plugins;
}

export { PluginImportToCDN as Plugin };

/**
 * module 配置自动完成
 */
const modulesConfig = {
  react: {
    var: 'React',
    jsdeliver: {
      path: 'umd/react.production.min.js',
    },
  },
  'react-dom': {
    var: 'ReactDOM',
    jsdeliver: {
      path: 'umd/react-dom.production.min.js',
    },
  },
  'react-router-dom': {
    var: 'ReactRouterDOM',
    jsdeliver: {
      path: 'umd/react-router-dom.min.js',
    },
  },
  antd: {
    var: 'antd',
    jsdeliver: {
      path: 'dist/antd.min.js',
      css: 'dist/antd.min.css',
    },
  },
  ahooks: {
    var: 'ahooks',
    jsdeliver: {
      path: 'dist/ahooks.js',
    },
  },
  '@ant-design/charts': {
    var: 'charts',
    jsdeliver: {
      path: 'dist/charts.min.js',
    },
  },
  vue: {
    var: 'Vue',
    jsdeliver: {
      path: 'dist/vue.global.prod.js',
    },
    bootcdn: {
      path: 'vue.global.prod.min.js',
    },
  },
  vue2: {
    var: 'Vue',
    jsdeliver: {
      name: 'vue',
      path: 'dist/vue.runtime.min.js',
    },
  },
  '@vueuse/shared': {
    var: 'VueUse',
    jsdeliver: {
      path: 'index.iife.min.js',
    },
  },
  '@vueuse/core': {
    var: 'VueUse',
    jsdeliver: {
      path: 'index.iife.min.js',
    },
  },
  moment: {
    var: 'moment',
    jsdeliver: {
      path: 'moment.min.js',
    },
  },
  eventemitter3: {
    var: 'EventEmitter3',
    jsdeliver: {
      path: 'umd/eventemitter3.min.js',
    },
  },
  'file-saver': {
    var: 'window',
    jsdeliver: {
      path: 'dist/FileSaver.min.js',
    },
  },
  'browser-md5-file': {
    var: 'browserMD5File',
    jsdeliver: {
      path: 'dist/index.umd.min.js',
    },
  },
  xlsx: {
    var: 'XLSX',
    jsdeliver: {
      path: 'dist/xlsx.full.min.js',
    },
  },
  axios: {
    var: 'axios',
    jsdeliver: {
      path: 'dist/axios.min.js',
    },
  },
  lodash: {
    var: '_',
    jsdeliver: {
      path: 'lodash.min.js',
    },
  },
  'crypto-js': {
    var: 'crypto-js',
    jsdeliver: {
      path: 'crypto-js.min.js',
    },
  },
  localforage: {
    var: 'localforage',
    jsdeliver: {
      path: 'dist/localforage.min.js',
    },
  },
};

export type ModuleName = keyof typeof modulesConfig;

/* function isJsdeliver(prodUrl: string) {
  return prodUrl.includes('//cdn.jsdelivr.net');
}

function isUnpkg(prodUrl: string) {
  return prodUrl.includes('//unpkg.com');
}
function isBootcdn(prodUrl: string) {
  return prodUrl.includes('//cdnjs.cloudflare.com');
} */
function isCdnjs(prodUrl: string) {
  return prodUrl.includes('//cdnjs.cloudflare.com');
}

export function autoComplete(name: ModuleName, cdnName = 'jsdeliver') {
  const config = modulesConfig[name];
  if (!config) {
    throw new Error(`The configuration of module ${name} does not exist `);
  }
  return (prodUrl: string) => {
    console.debug('autoComplete', prodUrl);
    if (isCdnjs(prodUrl)) {
      throw new Error(
        `The configuration of module ${name} in ${prodUrl} does not exist `,
      );
    } else {
      return {
        name,
        var: config.var,
        ...config[cdnName],
      } as Module;
    }
  };
}
