/* =========================================================
   store.js —— 本地照片存储（浏览器 IndexedDB），不用改这里。
   照片以压缩后的图片存在你这台设备的浏览器里，刷新不丢。
   （云端同步以后接 Supabase 时会在这里扩展。）
   ========================================================= */
const Store = (() => {
  let dbp = null;
  function open(){
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open("memoir", 1);
      r.onupgradeneeded = e => {
        const d = e.target.result;
        if (!d.objectStoreNames.contains("photos"))
          d.createObjectStore("photos", { keyPath:"id", autoIncrement:true });
      };
      r.onsuccess = e => res(e.target.result);
      r.onerror   = e => rej(e);
    });
    return dbp;
  }
  async function store(mode){ return (await open()).transaction("photos", mode).objectStore("photos"); }

  async function add(rec){
    const os = await store("readwrite");
    return new Promise((res, rej) => { const r = os.add(rec); r.onsuccess = () => res(r.result); r.onerror = rej; });
  }
  async function all(){
    const os = await store("readonly");
    return new Promise((res, rej) => { const r = os.getAll(); r.onsuccess = () => res(r.result || []); r.onerror = rej; });
  }
  async function del(id){
    const os = await store("readwrite");
    return new Promise((res, rej) => { const r = os.delete(id); r.onsuccess = () => res(); r.onerror = rej; });
  }
  async function update(rec){
    const os = await store("readwrite");
    return new Promise((res, rej) => { const r = os.put(rec); r.onsuccess = () => res(); r.onerror = rej; });
  }
  async function byAlbum(album){ return (await all()).filter(p => p.album === album); }

  return { add, all, del, update, byAlbum };
})();

/* 把图片画到 canvas 并压缩（最长边 1600px），返回 canvas 供下面两个函数复用 */
function shrinkToCanvas(file, maxDim = 1600){
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let w = img.width, h = img.height;
      if (Math.max(w, h) > maxDim){ const s = maxDim / Math.max(w, h); w = Math.round(w*s); h = Math.round(h*s); }
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(c);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}
/* 压缩成 dataURL（本地存储用） */
async function fileToDataURL(file, quality = 0.85){
  const c = await shrinkToCanvas(file);
  return c ? c.toDataURL("image/jpeg", quality) : null;
}
/* 压缩成 Blob（上传云端用） */
async function fileToBlob(file, quality = 0.85){
  const c = await shrinkToCanvas(file);
  if (!c) return null;
  return new Promise(res => c.toBlob(b => res(b), "image/jpeg", quality));
}
