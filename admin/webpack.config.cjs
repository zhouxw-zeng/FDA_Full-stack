const path = require('node:path');

const webpack = require('webpack');
const { VueLoaderPlugin } = require('vue-loader');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const dotenv = require('dotenv');
const { BackendDevServerPlugin, resolvePort } = require('./scripts/backend-dev-server.cjs');

const rootDir = __dirname;

/**
 * webpack 不会像 Vite 那样自动读取 .env，
 * 这里按 .env -> .env.<mode> 的顺序加载，后者覆盖前者。
 */
function loadEnv(mode) {
  const result = {};
  for (const file of ['.env', `.env.${mode}`]) {
    const { parsed } = dotenv.config({ path: path.resolve(rootDir, file), quiet: true });
    if (parsed) {
      Object.assign(result, parsed);
    }
  }
  return result;
}

function loadBackendPort() {
  const { parsed } = dotenv.config({
    path: path.resolve(rootDir, '../server/.env'),
    quiet: true,
  });
  return Number(process.env.BACKEND_PORT || process.env.PORT || parsed?.PORT) || 3000;
}

module.exports = async (_cliEnv, argv) => {
  const mode = argv.mode || 'development';
  const isProd = mode === 'production';
  const isServe = Boolean(_cliEnv?.WEBPACK_SERVE);
  const appEnv = loadEnv(mode);
  const preferredBackendPort = loadBackendPort();
  const preferredDevPort = Number(process.env.DEV_PORT || appEnv.DEV_PORT) || 5173;
  // 后端已在别的终端 / 容器里运行时，用 BACKEND_AUTOSTART=false 跳过自动拉起与端口清理
  const autoStartBackend =
    !isProd &&
    isServe &&
    (process.env.BACKEND_AUTOSTART ?? appEnv.BACKEND_AUTOSTART ?? 'true') !== 'false';

  // 启动前先处理端口占用：能结束旧进程就沿用原端口，结束不掉（权限不足等）则顺延到下一个可用端口。
  let backendPort = preferredBackendPort;
  let devPort = preferredDevPort;
  if (!isProd && isServe) {
    if (autoStartBackend) {
      backendPort = await resolvePort({ preferredPort: preferredBackendPort, label: '后端' });
    }
    devPort = await resolvePort({ preferredPort: preferredDevPort, label: '前端' });
  }

  const styleLoader = isProd ? MiniCssExtractPlugin.loader : 'style-loader';

  return {
    mode,
    target: 'web',
    entry: path.resolve(rootDir, 'src/main.ts'),
    output: {
      path: path.resolve(rootDir, 'dist'),
      filename: isProd ? 'assets/[name].[contenthash:8].js' : 'assets/[name].js',
      chunkFilename: isProd ? 'assets/[name].[contenthash:8].js' : 'assets/[name].js',
      publicPath: '/',
      clean: true,
    },
    devtool: isProd ? false : 'eval-cheap-module-source-map',
    resolve: {
      extensions: ['.ts', '.js', '.vue', '.json'],
      alias: {
        '@': path.resolve(rootDir, 'src'),
      },
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader',
        },
        {
          test: /\.ts$/,
          loader: 'ts-loader',
          exclude: /node_modules/,
          options: {
            // 类型检查交给 `pnpm typecheck`（vue-tsc），打包只做转译
            transpileOnly: true,
            appendTsSuffixTo: [/\.vue$/],
          },
        },
        {
          test: /\.css$/,
          use: [styleLoader, 'css-loader'],
        },
        {
          test: /\.scss$/,
          use: [
            styleLoader,
            'css-loader',
            {
              loader: 'sass-loader',
              options: {
                api: 'modern-compiler',
              },
            },
          ],
        },
        {
          test: /\.(png|jpe?g|gif|svg|webp|woff2?|ttf|eot)$/i,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 8 * 1024,
            },
          },
        },
      ],
    },
    plugins: [
      new VueLoaderPlugin(),
      new HtmlWebpackPlugin({
        template: path.resolve(rootDir, 'index.html'),
        inject: 'body',
      }),
      new webpack.DefinePlugin({
        /*
         * Vue 的 esm-bundler 版本要求显式注入这几个开关。
         * Element Plus 内部用到了 Options API，因此 __VUE_OPTIONS_API__ 必须为 true。
         */
        __VUE_OPTIONS_API__: JSON.stringify(true),
        __VUE_PROD_DEVTOOLS__: JSON.stringify(false),
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false),
        /*
         * 构建期常量。这里刻意拆成独立的字面量而不是一个对象：
         * webpack 只能在代码分割前静态判定简单常量，
         * `__USE_BUSINESS_MOCK__ ? import(...) : ...` 这样写生产构建才会真正丢掉 mock 分块。
         */
        __APP_TITLE__: JSON.stringify(appEnv.APP_TITLE || '相册视频论坛 · 管理后台'),
        __API_BASE_URL__: JSON.stringify(appEnv.API_BASE_URL || '/'),
        __BASE_PATH__: JSON.stringify(appEnv.BASE_PATH || '/'),
        __USE_BUSINESS_MOCK__: JSON.stringify(appEnv.USE_BUSINESS_MOCK !== 'false'),
        __DEV__: JSON.stringify(!isProd),
      }),
      ...(autoStartBackend
        ? [
            new BackendDevServerPlugin({
              port: backendPort,
              serverDir: path.resolve(rootDir, '../server'),
            }),
          ]
        : []),
      ...(isProd
        ? [
            new MiniCssExtractPlugin({
              filename: 'assets/[name].[contenthash:8].css',
              chunkFilename: 'assets/[name].[contenthash:8].css',
            }),
          ]
        : []),
    ],
    optimization: {
      runtimeChunk: 'single',
      splitChunks: {
        cacheGroups: {
          vue: {
            test: /[\\/]node_modules[\\/](vue|vue-router|pinia|@vue)[\\/]/,
            name: 'vue',
            chunks: 'all',
            priority: 30,
          },
          element: {
            test: /[\\/]node_modules[\\/](element-plus|@element-plus)[\\/]/,
            name: 'element',
            chunks: 'all',
            priority: 20,
          },
          charts: {
            test: /[\\/]node_modules[\\/](echarts|zrender|vue-echarts)[\\/]/,
            name: 'charts',
            chunks: 'all',
            priority: 10,
          },
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 1,
          },
        },
      },
    },
    performance: {
      hints: false,
    },
    devServer: {
      host: '0.0.0.0',
      port: devPort,
      hot: true,
      open: false,
      // history 路由必须回退到 index.html，否则刷新深层路由会 404
      historyApiFallback: true,
      // 前端只请求同源 /api，由 dev server 转发到 NestJS，避免跨域问题
      proxy: [
        {
          context: ['/api', '/swagger'],
          target:
            process.env.PROXY_TARGET || appEnv.PROXY_TARGET || `http://localhost:${backendPort}`,
          changeOrigin: true,
        },
        {
          // 本地文件上传接口返回的地址，需要同源代理才能直接预览 / 下载
          context: ['/local-files'],
          target:
            process.env.PROXY_TARGET || appEnv.PROXY_TARGET || `http://localhost:${backendPort}`,
          changeOrigin: true,
        },
      ],
      client: {
        overlay: {
          errors: true,
          warnings: false,
        },
      },
    },
    stats: 'minimal',
  };
};
