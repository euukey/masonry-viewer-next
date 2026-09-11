// Service Worker：file:// 或较旧的浏览器可能没有这个 API，
// 先判断存在再注册，避免脚本一开始就中断。
if (navigator.serviceWorker) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
  // 页面已由 Service Worker 接管时，等新版本接管完成后自动刷新一次，
  // 这样更新版本时无需手动刷新。首次安装时 controller 为空，不会额外刷新。
  if (navigator.serviceWorker.controller)
    navigator.serviceWorker.addEventListener("controllerchange", () => location.reload());
}
class Queue {
  constructor(items = []) {
    this.items = items;
    this.getters = [];
  }
  push(item) {
    this.items.push(item);
    if (this.getters.length > 0) this.getters.shift()(this.items.shift());
  }
  shift() {
    if (this.items.length === 0)
      return new Promise((resolve) => this.getters.push(resolve));
    return this.items.shift();
  }
}
DataView.prototype.getUint24 = function (byteOffset, littleEndian) {
  if (littleEndian) {
    return (
      this.getUint8(byteOffset) |
      (this.getUint8(byteOffset + 1) << 8) |
      (this.getUint8(byteOffset + 2) << 16)
    );
  } else {
    return (
      (this.getUint8(byteOffset) << 16) |
      (this.getUint8(byteOffset + 1) << 8) |
      this.getUint8(byteOffset + 2)
    );
  }
};
function range(start, end, step = 1) {
  let arr = [];
  for (let i = start; i < end; i += step) arr.push(i);
  return arr;
}
function shuffle(arr) {
  // Fisher-Yates 洗牌：等概率，不改动原数组
  let res = arr.slice();
  for (let i = res.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [res[i], res[j]] = [res[j], res[i]];
  }
  return res;
}
let MB = 1024 ** 2;
let GB = 1024 ** 3;
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  else if (bytes < MB) return `${(bytes / 1024).toFixed(2)} KB`;
  else if (bytes < GB) return `${(bytes / MB).toFixed(2)} MB`;
  else return `${(bytes / GB).toFixed(2)} GB`;
}
let sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let docEl = document.documentElement;
let getEl = (id) => document.getElementById(id);
let newEl = (tag) => document.createElement(tag);
// 本次图库创建的对象 URL：不逐张回收（内存吃紧时浏览器可能要重新解码，
// 回收了就会变裂图），换图库时在 resetLibrary 里统一回收。
let objURLs = [];
function blobURL(blob) {
  let url = URL.createObjectURL(blob);
  objURLs.push(url);
  return url;
}
// 统一的轻提示，复用底部提示条，避免用 alert 打断操作
let notifyTimer;
function notify(text) {
  clearTimeout(loadbarTimer);
  clearTimeout(notifyTimer);
  loadtext.innerText = text;
  loadbar.classList.add("show");
  notifyTimer = setTimeout(() => loadbar.classList.remove("show"), 4500);
}
// #region elIds
let aspectratio = getEl("aspectratio");
let colcountinput = getEl("colcountinput");
let cover = getEl("cover");
let cursorplace = getEl("cursorplace");
let dirtree = getEl("dirtree");
let filtborder = getEl("filtborder");
let filtmono = getEl("filtmono");
let hint = getEl("hint");
let hintopen = getEl("hintopen");
let hinthelp = getEl("hinthelp");
let hintnotice = getEl("hintnotice");
let dirinput = getEl("dirinput");
let imgbox = getEl("imgbox");
let indicator = getEl("indicator");
let jumpTo = getEl("jumpTo");
let loadall = getEl("loadall");
let loadedcount = getEl("loadedcount");
let minheightinput = getEl("minheightinput");
let nextimg = getEl("nextimg");
let order = getEl("order");
let pause = getEl("pause");
let perload = getEl("perload");
let previmg = getEl("previmg");
let resort = getEl("resort");
let revert = getEl("revert");
let showcount = getEl("showcount");
let sidebar = getEl("sidebar");
let sidebtn = getEl("sidebtn");
let sortby = getEl("sortby");
let subdirs = getEl("subdirs");
let toend = getEl("toend");
let totalcount = getEl("totalcount");
let totop = getEl("totop");
let treebar = getEl("treebar");
let treebtn = getEl("treebtn");
let openbtn = getEl("openbtn");
let openbtn2 = getEl("openbtn2");
let themeauto = getEl("themeauto");
let themedark = getEl("themedark");
let themelight = getEl("themelight");
let thememodes = getEl("thememodes");
let modeauto = getEl("modeauto");
let modedark = getEl("modedark");
let modelight = getEl("modelight");
let fsbtn = getEl("fsbtn");
let hoverinfo = getEl("hoverinfo");
let ratiopresets = getEl("ratiopresets");
let filtstat = getEl("filtstat");
let loadbar = getEl("loadbar");
let loadtext = getEl("loadtext");
let themeMeta = document.querySelector('meta[name="theme-color"]');
let ctxmenu = getEl("ctxmenu");
let help = getEl("help");
let helpbtn = getEl("helpbtn");
let helpclose = getEl("helpclose");
let sideclose = getEl("sideclose");
let toolbar = getEl("toolbar");
let treeclose = getEl("treeclose");
let toolbarTimer;
// #endregion
let zoom;
let flextype;
let currdir;
let minCol;
let minR, maxR;
let held = false;
totalcount.value = 0;
loadedcount.value = 0;
showcount.value = 0;
let dircount = 0;
let loadingAll = 0;
let libGen = 0; // 图库代数：换文件夹时 +1，用来作废旧的加载回调
let hoverInfo = true; // 鼠标悬停时是否显示图片详情（默认开，可在设置里关）
let loading = 0;
let imgcols = [];
let marks = [];
let randOrder = []; // 随机顺序缓存（图片路径），普通重排时复用
let marksInOrder = 0; // 随机模式下目录标记按加载顺序插入
let allData = new Map();
let toLoad = new Queue();
let visImgs = new Set();
let configs = [
  "colgap",
  "rowgap",
  "imgradius",
  "imgborder",
  "colcount",
  "minheight",
];
let enums = {
  colflex: "colflex",
  rowflex: "rowflex",
  default: "default",
  name: "name",
  date: "date",
  size: "size",
  asc: "asc",
  desc: "desc",
  random: "random",
};
let imgObs = new IntersectionObserver((es) => {
  es.forEach((e) => {
    if (e.isIntersecting) visImgs.add(e.target.index);
    else visImgs.delete(e.target.index);
  });
});
let dirObs = new IntersectionObserver((es) => {
  es.forEach((e) => {
    if (e.isIntersecting) {
      currdir?.classList.remove("active");
      currdir?.classList.add("visited");
      currdir = getEl("li" + e.target.index);
      currdir.classList.add("active");
    }
  });
});
function initSort() {
  ["sortby", "order", "perload"].forEach((id) => {
    let store = localStorage.getItem(id);
    let select = getEl(id);
    if (store) select.value = store;
    // 这个项目默认就是「随机顺序」：没存过偏好的新用户直接随机
    else if (id === "sortby") select.value = enums.random;
    select.onchange = (e) => {
      localStorage.setItem(id, e.target.value);
      if (id === "perload" || totalcount.value === 0) return;
      // 改排序/顺序立即重排，不必再手动点“重排”；切到随机时重新洗牌
      if (id === "sortby") reshuffle();
      reflow();
    };
  });
}
function initFilt() {
  ["filtmono", "filtborder", "revert"].forEach((id) => {
    let store = localStorage.getItem(id);
    let button = getEl(id);
    button.active = store === "true";
    if (button.active) button.classList.add("active");
    button.onclick = (e) => {
      let button = e.target;
      button.classList.toggle("active");
      button.active = button.classList.contains("active");
      localStorage.setItem(button.id, button.active);
      syncRevert();
      updateFilterStat();
      if (!filtmono.active && !filtborder.active && revert.active) return;
      reflow();
    };
  });
  syncRevert();
  updateFilterStat();
}
// 是否连同子文件夹一起读入：默认包含，关掉只读选中的这一层
let subDirs = true;
function syncSubDirs() {
  subdirs.classList.toggle("active", subDirs);
  subdirs.innerText = subDirs ? "包含子文件夹" : "仅当前文件夹";
}
function initSubDirs() {
  subDirs = localStorage.getItem("subdirs") !== "false";
  syncSubDirs();
  subdirs.onclick = () => {
    subDirs = !subDirs;
    localStorage.setItem("subdirs", String(subDirs));
    syncSubDirs();
  };
}
// 悬停显示图片详情：设置里的开关，默认开
function initHoverInfo() {
  hoverinfo.active = localStorage.getItem("hoverinfo") !== "false";
  hoverinfo.classList.toggle("active", hoverinfo.active);
  hoverInfo = hoverinfo.active;
  docEl.classList.toggle("nohoverinfo", !hoverInfo);
  hoverinfo.onclick = () => {
    hoverinfo.active = !hoverinfo.active;
    hoverinfo.classList.toggle("active", hoverinfo.active);
    hoverInfo = hoverinfo.active;
    localStorage.setItem("hoverinfo", String(hoverInfo));
    docEl.classList.toggle("nohoverinfo", !hoverInfo);
    // 关掉时清掉已生成的详情条并复位标记，重新打开才能再生成
    imgbox.querySelectorAll(".info").forEach((el) => el.remove());
    imgbox.querySelectorAll(".wrap").forEach((w) => (w.hasInfo = 0));
  };
}
function initFlex() {
  let store = localStorage.getItem("flextype");
  flextype = store !== null ? store : enums.colflex;
  getEl(flextype).classList.add("active");
  imgbox.className = flextype;
  ["colflex", "rowflex"].forEach((id, i, arr) => {
    let el = getEl(id);
    el.onclick = (e) => {
      let button = e.target;
      if (flextype === button.id) return;
      flextype = button.id;
      localStorage.setItem("flextype", flextype);
      imgbox.className = flextype;
      arr.forEach((el) => getEl(el).classList.remove("active"));
      button.classList.add("active");
      reflow();
      upgradeThumbs(); // 排版换了，格子宽度也变了
    };
  });
}
function initConfig(id) {
  let input = getEl(id + "input");
  input.oninput = (e) => (getEl(id).innerText = e.target.value);
  input.onchange = (e) => {
    let val = e.target.value;
    configs[id] = val;
    docEl.style.setProperty("--" + id, val + "px");
    localStorage.setItem(id, val);
    // 列数或行高变了，格子大小跟着变，缩略图可能就不够用了
    if (id === "colcount" || id === "minheight") upgradeThumbs();
  };
  let store = localStorage.getItem(id);
  if (store) input.value = store;
  input.onchange({ target: input });
  input.oninput({ target: input });
}
// 拖入 / 粘贴 走同一套：先拿文件系统句柄，再替换图库
async function loadFromHandles(items) {
  if (
    typeof DataTransferItem === "undefined" ||
    !DataTransferItem.prototype.getAsFileSystemHandle
  ) {
    notify("当前浏览器不支持拖入文件夹，请用「打开」选择，或改用 Chrome / Edge");
    return;
  }
  let handles = [];
  for (let item of items) {
    try {
      handles.push(await item.getAsFileSystemHandle());
    } catch (e) {
      // 个别条目拿不到句柄就跳过，不影响其它
    }
  }
  if (!handles.length) return;
  resetLibrary(); // 拖入 = 打开这个文件夹，替换掉当前图库
  try {
    await handle(handles);
  } catch (e) {
    notify("读取时出错：" + (e?.message || e));
  }
  finishOpen();
}
document.ondrop = async (e) => {
  if (e.dataTransfer.types[0] !== "Files") return;
  e.preventDefault();
  await loadFromHandles([...e.dataTransfer.items]);
};
document.onpaste = async (e) => {
  if (e.clipboardData.types[0] !== "Files") return;
  await loadFromHandles([...e.clipboardData.items]);
};
hint.onclick = (e) => {
  if (e.target.closest?.("button")) return; // 按钮各自处理，别重复触发
  openFolder();
};
// ---- 兼容模式：<input type="file" webkitdirectory> ----
// 用于缺少 File System Access API 的浏览器（Firefox / Safari），
// 以及将页面作为本地文件直接打开的情况，得到的是带 webkitRelativePath 的文件列表。
let pickerBlocked = false; // 系统选择器被拦截过一次后，本次会话直接使用兼容模式
// 将文件列表还原成目录树后交给 handle()，使排序、目录树、随机顺序与跳转
// 与原生路径保持一致。
function fileListEntries(files) {
  let mkdir = (name) => ({ name, kind: "directory", kids: new Map(), order: [] });
  let root = mkdir("");
  for (let file of files) {
    if (!file.type?.match(/image.*/)) continue;
    // webkitRelativePath 形如「选中的文件夹/子目录/图片.jpg」。
    // 个别浏览器（如移动端）会忽略 webkitdirectory，此时该字段为空，
    // 这些文件就直接作为顶层条目，不至于一张都读不出来。
    let parts = (file.webkitRelativePath || "").split("/").filter(Boolean);
    if (parts.length) parts.shift(); // 去掉最外层那个被选中的文件夹本身
    if (!subDirs && parts.length > 1) continue; // 只读当前层：子目录里的文件跳过
    let name = parts.pop() || file.name;
    let dir = root;
    for (let seg of parts) {
      if (!dir.kids.has(seg)) {
        let kid = mkdir(seg);
        dir.kids.set(seg, kid);
        dir.order.push(kid);
      }
      dir = dir.kids.get(seg);
    }
    dir.order.push({ name, kind: "file", file });
  }
  // 只包出 handle() 需要的那点接口：kind / name / values() / getFile()
  let wrap = (node) => ({
    kind: node.kind,
    name: node.name,
    values: () =>
      (async function* () {
        for (let kid of node.order) yield wrap(kid);
      })(),
    getFile: async () => node.file,
  });
  return root.order.map(wrap);
}
function openFolderCompat() {
  if (!("webkitdirectory" in dirinput)) {
    notify("当前浏览器无法读取文件夹，请使用桌面版 Chrome / Edge");
    return;
  }
  dirinput.value = ""; // 允许连续选同一个文件夹
  dirinput.click();
}
dirinput.onchange = async () => {
  let files = [...dirinput.files];
  if (!files.length) return;
  resetLibrary();
  try {
    await handle(fileListEntries(files));
  } catch (e) {
    notify("读取文件夹时出错：" + (e?.message || e));
  }
  finishOpen();
};
// 打开完成后的统一收尾，按钮、拖入、粘贴与兼容模式共用
function finishOpen() {
  if (!totalcount.value) {
    notify(
      subDirs
        ? "这个文件夹里没有找到图片"
        : "当前这一层没有图片，可在设置里改为包含子文件夹"
    );
    return; // 空文件夹：保留首屏，便于重新选择
  }
  hint.remove();
  reflow();
  showToolbar(4000);
}
// 首屏落地页：检测浏览器能力并接好按钮。
// 全部不支持时说明原因，避免只看到空白页。
function initHome() {
  let canPick = typeof showDirectoryPicker === "function";
  let canDrop =
    typeof DataTransferItem !== "undefined" &&
    !!DataTransferItem.prototype.getAsFileSystemHandle;
  let canCompat = "webkitdirectory" in dirinput;
  let notice = "";
  if (!canPick && !canCompat && !canDrop) {
    hintopen.disabled = true;
    hintopen.innerText = "浏览器不支持";
    notice = "当前浏览器无法读取文件夹，请改用桌面版 Chrome / Edge。";
  } else {
    if (!canDrop)
      notice = canPick
        ? "当前浏览器不支持拖入文件夹，请点击上方按钮选择。"
        : "已启用兼容模式：点击上方按钮选择文件夹即可浏览。拖出复制等操作需要 Chrome / Edge。";
    hintopen.onclick = () => openFolder();
  }
  hintnotice.innerText = notice;
  hintnotice.hidden = !notice;
  hinthelp.onclick = (e) => {
    e.stopPropagation();
    openHelp(true);
  };
}
// 打开文件夹即替换为所选文件夹的内容，不追加。
// 先清空当前图库的状态，再走与拖入相同的加载路径。
function resetLibrary() {
  // 唤醒还在等队列的旧加载循环，让它自己退出
  toLoad.getters.forEach((rsv) => rsv());
  libGen++; // 让在途图片的 onload 回调作废，避免旧图串进新图库
  allData.clear();
  toLoad = new Queue();
  randOrder = [];
  marks = [];
  imgcols = [];
  visImgs.clear();
  // 本次图库用过的对象 URL 统一回收（不逐张回收，避免内存吃紧时图片重新解码失败变成裂图）
  objURLs.forEach((u) => URL.revokeObjectURL(u));
  objURLs = [];
  showcount.value = 0;
  loadedcount.value = 0;
  totalcount.value = 0;
  dircount = 0;
  loading = 0;
  loadingAll = 0;
  readTick = 0; // 让下一次读取进度立刻显示
  showcount.innerText = "0";
  loadedcount.innerText = "0";
  totalcount.innerText = "0";
  treebtn.hidden = true; // 新文件夹可能没有子目录
  minCol = undefined; // 网格要等 reflow 重建，期间滚动/缩放窗口不该往里塞图
  clearTree();
  imgbox.replaceChildren();
  setPanel(treebar, false);
  if (cover.classList.contains("show")) hideCover();
  updateLoadBar();
}
// 清空目录树（保留那个 <ul> 容器）
function clearTree() {
  dirtree.children[0].replaceChildren();
}
// 读取大目录时给个进度，否则整棵树走完之前界面毫无动静，看着像卡死。
// 限流 150ms，不至于每张图都写一次 DOM。
let readTick = 0;
function showReading() {
  let now = Date.now();
  if (now - readTick < 150) return;
  readTick = now;
  clearTimeout(loadbarTimer);
  clearTimeout(notifyTimer);
  loadtext.innerText =
    "正在读取 " +
    totalcount.value +
    " 张图片" +
    (dircount ? " · " + dircount + " 个文件夹" : "");
  loadbar.classList.add("show");
}
async function handle(items, dir = "", folderUl = dirtree.children[0]) {
  if (dir === "") showReading(); // 顶层开始读时先把提示亮出来
  for await (let item of items) {
    let name = item.name;
    let path = dir + "/" + name;
    if (allData.has(path)) continue;
    if (item.kind === "directory") {
      if (!subDirs) continue; // 只读当前层：子目录直接跳过，目录树也就不会出现
      dircount++;
      let val = totalcount.value,
        index = val + dircount;
      let li = newEl("li");
      li.innerText = name;
      li.id = "li" + index;
      li.index = index;
      folderUl.appendChild(li);
      let ul = newEl("ul");
      folderUl.appendChild(ul);
      toLoad.push(path);
      allData.set(path, index);
      li.pos = allData.size - 1; // 在遍历顺序里的位置，用于「跳到该文件夹」
      treebtn.hidden = false; // 有子目录才显示「目录」按钮
      showReading();
      await handle(item.values(), path, ul);
      if (val === totalcount.value) {
        li.style.display = "none";
        ul.style.display = "none";
      }
    }
    if (item.kind === "file") {
      let file = await item.getFile();
      if (!file.type.match(/image.*/)) continue;
      totalcount.value++;
      file.dir = dir;
      file.path = path;
      file.index = totalcount.value + dircount;
      allData.set(path, { file });
      toLoad.push(path);
      totalcount.innerText = totalcount.value;
      showReading();
    }
  }
  if (dir === "") showToolbar(4000); // 顶层列目录完成后再亮出工具栏
}
function reshuffle() {
  randOrder = shuffle(
    [...allData.keys()].filter((p) => typeof allData.get(p) === "object")
  );
}
function randomize(items) {
  let set = new Set(items);
  let known = new Set(randOrder);
  let queue = randOrder.filter((p) => set.has(p));
  // 缓存里没有的图片（新拖入的文件）洗一次追加到末尾
  let fresh = items.filter(
    (p) => typeof allData.get(p) === "object" && !known.has(p)
  );
  if (fresh.length) randOrder = queue = queue.concat(shuffle(fresh));
  // 图片按随机顺序填回图片位，目录项留在原位，目录树高亮/分界才仍然有效
  let i = 0;
  return items.map((p) => (typeof allData.get(p) === "object" ? queue[i++] : p));
}
function reflow(index = 0) {
  if (!filtmono.active && !filtborder.active && revert.active) return;
  imgbox.querySelectorAll(".mark").forEach((el) => {
    el.remove();
  });
  minCol = imgbox;
  marks = [];
  visImgs.clear();
  imgcols = [];
  if (flextype === enums.colflex) {
    for (let _ of Array(parseInt(colcountinput.value))) {
      let imgcol = newEl("div");
      imgcol.className = "imgcol";
      imgcols.push(imgcol);
      imgcol.onmouseout = addInfo;
    }
  }
  imgbox.replaceChildren(...imgcols);
  loading = 0;
  if (showcount.value > 0) {
    toLoad.getters.forEach((rsv) => rsv());
    toLoad.items = [...allData.keys()];
    showcount.value = 0;
  }
  if (index > 0) toLoad.items = toLoad.items.slice(index);
  let key = sortby.value;
  marksInOrder = key === enums.random ? 1 : 0;
  if (key !== enums.default) {
    // 过滤出图片文件
    const imageItems = toLoad.items.filter((p) => typeof allData.get(p) === "object");

    if (key === enums.random) {
      // 随机排序：只打乱图片，目录项留在原位
      toLoad.items = randomize(toLoad.items);
    } else {
      // 原有排序逻辑
      toLoad.items = imageItems.sort((a, b) => allData.get(a).file[key] - allData.get(b).file[key]);
    }
  }
  
  // 随机排序时忽略顺序设置，其他情况保持原有逻辑
  if (order.value === enums.desc && key !== enums.random) {
    toLoad.items.reverse();
  }
  
  loadNext();
  updateLoadBar();
}
// 网格中显示降采样缩略图。4K 壁纸按原尺寸解码需要九百多万像素，而格子只有几百像素宽，
// 速度慢且占用内存（单张解码约 36MB）。缩略图只生成一次，缓存在 file.thumb。
let thumbJobs = 0;
function thumbWidth() {
  let cols = parseInt(colcountinput.value) || 1;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  // 按设备像素算，并留 25% 余量。列数调少时格子会变得很大，
  // 缩略图不够大就会被浏览器二次放大，线条上会出锯齿。
  let target = Math.round((docEl.clientWidth / cols) * dpr * 1.25);
  return Math.max(640, Math.min(2560, target));
}
// 这张图当前被画到多宽（设备像素）。排版、列数、窗口尺寸都会影响它。
function neededThumbWidth(img) {
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = img.getBoundingClientRect?.().width || 0;
  return Math.max(thumbWidth(), Math.round(w * dpr * 1.05));
}
// 列数、窗口尺寸或排版变化后，屏幕上这些图可能比手里的缩略图还大，
// 浏览器二次放大就会把线条放成锯齿，这里按实际显示尺寸补一遍。
function upgradeThumbs() {
  if (!totalcount.value) return;
  imgbox.querySelectorAll("img").forEach((img) => {
    let file = allData.get(img.path)?.file;
    if (!file) return;
    let need = neededThumbWidth(img);
    if ((file.thumbW || 0) >= need) return;
    let old = file.thumb;
    thumbBlob(file, need).then((blob) => {
      if ((blob || null) === (old || null)) return; // 还是同一份，不用动
      img.isThumb = !!blob;
      img.src = blob ? blobURL(blob) : blobURL(file);
    });
  });
}
async function thumbBlob(file, target = thumbWidth()) {
  // 已经有够大的就直接用；列数来回改时不必重复转码。null = 不需要或生成失败
  if (file.thumb !== undefined && (file.thumbW || 0) >= target) return file.thumb;
  file.thumb = null;
  file.thumbW = target;
  if (typeof createImageBitmap !== "function" || typeof OffscreenCanvas !== "function")
    return null; // 环境不支持就退回原图
  let maxSide = Math.max(file.width || 0, file.height || 0);
  if (!maxSide || maxSide <= target * 1.25) return null; // 本来就不大，直接用原图
  while (thumbJobs >= 4) await sleep(30); // 最多 4 张同时转码，避免一次几十张把 CPU 顶满
  thumbJobs++;
  try {
    let wide = (file.width || 0) >= (file.height || 0);
    // resizeQuality 默认是 low，缩小漫画 / 插画这类线条图时锯齿很明显，这里用 high
    let opts = { resizeQuality: "high" };
    if (wide) opts.resizeWidth = target;
    else opts.resizeHeight = target;
    let bmp = await createImageBitmap(file, opts);
    let canvas = new OffscreenCanvas(bmp.width, bmp.height);
    canvas.getContext("2d").drawImage(bmp, 0, 0);
    bmp.close?.();
    // 0.85 会在平涂的边缘留下杂色，提到 0.92
    file.thumb = await canvas.convertToBlob({ type: "image/webp", quality: 0.92 });
  } catch (e) {
    file.thumb = null;
  }
  thumbJobs--;
  return file.thumb;
}
// 视口下方至少缓冲两屏半的内容（占位也算），并把同时在途的解码数量限制住
function bufferTarget() {
  return Math.round(docEl.clientHeight * 2.5);
}
function maxInflight() {
  return Math.max(6, Math.round((parseInt(perload.value) || 25) * 1.2));
}
async function loadNext() {
  if (!minCol) return; // 还没建过网格：首屏时滚动或缩放窗口会走到这里
  if (loading >= maxInflight()) return;
  if (!loadingAll) {
    let below = minCol.scrollHeight - (docEl.scrollTop + docEl.clientHeight);
    if (below > bufferTarget()) return;
  }
  let gen = libGen; // 记下当前图库代数
  for (let _ of Array(parseInt(perload.value))) {
    let path = await toLoad.shift();
    if (!path) return;
    if (gen !== libGen) return; // 期间换过文件夹，这一轮作废
    let data = allData.get(path);
    if (typeof data === "number") {
      let mark = newEl("div");
      mark.className = "mark"; // 让 reflow 能清理上一轮残留的目录标记
      mark.index = data;
      dirObs.observe(mark);
      marks.push(mark);
      continue;
    }
    let file = data.file;
    let img = data.img;
    let [w, h] = [file.width, file.height];
    // 渐进占位需要尺寸；宽高比过滤也需要尺寸
    let progressive =
      flextype === enums.colflex && !filtmono.active && !filtborder.active;
    if ((!w || !h) && (maxR || progressive)) {
      let got = await getWH(file);
      [w, h] = got;
      [file.width, file.height] = [w, h];
      if (got[2]) img = data.img = got[2];
    }
    if (maxR && (h * minR > w + 2 || h * maxR < w - 2)) continue;
    // 随机模式：这一批目录标记挂在流里紧随其后的这张图上
    let pend = marksInOrder ? marks.splice(0) : null;
    let wrap = data.wrap;
    if (wrap) {
      loadImg(wrap, pend);
      continue;
    }

    // ---- 渐进路径：先按正确宽高比占位，解码完成后再淡入 ----
    if (progressive && w && h) {
      img = img || new Image();
      data.img = img;
      wrap = newEl("div");
      wrap.className = "wrap pending";
      wrap.ratio = w / h;
      wrap.style.aspectRatio = w + " / " + h;
      wrap.appendChild(img);
      data.wrap = wrap;
      img.index = file.index;
      img.alt = file.name;
      img.path = file.path;
      loadImg(wrap, pend);
      let onImg = async () => {
        if (gen !== libGen) return; // 换过文件夹：丢弃旧图回调
        try {
          await img.decode?.(); // 先解码完再让它可见，避免滚动时卡一下
        } catch (e) {}
        wrap.classList.remove("pending");
        loadedcount.innerText = loadedcount.value++ + 1;
        loading--;
        updateLoadBar();
        loadNext();
      };
      if (img.complete && img.naturalWidth) {
        onImg(); // 尺寸是从已解码的图片里拿到的，直接用
      } else {
        loading++;
        img.onload = onImg;
        img.onerror = onImg;
        updateLoadBar();
        // 用降采样缩略图显示（没有小图就直接用原图）
        thumbBlob(file).then((blob) => {
          if (gen !== libGen) return;
          if (blob) {
            img.isThumb = true;
            img.src = blobURL(blob);
          } else {
            img.isThumb = false;
            img.src = blobURL(file);
          }
        });
      }
      continue;
    }

    // ---- 原路径：图片解码完成后再插入（滤镜模式需要图片先就绪）----
    let onloaded = () => {
      if (gen !== libGen) return; // 换过文件夹：丢弃旧图回调
      loadedcount.innerText = loadedcount.value++ + 1;
      let wrap = newEl("div");
      wrap.className = "wrap";
      wrap.appendChild(img);
      data.wrap = wrap;
      loadImg(wrap, pend);
      loading--;
      updateLoadBar();
      loadNext();
    };
    if (data.img) {
      img = data.img;
      onloaded();
    } else {
      img = new Image();
      data.img = img;
      loading++;
      img.onload = onloaded;
      img.onerror = onloaded;
      img.src = blobURL(file);
      updateLoadBar();
    }
    img.index = file.index;
    img.alt = file.name;
    img.path = file.path;
  }
  setTimeout(loadNext, 0);
}
// 底部那条很轻的加载提示：加载中显示进度，全部加载完短暂提示后自动消失
let loadbarTimer;
function updateLoadBar() {
  updateFilterStat(); // 设置面板里的筛选状态与这里同步刷新
  let busy = loading > 0 || (loadingAll && toLoad.items.length > 0);
  if (busy) {
    loadtext.innerText = "加载中 " + showcount.value + " / " + totalcount.value;
    loadbar.classList.add("show");
    clearTimeout(loadbarTimer);
    return;
  }
  if (totalcount.value > 0 && !toLoad.items.length) {
    loadtext.innerText = "已全部加载 " + totalcount.value + " 张";
    loadbar.classList.add("show");
    clearTimeout(loadbarTimer);
    loadbarTimer = setTimeout(() => loadbar.classList.remove("show"), 1600);
    return;
  }
  clearTimeout(loadbarTimer);
  loadbar.classList.remove("show");
}
function addInfo(e) {
  if (!hoverInfo) return; // 设置里关掉了悬停详情
  let img = e.relatedTarget;
  if (img?.tagName !== "IMG") return;
  let wrap = img.parentElement;
  if (wrap.hasInfo) return;
  let data = allData.get(img.path);
  if (!data || !data.file) return; // 换过图库后悬停在旧图上：直接忽略
  let file = data.file;
  let w = file.width || img.naturalWidth,
    h = file.height || img.naturalHeight;
  let dim = w && h ? w + "×" + h : "尺寸未知";
  let pad = (n) => String(n).padStart(2, "0");
  let date = file.lastModifiedDate || new Date(file.lastModified || 0);
  let when =
    date && !isNaN(date.getTime())
      ? date.getFullYear() +
        "-" +
        pad(date.getMonth() + 1) +
        "-" +
        pad(date.getDate()) +
        " " +
        pad(date.getHours()) +
        ":" +
        pad(date.getMinutes())
      : "";
  // 目录太长就从左边省略，完整值放在 title 里
  let dir = file.dir || "";
  let shortDir = dir.length > 30 ? "…" + dir.slice(-29) : dir;
  let bar = newEl("div");
  bar.classList.add("info");
  let meta = newEl("div");
  meta.className = "info-meta";
  meta.innerText = dim + " · " + (formatSize(file.size) || "") + (when ? " · " + when : "");
  meta.title = dim + " · " + formatSize(file.size) + (when ? " · " + when : "");
  let name = newEl("div");
  name.className = "info-name";
  name.innerText = file.name;
  name.title = file.name;
  bar.appendChild(meta);
  bar.appendChild(name); // 文件名单独一行、加粗，长名字省略号截断
  if (shortDir) {
    let dirLine = newEl("div");
    dirLine.className = "info-dir";
    dirLine.innerText = shortDir;
    dirLine.title = dir;
    bar.appendChild(dirLine);
  }
  wrap.appendChild(bar);
  wrap.hasInfo = 1;
}
function loadImg(wrap, pend) {
  let img = wrap.children[0];
  if (
    ((filtmono.active && isMono(img)) ||
      (filtborder.active && isMonoBorder(img))) ^ revert.active
  ) {
    if (pend?.length) marks.unshift(...pend); // 过滤掉的图片交给下一张
    return;
  }
  imgObs.observe(wrap);
  // 只清掉上一轮布局留下的 flex 尺寸，保留占位用的 aspect-ratio
  wrap.style.flexBasis = "";
  wrap.style.flexGrow = "";
  showcount.innerText = showcount.value++ + 1;
  wrap.id = "img" + showcount.value;
  wrap.index = showcount.value;
  // 随机模式下目录标记按加载顺序插入，其余模式按文件序号插入
  if (marksInOrder) (pend || []).forEach((mark) => wrap.appendChild(mark));
  else if (img.index > marks[0]?.index) wrap.appendChild(marks.shift());
  if (flextype === enums.colflex) {
    minCol = imgcols.reduce((prev, curr) =>
      prev.offsetHeight <= curr.offsetHeight ? prev : curr
    );
    minCol.appendChild(wrap);
  } else {
    resize(wrap);
    imgbox.appendChild(wrap);
  }
}
function resize(wrap) {
  let img = wrap.children[0],
    ratio = wrap.ratio || img.naturalWidth / img.naturalHeight;
  if (!ratio || !isFinite(ratio)) ratio = 1; // 万一取不到尺寸也别写出非法值
  wrap.style.flexBasis = ratio * minheightinput.value + "px";
  wrap.style.flexGrow = ratio;
}
function isMonoBorder(img) {
  if (img.isMonoBorder !== undefined) return img.isMonoBorder;
  let { ctx, width, height } = getThumb(img);
  let d = (x, y, w, h) => ctx.getImageData(x, y, w, h).data;
  let wasd = [
    ...d(0, 0, 1, height),
    ...d(0, 0, width, 1),
    ...d(width - 1, 0, 1, height),
    ...d(0, height - 1, width, 1),
  ];
  let bns = [];
  for (let i of range(0, wasd.length, 4))
    bns.push(Math.round((wasd[i] + wasd[i + 1] + wasd[i + 2]) / 3 / 4));
  let counts = bns.reduce(
    (acc, curr) => acc.set(curr, (acc.get(curr) || 0) + 1),
    new Map()
  );
  if (Math.max(...counts.values()) > 0.0625 * wasd.length) {
    img.isMonoBorder = true;
    return true;
  }
  img.isMonoBorder = false;
  return false;
}
function isMono(img) {
  if (img.isMono !== undefined) return img.isMono;
  let { ctx, width, height } = getThumb(img);
  let pixels = width * height,
    data = ctx.getImageData(0, 0, width, height).data;
  for (let area of range(0, 4)) {
    let r = 0,
      g = 0,
      b = 0;
    for (let i of range(area * pixels, (area + 1) * pixels, 4)) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }
    if (Math.max(r, g, b) - Math.min(r, g, b) > pixels) {
      img.isMono = false;
      return false;
    }
  }
  img.isMono = true;
  return true;
}
function getThumb(img, l = 100) {
  let data = allData.get(img.path);
  if (l === 100) {
    let thumb = data.thumb;
    if (thumb) return thumb;
  }
  let canvas = newEl("canvas"),
    ctx = canvas.getContext("2d", { willReadFrequently: true }),
    wh = [img.naturalWidth, img.naturalHeight],
    m = Math.max(...wh),
    r = l / m;
  wh = wh.map((n) => Math.round(n * r));
  [canvas.width, canvas.height] = wh;
  ctx.drawImage(img, 0, 0, ...wh);
  let thumb = { canvas, ctx, width: wh[0], height: wh[1] };
  if (l === 100) data.thumb = thumb;
  return thumb;
}
function toggleZoom(e) {
  let oriimg = e.target;
  if (oriimg.className === "info") {
    if (!getSelection().isCollapsed) return;
    oriimg = oriimg.parentElement.children[0];
  } else if (oriimg.tagName !== "IMG") return;
  let rep = new Image();
  rep.id = "rep";
  rep.width = oriimg.naturalWidth;
  rep.height = oriimg.naturalHeight;
  oriimg.replaceWith(rep);
  zoom = oriimg;
  zoom.className = "zoom";
  let file = allData.get(zoom.path)?.file;
  // 用文件头里的原始尺寸算缩放：网格里可能是缩略图，naturalWidth 不是原图尺寸
  fitZoom(file?.width, file?.height);
  zoom.style.transform = `translateZ(0)`;
  cover.appendChild(zoom);
  cover.classList.add("show");
  toolbar.classList.remove("show"); // 放大时让出画面
  cover.focus();
  // 网格中显示的是缩略图，放大时换回原图以看清细节
  if (zoom.isThumb && file) {
    zoom.isThumb = false;
    let url = blobURL(file);
    let full = new Image();
    full.onload = () => {
      zoom.src = url; // 原始尺寸就位后再切，避免中间闪一下空白
      fitZoom(file.width, file.height);
    };
    full.onerror = () => URL.revokeObjectURL(url);
    full.src = url;
  }
}
// 按给定（或当前）尺寸算出居中位置与初始缩放
function fitZoom(w, h) {
  w = w || zoom.naturalWidth || zoom.width;
  h = h || zoom.naturalHeight || zoom.height;
  zoom.width = w;
  zoom.height = h;
  zoom.style.top = (docEl.clientHeight - h) / 2 + "px";
  zoom.style.left = (docEl.clientWidth - w) / 2 + "px";
  zoom.scale = (
    Math.min(docEl.clientHeight / h, docEl.clientWidth / w, 1).toFixed(2) - 0.01
  ).toString();
  zoom.style.scale = zoom.scale;
  zoom.minscale = zoom.scale;
}
function zoomImg(e) {
  e.preventDefault();
  if (
    (e.deltaY < 0 && zoom.scale > 4) ||
    (e.deltaY > 0 && zoom.scale < zoom.minscale)
  )
    return;
  zoom.scale *= e.deltaY < 0 ? 1.25 : 0.8;
  moveImg(e);
}
function moveImg(e) {
  let t,
    l,
    ih = zoom.clientHeight * zoom.scale,
    iw = zoom.clientWidth * zoom.scale,
    dh = docEl.clientHeight,
    dw = docEl.clientWidth;
  if (ih > dh) {
    t = -(ih - dh + 0.2 * dh) * (e.clientY / dh - 0.5);
  } else t = 0;
  if (iw > dw) {
    l = -(iw - dw + 0.2 * dw) * (e.clientX / dw - 0.5);
  } else l = 0;
  zoom.style.scale = zoom.scale;
  zoom.style.translate = `${l}px ${t}px 0px`;
}
function hideCover() {
  if (!zoom) {
    cover.classList.remove("show");
    return;
  }
  zoom.removeAttribute("style");
  zoom.removeAttribute("class");
  getEl("rep").replaceWith(zoom);
  cover.classList.remove("show");
  // 换回缩略图，避免原图解码结果一直占着内存（缩略图就绪后再切，看不出差别）
  let file = allData.get(zoom.path)?.file;
  if (file?.thumb && !zoom.isThumb) {
    let url = blobURL(file.thumb);
    let small = new Image();
    small.onload = () => {
      zoom.src = url;
      zoom.isThumb = true;
    };
    small.onerror = () => URL.revokeObjectURL(url);
    small.src = url;
  }
}
function copyImg(e) {
  let img = e.target;
  if (img.tagName !== "IMG") return;
  let file = allData.get(img.path)?.file;
  let draw = (src) => {
    let canvas = newEl("canvas"),
      ctx = canvas.getContext("2d", { willReadFrequently: true }),
      m = Math.max(src.naturalWidth, src.naturalHeight),
      r = 1920 / m;
    [canvas.width, canvas.height] = [
      Math.round(src.naturalWidth * r),
      Math.round(src.naturalHeight * r),
    ];
    ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) =>
      navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
    );
  };
  if (img.isThumb && file) {
    // 网格里是缩略图，复制要拿原图，否则会糊
    let full = new Image();
    full.onload = () => draw(full);
    full.src = blobURL(file);
  } else draw(img);
  e.preventDefault();
}
function naviZoom(e) {
  e.stopPropagation();
  let index = getEl("rep").parentElement.index;
  index +=
    e.target === nextimg || e.key === "ArrowRight" || e.key === "d" ? 1 : -1;
  let wrap = getEl("img" + index);
  if (!wrap) return;
  if (!visImgs.has(index)) wrap.scrollIntoView();
  hideCover();
  toggleZoom({ target: wrap.children[0] });
}
async function getWH(file) {
  if (file.size < 30) return [0, 0];
  let view = new DataView(await file.slice(0, 30).arrayBuffer());
  let sign = view.getUint32();
  if (sign === 0x89504e47) return [view.getUint32(16), view.getUint32(20)];
  else if (sign === 0x47494638)
    return [view.getUint16(6, true), view.getUint16(8, true)];
  else if (sign >>> 16 === 0x424d)
    return [view.getInt32(18, true), view.getInt32(22, true)];
  else if (sign === 0x52494646) {
    let vp8 = view.getUint32(12);
    if (vp8 === 0x56503820)
      return [view.getUint16(26, true), view.getUint16(28, true)];
    else if (vp8 === 0x56503858)
      return [view.getUint24(24, true) + 1, view.getUint24(27, true) + 1];
    else if (vp8 === 0x5650384c) {
      return [
        (view.getUint16(21, true) & 0x3fff) + 1,
        ((view.getUint24(22, true) >>> 6) & 0x3fff) + 1,
      ];
    }
  } else if (sign >>> 8 === 0xffd8ff) {
    view = new DataView(await file.slice(0, 128 * 1024).arrayBuffer());
    let marker;
    let offset = 2;
    while (offset < view.byteLength) {
      marker = view.getUint16(offset);
      offset += 2;
      if (marker === 0xffc0 || marker === 0xffc2)
        return [view.getUint16(offset + 5), view.getUint16(offset + 3)];
      offset += view.getUint16(offset);
    }
  }
  let img = await new Promise((resolve) => {
    let img = new Image();
    let onloaded = () => resolve(img); // URL 交给 objURLs 统一管理，不在这里回收
    img.onload = onloaded;
    img.onerror = onloaded;
    img.src = blobURL(file);
  });
  return [img.naturalWidth, img.naturalHeight, img];
}
function parseRatio() {
  let raw = aspectratio.value.trim();
  if (raw === "") {
    // 清空即不筛选。空字符串曾被解析为比例 0，回车后所有图片都会被筛掉
    minR = maxR = undefined;
    reflow();
    return;
  }
  let arr = [
    [" ", ""],
    ["—", "-"],
    ["--", "-"],
    ["：", ":"],
  ]
    .reduce((t, r) => t.replaceAll(...r), raw)
    .split("-")
    .map((t, i) =>
      t === "" && i === 1
        ? Infinity
        : t
            .split(":")
            .map(Number)
            .reduce((p, c) => p / c)
    )
    .sort((a, b) => a - b); // 数值排序，避免字典序把区间两端排反
  [minR, maxR] = arr.concat(arr);
  reflow();
}
// 常用比例快选
function syncRatioChips() {
  let v = aspectratio.value.trim();
  ratiopresets.querySelectorAll("button").forEach((b) => {
    b.classList.toggle("active", !!b.dataset.ratio && b.dataset.ratio === v);
  });
}
function initRatios() {
  ratiopresets.querySelectorAll("button").forEach((btn) => {
    btn.onclick = () => {
      if (btn.dataset.clear) {
        aspectratio.value = "";
        minR = maxR = undefined;
        reflow();
      } else {
        aspectratio.value = btn.dataset.ratio;
        parseRatio(); // 内部会 reflow
      }
      syncRatioChips();
      updateFilterStat();
      showToolbar();
    };
  });
  aspectratio.addEventListener("input", syncRatioChips);
  syncRatioChips();
}
// 筛选状态：判读进度与命中数量。彩色照片开启「黑白漫画」通常为 0 命中
function updateFilterStat() {
  let on = filtmono.active || filtborder.active;
  if (!on) {
    filtstat.innerText = "未启用筛选";
    return;
  }
  let busy = loading > 0 || toLoad.items.length > 0;
  let hit = showcount.value;
  let all = totalcount.value;
  let rev = revert.active ? "（已反转）" : "";
  if (busy) {
    filtstat.innerText =
      "筛选中" +
      rev +
      "：已判读 " +
      loadedcount.value +
      " / " +
      all +
      " 张，命中 " +
      hit +
      " 张";
  } else if (!hit) {
    filtstat.innerText =
      "已判读 " + all + " 张，没有符合条件的图片（点上面的按钮取消筛选）";
  } else {
    filtstat.innerText = "共 " + all + " 张，命中 " + hit + " 张" + rev;
  }
}
// 没开任何筛选时「反转结果」是无效的，弱化显示避免误解
function syncRevert() {
  revert.classList.toggle("muted", !filtmono.active && !filtborder.active);
}
// #region 界面控件：工具栏 / 面板 / 右键菜单 / 快捷键
function panelsOpen() {
  return [sidebar, treebar, help, ctxmenu].some((el) =>
    el.classList.contains("show")
  );
}
function hideToolbar() {
  // 鼠标还停在工具栏上或面板开着，就先别收
  if (toolbar.matches(":hover") || panelsOpen()) {
    toolbarTimer = setTimeout(hideToolbar, 1200);
    return;
  }
  toolbar.classList.remove("show");
}
function showToolbar(ms = 2800) {
  if (cover.classList.contains("show") || totalcount.value === 0) return;
  if (!toolbar.classList.contains("show")) toolbar.classList.add("show");
  clearTimeout(toolbarTimer);
  toolbarTimer = setTimeout(hideToolbar, ms);
}
function setPanel(el, on) {
  el.classList.toggle("show", on);
  let btn = el === sidebar ? sidebtn : el === treebar ? treebtn : null;
  if (btn) btn.setAttribute("aria-pressed", on ? "true" : "false");
  if (on) showToolbar();
}
function togglePanel(el) {
  setPanel(el, !el.classList.contains("show"));
}
function openHelp(on) {
  help.classList.toggle("show", on);
  if (on) showToolbar();
}
function closeTop() {
  if (ctxmenu.classList.contains("show")) return closeCtx();
  if (help.classList.contains("show")) return openHelp(false);
  if (cover.classList.contains("show")) return hideCover();
  if (treebar.classList.contains("show")) return setPanel(treebar, false);
  if (sidebar.classList.contains("show")) return setPanel(sidebar, false);
}
function setSort(key) {
  if (totalcount.value === 0) return;
  sortby.value = key;
  localStorage.setItem("sortby", key);
  reshuffle();
  reflow();
  showToolbar();
}
function jumpToDir(li) {
  if (li.pos === undefined) return;
  if (sortby.value !== enums.default && sortby.value !== enums.random) {
    // 日期/大小排序下图片位置全变，先切回默认顺序再跳
    sortby.value = enums.default;
    localStorage.setItem("sortby", enums.default);
  }
  setPanel(treebar, false);
  reflow(li.pos);
  docEl.scrollTo(0, 0);
}
function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else {
    let p = docEl.requestFullscreen?.();
    p?.catch?.(() => {});
  }
  showToolbar(2500);
}
function syncFullscreenUI() {
  let on = !!document.fullscreenElement;
  docEl.classList.toggle("fs", on);
  if (!on) {
    clearTimeout(idleTimer); // 退出全屏时取消待触发的空闲计时
    docEl.classList.remove("idle");
  }
  fsbtn.title = (on ? "退出全屏" : "全屏") + "（F）";
  fsbtn.setAttribute("aria-pressed", on ? "true" : "false");
}
document.addEventListener("fullscreenchange", syncFullscreenUI);
function menuRow(label, hint, fn, active) {
  let btn = newEl("button");
  btn.type = "button";
  if (active) btn.dataset.active = "true";
  let text = newEl("span");
  text.innerText = label;
  btn.appendChild(text);
  if (hint) {
    let kbd = newEl("kbd");
    kbd.innerText = hint;
    btn.appendChild(kbd);
  }
  btn.onclick = () => {
    closeCtx();
    fn();
  };
  return btn;
}
function menuSep() {
  let sep = newEl("i");
  sep.className = "sep";
  return sep;
}
// 统一的菜单面板：右键菜单与顶栏下拉共用（同一套圆角/毛玻璃外观）
function openMenu(x, y, rows, forId) {
  ctxmenu.replaceChildren(...rows);
  ctxmenu.dataset.for = forId || "";
  ctxmenu.style.left = "0px";
  ctxmenu.style.top = "0px";
  ctxmenu.classList.add("show");
  // 贴着光标，超出视口就回退
  let rect = ctxmenu.getBoundingClientRect();
  let vw = docEl.clientWidth,
    vh = docEl.clientHeight;
  ctxmenu.style.left = Math.max(8, Math.min(x, vw - rect.width - 8)) + "px";
  ctxmenu.style.top = Math.max(8, Math.min(y, vh - rect.height - 8)) + "px";
}
function openCtx(x, y) {
  let sorts = [
    [enums.default, "默认顺序"],
    [enums.random, "随机顺序"],
    ["lastModified", "按日期"],
    ["size", "按大小"],
  ];
  let themes = [
    ["auto", "主题：跟随系统"],
    ["light", "主题：浅色"],
    ["dark", "主题：深色"],
  ];
  let rows = [
    menuRow("打开文件夹（替换当前图库）", "O", openFolder),
    menuRow("设置", "S", () => togglePanel(sidebar), sidebar.classList.contains("show")),
    treebtn.hidden
      ? null
      : menuRow("目录", "D", () => togglePanel(treebar), treebar.classList.contains("show")),
    menuSep(),
    ...sorts.map(([key, label]) =>
      menuRow(label, "", () => setSort(key), sortby.value === key)
    ),
    menuSep(),
    menuRow("重排 / 换一批", "R", () => {
      reshuffle();
      reflow();
    }),
    menuRow("回到顶部", "Home", () => docEl.scrollTo(0, 0)),
    menuRow("到底部", "End", () => docEl.scrollTo(0, docEl.scrollHeight)),
    menuRow(
      document.fullscreenElement ? "退出全屏" : "全屏",
      "F",
      toggleFullscreen
    ),
    menuRow("加载全部", "L", () => {
      loadingAll = 1;
      loadNext();
    }),
    menuSep(),
    ...themes.map(([key, label]) =>
      menuRow(label, "", () => setThemeMode(key), themeMode === key)
    ),
    menuRow("帮助", "?", () => openHelp(true)),
  ].filter(Boolean);
  openMenu(x, y, rows, "ctx");
}
// 原生 select 的弹出层由浏览器绘制，圆角/毛玻璃都吃不到，
// 所以把它藏起来，用一个同款外观的下拉按钮代替；select 仍然是取值的唯一真源。
function initSelectMenu(select, label) {
  let btn = newEl("button");
  btn.type = "button";
  btn.className = "tbtn selbtn";
  btn.title = label;
  btn.dataset.for = select.id;
  let text = newEl("span");
  let caret = newEl("i");
  caret.className = "caret";
  btn.appendChild(text);
  btn.appendChild(caret);
  select.hidden = true;
  if (select.parentNode) select.parentNode.insertBefore(btn, select.nextSibling);
  let sync = () => {
    let list = [...select.options];
    let cur = list.filter((o) => o.value === select.value)[0] || list[0];
    text.innerText = cur ? cur.text : "";
  };
  let prev = select.onchange;
  select.onchange = (e) => {
    sync();
    if (prev) prev(e);
  };
  sync();
  btn.onclick = () => {
    // 再次点击同一个按钮则收起
    if (ctxmenu.classList.contains("show") && ctxmenu.dataset.for === select.id)
      return closeCtx();
    let r = btn.getBoundingClientRect();
    let rows = [...select.options].map((o) =>
      menuRow(
        o.text,
        "",
        () => {
          select.value = o.value;
          sync();
          if (select.onchange) select.onchange({ target: select });
        },
        o.value === select.value
      )
    );
    openMenu(r.left, r.bottom + 6, rows, select.id);
  };
}
function closeCtx() {
  ctxmenu.classList.remove("show");
}
// 沉浸式浏览：只在鼠标移到画面顶部时显示工具栏，其余时间保持隐藏
function topBand() {
  return Math.max(72, Math.round(docEl.clientHeight * 0.12));
}
let idleTimer;
function markActive() {
  if (docEl.classList.contains("idle")) docEl.classList.remove("idle");
  clearTimeout(idleTimer);
  // 全屏且鼠标静止时隐藏指针
  if (document.fullscreenElement)
    idleTimer = setTimeout(() => {
      if (document.fullscreenElement) docEl.classList.add("idle");
    }, 2500);
}
document.addEventListener("mousemove", (e) => {
  markActive();
  if (e.clientY <= topBand()) showToolbar();
});
document.addEventListener("contextmenu", (e) => {
  if (e.target.closest("#sidebar, #treebar, #toolbar, #help, #ctxmenu")) return;
  if (!totalcount.value) return;
  e.preventDefault();
  openCtx(e.clientX, e.clientY);
});

