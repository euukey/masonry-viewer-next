// 这个 Service Worker 负责两件事：离线可用，以及保证刷新后看到的是最新版本。
//
// 因此预缓存的资源采用「先请求网络，失败再用缓存」：
//   在线时每个请求都会带上条件校验，内容未变时服务器返回 304，几乎不产生流量，
//   但取到的始终是新版本，因此无需按 Ctrl+Shift+R，发布新版本也不必改动缓存名；
//   离线时回退到缓存中的副本，PWA 仍可正常打开。
// 只有需要强制清除所有客户端缓存时，才需要修改 CACHE。
const CACHE = "masonry-viewer-next";
const RESOURCES = [
  "",
  "open-props.min.css",
  "tokens.css",
  "style.css",
  "script.js",
  "icon.svg",
  "favicon.ico",
  "192x192.png",
  "512x512.png",
];
// 预缓存清单中的路径，部署在子路径（如 GitHub Pages）时同样正确
let urls = RESOURCES.map((s) => new URL(self.registration.scope).pathname + s);

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(urls).catch(() => {})) // 个别文件失败不影响安装完成
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

async function freshThenCache(req) {
  let cache = await caches.open(CACHE);
  let hit = await cache.match(req);
  try {
    // no-cache：每次都向服务器校验，未变更时复用浏览器自身的 HTTP 缓存
    let rsp = await fetch(req, { cache: "no-cache" });
    if (!rsp || !rsp.ok) throw new Error("HTTP " + (rsp ? rsp.status : "?"));
    // 内容未变更则不重复写入缓存
    let etag = rsp.headers.get("etag");
    if (!hit || !etag || etag !== hit.headers.get("etag"))
      cache.put(req, rsp.clone());
    return rsp;
  } catch (e) {
    if (hit) return hit; // 断网或服务器出错时回退到缓存
    throw e;
  }
}

self.addEventListener("fetch", (e) => {
  let url = new URL(e.request.url);
  if (
    e.request.method !== "GET" ||
    url.origin !== self.location.origin || // 只处理本站请求
    !urls.includes(url.pathname)
  )
    return;
  e.respondWith(freshThenCache(e.request));
});
