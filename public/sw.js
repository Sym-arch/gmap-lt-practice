/* 旧静的版のService Workerを無効化するキルスイッチ。
   旧版を訪れたことのあるブラウザはこのファイルに更新され、
   キャッシュ削除と登録解除が行われて最新サイトが表示される。 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((c) => c.navigate(c.url));
    })()
  );
});