// ---- 打开文件夹：换成新文件夹的内容（替换，不追加）----
async function openFolder() {
  // 没有系统文件夹选择器（Firefox / Safari，或本地文件打开被拦截）时使用兼容模式
  if (pickerBlocked || typeof showDirectoryPicker !== "function") {
    openFolderCompat();
    return;
  }
  let dir;
  try {
    // 只申请读权限，本应用不会修改任何文件
    dir = await showDirectoryPicker({ mode: "read", startIn: "pictures" });
  } catch (e) {
    if (e?.name === "AbortError") return; // 用户取消了选择：当前图库保持不变
    // 被浏览器拦截（例如直接打开本地文件）时改用兼容模式，本次会话不再重试
    pickerBlocked = true;
    notify("系统文件夹选择不可用，已切换到兼容模式");
    openFolderCompat();
    return;
  }
  resetLibrary();
  try {
    await handle(dir.values());
  } catch (e) {
    notify("读取文件夹时出错：" + (e?.message || e));
  }
  finishOpen();
}

// ---- 明暗主题：auto（跟随系统）/ light / dark，选择记在本地 ----
let themeMode = localStorage.getItem("theme") || "auto";
function applyTheme(mode) {
  // mode: "auto"（跟系统） | "light" | "dark"
  let dark =
    mode === "dark" ||
    (mode === "auto" && !matchMedia("(prefers-color-scheme: light)").matches);
  // 切换的那一两帧禁用过渡：否则整屏背景逐帧重绘，毛玻璃面板每帧重算模糊 -> 图多就卡
  docEl.classList.add("theming");
  docEl.dataset.theme = dark ? "dark" : "light";
  docEl.dataset.mode = mode;
  themeMeta?.setAttribute("content", dark ? "#000000" : "#f1f3f5");
  let label = { auto: "跟随系统", light: "浅色", dark: "深色" }[mode];
  thememodes.title = "主题：" + label + "（按 T 切换）";
  // 顶栏三格与设置面板三格保持同一状态
  [themeauto, themelight, themedark, modeauto, modelight, modedark].forEach(
    (btn) => {
      let on = btn.id === "theme" + mode || btn.id === "mode" + mode;
      btn.classList.toggle("active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    }
  );
  requestAnimationFrame(() =>
    requestAnimationFrame(() => docEl.classList.remove("theming"))
  );
}
function setThemeMode(mode) {
  themeMode = mode;
  localStorage.setItem("theme", mode);
  applyTheme(mode);
  showToolbar();
}
// T 键：三态循环
function cycleTheme() {
  setThemeMode({ auto: "light", light: "dark", dark: "auto" }[themeMode] || "auto");
}
themeauto.onclick = () => setThemeMode("auto");
themelight.onclick = () => setThemeMode("light");
themedark.onclick = () => setThemeMode("dark");
modeauto.onclick = () => setThemeMode("auto");
modelight.onclick = () => setThemeMode("light");
modedark.onclick = () => setThemeMode("dark");
applyTheme(themeMode);
// 选「跟随系统」时，系统切换主题也跟着换
matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
  if (themeMode === "auto") applyTheme("auto");
});
// 打开文件夹的三个入口
openbtn.onclick = openFolder;
openbtn2.onclick = openFolder;
fsbtn.onclick = toggleFullscreen;
syncFullscreenUI();
// #endregion
initFlex();
initSort();
initFilt();
initRatios();
initHoverInfo();
initSubDirs();
initSelectMenu(sortby, "排序方式");
initSelectMenu(order, "升序 / 降序");
initHome();
configs.forEach(initConfig);
imgbox.onmouseout = addInfo;
imgbox.onmouseenter = addInfo;
cursorplace.onmouseout = addInfo;
cover.onwheel = zoomImg;
previmg.onclick = naviZoom;
nextimg.onclick = naviZoom;
cover.onmousemove = moveImg;
cover.onclick = hideCover;
resort.onclick = () => {
  reshuffle(); // 重排：随机模式下换一批随机顺序
  reflow();
};
// 窗口尺寸变了要重新算缓冲，也要看看手里的缩略图还够不够大
let resizeTimer;
window.onresize = () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    loadNext();
    upgradeThumbs();
  }, 150);
};
imgbox.onclick = toggleZoom;
document.onscroll = loadNext;
document.ondragend = copyImg;
document.ondrag = (e) => e.preventDefault();
document.ondragover = (e) => e.preventDefault();
document.ondragenter = (e) => e.preventDefault();
pause.onclick = () => (loadingAll = 0);
totop.onclick = () => docEl.scrollTo(0, 0);
toend.onclick = () => docEl.scrollTo(0, docEl.scrollHeight);
sidebtn.onclick = () => togglePanel(sidebar);
sideclose.onclick = () => setPanel(sidebar, false);
helpbtn.onclick = () => openHelp(!help.classList.contains("show"));
helpclose.onclick = () => openHelp(false);
help.onclick = (e) => {
  if (e.target === help) openHelp(false);
};
loadall.onclick = () => {
  loadingAll = 1;
  loadNext();
};
aspectratio.onkeydown = (e) => {
  if (e.key === "Enter") {
    parseRatio();
    syncRatioChips();
    updateFilterStat();
  }
};
treebtn.onclick = () => {
  togglePanel(treebar);
  if (treebar.classList.contains("show")) currdir?.scrollIntoView({ block: "center" });
};
treeclose.onclick = () => setPanel(treebar, false);
jumpTo.onkeydown = (e) => {
  if (e.key === "Enter") getEl("img" + parseInt(jumpTo.value)).scrollIntoView();
};
colcountinput.addEventListener("change", () => {
  if (flextype === enums.colflex) reflow();
});
minheightinput.addEventListener("change", () => {
  if (flextype === enums.rowflex)
    requestAnimationFrame(() => {
      imgbox.querySelectorAll(".wrap").forEach(resize);
      loadNext();
    });
});
dirtree.onclick = (e) => {
  let li = e.target.closest("li");
  if (!li) return;
  jumpToDir(li);
  e.stopPropagation();
};
dirtree.onwheel = (e) => {
  if (
    (dirtree.scrollTop === 0 && e.deltaY < 0) ||
    (dirtree.scrollTop + dirtree.clientHeight >= dirtree.scrollHeight &&
      e.deltaY > 0)
  )
    e.preventDefault();
};
document.addEventListener("mousedown", (e) => {
  if (e.button === 0) held = true;
});
document.addEventListener("mouseup", (e) => {
  if (e.button === 3) scrollBy(0, 0.9 * docEl.clientHeight);
  if (e.button === 4) scrollBy(0, -0.9 * docEl.clientHeight);
  if (e.button === 0) {
    held = false;
    indicator.classList.remove("show");
  }
  e.preventDefault();
});
document.addEventListener("scroll", () => {
  if (held) {
    let currIndex = Math.min(...visImgs);
    indicator.innerText = currIndex;
    indicator.classList.add("show");
  }
});
document.addEventListener(
  "click",
  (e) => {
    let t = e.target;
    if (t.closest?.(".selbtn")) return; // 下拉按钮自己管开合
    if (ctxmenu.classList.contains("show") && !ctxmenu.contains(t)) closeCtx();
    [sidebar, treebar].forEach((el) => {
      if (
        el.classList.contains("show") &&
        !el.contains(t) &&
        !t.closest?.("#toolbar")
      )
        setPanel(el, false);
    });
  },
  true
);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeTop();
    return;
  }
  // 正在输入框/下拉里操作时不抢键
  if (e.target.matches?.("input, select, textarea")) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (cover.classList.contains("show")) {
    if (["ArrowLeft", "ArrowRight", "a", "d"].includes(e.key)) naviZoom(e);
    return;
  }
  switch (e.key.toLowerCase()) {
    case "s":
      togglePanel(sidebar);
      break;
    case "d":
      if (!treebtn.hidden) togglePanel(treebar);
      break;
    case "r":
      if (totalcount.value) {
        reshuffle();
        reflow();
        showToolbar();
      }
      break;
    case "l":
      loadingAll = 1;
      loadNext();
      break;
    case "p":
      loadingAll = 0;
      break;
    case "f":
      toggleFullscreen();
      break;
    case "t":
      cycleTheme();
      break;
    case "home":
      docEl.scrollTo(0, 0);
      break;
    case "end":
      docEl.scrollTo(0, docEl.scrollHeight);
      break;
    case "?":
    case "h":
    case "/":
      openHelp(!help.classList.contains("show"));
      break;
    case "f1":
      e.preventDefault(); // F1 是浏览器帮助键，这里接管
      openHelp(!help.classList.contains("show"));
      break;
    case "o":
      openFolder();
      break;
  }
});
