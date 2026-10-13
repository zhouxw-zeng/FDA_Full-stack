/**
 * webpack DefinePlugin 在打包时把这些常量替换成字面量，
 * 因此这里只做类型声明，不引入任何打包器或 Node 的类型。
 */
/** 应用标题，用于浏览器标签 */
declare const __APP_TITLE__: string;
/** 后端接口前缀 */
declare const __API_BASE_URL__: string;
/** 前端部署的基础路径 */
declare const __BASE_PATH__: string;
/** 是否为未实现的业务模块启用本地 mock 数据 */
declare const __USE_BUSINESS_MOCK__: boolean;
/** 是否为开发构建 */
declare const __DEV__: boolean;

