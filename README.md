# LAO LE 个人作品集

已完成简历文案对应：`content/profile.json` 为个人内容入口，`content/内容对应.md` 记录依据与待补素材。当前保留 3 张卡片：蘑菇租房、得到阅读闯关、个人生活。个人生活已接入精选照片和生活拼贴；蘑菇租房与得到已接入完整作品集，详情页支持纵向连续阅读和高清长图入口；校园生活及待定内容已按要求移除。

`assets/profile/projects.js` 是当前生效的项目数据；原始 `projectsData.js` 已不被页面引用。运行 `scripts/personalize.py` 重新生成个人页面并同步 dist。

## 原站复刻基础

当前版本使用从 https://ning-h.com/ 读取的实际页面结构、样式、字体、图片、视频和动画依赖。设计及原始前端代码归 Ning Huang；本地保留署名。

## 预览

运行 `npm run dev`，打开 http://127.0.0.1:5173 。页面有原站的加载动画，等待结束后向下滚动。用户提供的立方体截图属于滚动过程中的状态，并不是首页静态初始画面。

请通过 HTTP 预览，不要双击 HTML：模块脚本和资源路径需要本地服务器。

## 当前生效的文件

- `index.html`：原站页面结构及内联动画，资源地址已本地化。
- `assets/ning-h.com/wp-content/themes/ning25/css/styles.css`：主要视觉样式。
- `assets/ning-h.com/wp-content/themes/ning25/css/global.css`：全局样式。
- `assets/ning-h.com/wp-content/themes/ning25/js/script.js`：加载、WebGL、滚动立方体等动画。
- `assets/ning-h.com/wp-content/themes/ning25/js/utility.js`：About、项目展开、拖拽和彩蛋等交互。
- `assets/ning-h.com/wp-content/themes/ning25/js/projectsData.js`：项目文字、图片、视频和外链，后续替换个人作品的入口。
- `assets/ning-h.com/wp-content/uploads/`：本地字体、图片、视频及 CV。
- `server.cjs`：支持字体 MIME 类型和视频 Range 请求的预览服务器。
- `dist/`：同步后的静态发布文件；本次没有部署。

根目录旧的 `app.js`、`content.js`、`style.css` 已不被页面引用。旧版另存于 `reference/previous/` 和 `reference/approximation-v2/`。

## 检查和来源

`npm run check` 校验全部页面脚本、依赖和动态媒体路径。启动服务器后 `node scripts/check-http.cjs` 校验资源响应和视频分段请求。

`reference/original/` 保留原始网页、原始样式/脚本及 URL 映射；`scripts/build_local.py` 可重新生成本地化文件（注意会覆盖对生成文件的直接修改）。

`reference/DIFFERENCES.md` 记录已修复的问题和未验证项。当前所有 96 个已识别依赖均已下载；外部作品站点、社交链接、邮件链接仍指向原站作者的目标地址。
