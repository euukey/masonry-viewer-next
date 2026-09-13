<div align="center">
  <img src="icon.svg" alt="Masonry Viewer Next" width="120" height="120" />
  <h1>Masonry Viewer Next</h1>
  <p>打开本地文件夹就能看的瀑布流图片浏览器</p>

![Platform](https://img.shields.io/badge/platform-Chrome%20%7C%20Edge%20%7C%20Firefox%20%7C%20Safari-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)
![Size](https://img.shields.io/badge/size-~250%20KB-brightgreen)

[![Demo](https://img.shields.io/badge/Demo-GitHub%20Pages-2ea44f?style=for-the-badge)](https://euukey.github.io/masonry-viewer-next/)

</div>

---

纯静态页面，无框架，无构建步骤。不联网，不上传，图片只在本机打开。本项目基于 wlm3201 的 [Masonry Image Viewer](https://github.com/wlm3201/Masonry_Image_Viewer) 二次开发，重新设计了界面与加载流程。

<!-- 截图：把界面截图放到 docs/ 下，再把下面这段的注释去掉
<div align="center">
  <table><tr>
    <td><img src="docs/screenshot-dark.png" alt="深色" width="400" /></td>
    <td><img src="docs/screenshot-light.png" alt="浅色" width="400" /></td>
  </tr><tr>
    <td align="center"><sub>深色</sub></td>
    <td align="center"><sub>浅色</sub></td>
  </tr></table>
</div>
-->

## 快速开始

1. 点击右上角 Code，选择 Download ZIP，解压
2. 双击 `index.html`，用 Chrome 或 Edge 打开
3. 点击「打开文件夹」，选择存放图片的文件夹

无需安装 Node、npm，无需启动服务与联网。按 `H` 查看全部快捷键。

> [!NOTE]
> 双击 `index.html` 打开时浏览器不允许注册 Service Worker，仅「安装为应用」与离线缓存不可用，其余功能相同。需要这两项时见[部署到 GitHub Pages](#部署到-github-pages)。

### 浏览器支持

| 浏览器 | 打开方式 | 可用功能 |
| --- | --- | --- |
| 桌面版 Chrome / Edge（86+） | 双击 `index.html` | 除「安装为桌面应用」与离线缓存外，其余功能全部可用 |
| 桌面版 Chrome / Edge（86+） | 任意 http(s) 网址（GitHub Pages 或本地服务器） | 全部功能：拖入文件夹、拖出复制、安装为桌面应用、离线缓存 |
| Firefox / Safari | 双击 `index.html` | 兼容模式，使用传统文件夹选择器；不支持拖入文件夹、拖出复制、安装为应用 |
| 手机 / 平板 | 系统文件选择器 | 只能逐张选图，图片平铺显示，没有文件夹与目录结构 |

## 功能

- **随机顺序**：打开即为随机浏览，按 `R` 重新洗牌；也可切换为默认顺序、按日期、按大小
- **瀑布流布局**：响应式列数，列距、行距、圆角、边框均可调，也可切换为「横向等高」
- **目录树**：列出全部文件夹与图片数量，任意排序下都可跳转到某个文件夹；不需要子文件夹时可在设置里改为只读当前层
- **放大浏览**：全屏、滚轮缩放、拖动，用 `←` `→` 或 `A` `D` 翻上一张、下一张
- **悬停详情**：显示尺寸、体积、时间、文件名与所在目录，可关闭
- **右键菜单**：与顶部工具栏相同的操作集合
- **拖放**：文件夹拖入页面即为打开，图片拖到文件夹上即为复制
- **三态主题**：跟随系统 / 浅色 / 深色，选择保存在本地
- **筛选**：只显示黑白漫画或纯色边框的图片，可反转结果并显示命中数量
- **宽高比**：填写 `16:9`、`16:9-`、`-16:9`、`4:3-16:9`，或点击横图、竖图、方图等预设
- **大图库加载**：缩略图管线、比例占位、约两屏半缓冲与在途解码上限，几千张 4K 图也能正常滚动

## 快捷键

| 按键 | 作用 |
| --- | --- |
| `移动鼠标到顶部` | 显示工具栏（默认隐藏） |
| `O` | 打开文件夹（替换当前图库） |
| `S` | 设置面板 |
| `D` | 目录树 |
| `R` | 重排（随机顺序换一批） |
| `Home` | 回到顶部 |
| `End` | 到底部 |
| `L` | 加载全部 |
| `P` | 暂停加载 |
| `F` | 全屏 / 退出全屏 |
| `T` | 明暗主题循环 |
| `←` `→` / `A` `D` | 放大后上一张 / 下一张 |
| `滚轮` / `移动鼠标` | 放大后缩放 / 拖动 |
| `Esc` | 关闭弹层 / 退出放大 |
| `H` `/` `F1` `?` | 打开本帮助 |

## 常见问题

<details>
<summary><strong>会联网或上传图片吗？</strong></summary>

<br>

不会。页面自身不发起任何网络请求，图片由浏览器在本机解码，代码中也没有 `fetch` 与 `XMLHttpRequest`。

</details>

<details>
<summary><strong>支持哪些图片格式？</strong></summary>

<br>

按文件的 `image/*` 类型判断，jpg、png、webp、gif、avif、bmp、svg 等常见格式都可以，能否显示取决于浏览器自身是否支持解码。其余文件会被跳过。

</details>

<details>
<summary><strong>为什么 Firefox / Safari 的功能少一些？</strong></summary>

<br>

这两个浏览器没有 File System Access API，因此改用兼容模式（传统文件夹选择器）。浏览、随机顺序、筛选、放大、目录树都可正常使用；只有拖入文件夹、拖出复制、安装为桌面应用需要该 API。

</details>

<details>
<summary><strong>为什么双击打开时装不成桌面应用？</strong></summary>

<br>

浏览器不允许 `file://` 页面注册 Service Worker，而安装为应用与离线缓存依赖它。用任意 http(s) 地址打开即可，见[部署到 GitHub Pages](#部署到-github-pages)。

</details>

<details>
<summary><strong>手机或平板能用吗？</strong></summary>

<br>

移动端浏览器没有文件夹选择能力。用系统选择器逐张选图时，图片会平铺显示，没有目录结构；按目录浏览需要桌面版。

</details>

<details>
<summary><strong>会连同子文件夹一起读入吗？</strong></summary>

<br>

默认会，整棵子树都读进来，目录树就是据此建立的。只想看当前一层时，在设置面板的「浏览」里把「包含子文件夹」关掉，改动后重新打开文件夹生效。读取过程中底部会显示已读到的图片与文件夹数量。

</details>

<details>
<summary><strong>几千张图会不会卡？</strong></summary>

<br>

不会卡住，但首次进入某个文件夹时需要一个生成缩略图的过程，之后滚动是流畅的。浏览过的缩略图会缓存在内存里（每张约几十 KB），刷新页面即释放。

</details>

## 部署到 GitHub Pages

把仓库根目录下的全部文件传到 GitHub（网页上 `Add file` → `Upload files` 即可），再到 `Settings` → `Pages` 里把 `Source` 设为 `Deploy from a branch`、分支 `main`、目录 `/ (root)`，保存后约一分钟即可通过 `https://<用户名>.github.io/masonry-viewer-next/` 访问。

### 安装为桌面应用

需要先用 http(s) 打开。用 Chrome / Edge 打开后，点击地址栏右侧的「安装」图标。本项目不会主动弹出安装提示，也不申请通知、定位等权限；唯一出现的系统窗口是选择文件夹时的读取授权。

## 用本地服务器打开

仅在需要「安装为桌面应用」或「断网也能打开」时使用。本项目无构建步骤，任意静态服务器均可：

```bash
git clone https://github.com/euukey/masonry-viewer-next.git
cd masonry-viewer-next
python -m http.server 8000     # 或 npx serve
```

然后打开 <http://localhost:8000>。未安装 Python 时直接双击 `index.html` 即可，仅无法安装为桌面应用。

## 目录结构

```
index.html           页面结构，含帮助卡片、设置面板、右键菜单
style.css            界面样式，@layer 分层
tokens.css           明暗两套设计令牌，语义层，基于 Open Props
open-props.min.css   Open Props v1.7.15，MIT，已内置，运行时不走 CDN
script.js            全部交互逻辑，原生 DOM，无框架
sw.js                Service Worker，预缓存上述资源
app.webmanifest      PWA 清单
icon.svg             图标源文件
favicon.ico / 192x192.png / 512x512.png
LICENSE              MIT
```

## 技术说明

- 无 npm，无打包器，交互全部使用原生 DOM 与 CSS，界面状态以 `data-*` 与 class 表示，修改后直接刷新即可生效
- 无 `fetch` 与 `XMLHttpRequest`，唯一的外部资源 Open Props 已本地化；无 `innerHTML`，文件名、文件夹名一律通过 `innerText` 写入
- 两条读取路径共用一条加载管线：优先 File System Access API，不支持时退回 `<input webkitdirectory>`，还原出的目录树与排序一致
- 主题在 `<head>` 内联脚本中提前应用，刷新不闪色；切换主题的两帧关闭全部过渡，避免整屏重绘与毛玻璃重算造成卡顿
- Service Worker 负责离线可用与版本更新：预缓存资源先请求网络、失败才用缓存，服务器返回 304 时几乎不产生流量，修改后刷新即为新版本。`file://` 下注册失败会被忽略

## 致谢

- [Masonry Image Viewer](https://github.com/wlm3201/Masonry_Image_Viewer)，由 [wlm3201](https://github.com/wlm3201) 开发，本版基于它修改
- [Open Props](https://open-props.style)，界面设计令牌的来源

## 许可

[MIT](LICENSE)，Copyright (c) 2026 euukey，并保留上游 wlm3201 的版权声明。
