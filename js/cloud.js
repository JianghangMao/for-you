/* =========================================================
   cloud.js —— 云端照片存储（Supabase），不用改这里。
   照片文件存进 Storage 桶，元信息(相册/旁白)存进 photos 表。
   配置在 config.js 的 supabase 里；没配则自动停用，回退到本地。
   ========================================================= */
const Cloud = (() => {
  const cfg = (typeof CONFIG !== "undefined" && CONFIG.supabase) || {};
  const ready = !!(cfg.url && cfg.key && window.supabase && window.supabase.createClient);
  const bucket = cfg.bucket || "photos";
  let client = null;
  if (ready) client = window.supabase.createClient(cfg.url, cfg.key);

  function pub(path){ return client.storage.from(bucket).getPublicUrl(path).data.publicUrl; }

  async function list(album){
    if (!ready) return [];
    const { data, error } = await client.from("photos").select("*").eq("album", album).order("id");
    if (error){ console.warn("[cloud] 读取失败：", error.message); return []; }
    return (data || []).map(r => ({ id:r.id, path:r.path, caption:r.caption || "", place:r.place || "", src:pub(r.path), _src:"cloud" }));
  }
  async function upload(album, blob, caption = "", place = ""){
    const path = `${album}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.jpg`;
    const up = await client.storage.from(bucket).upload(path, blob, { contentType:"image/jpeg" });
    if (up.error) throw up.error;
    const ins = await client.from("photos").insert({ album, path, caption, place });
    if (ins.error) throw ins.error;
  }
  async function del(id, path){
    if (path) await client.storage.from(bucket).remove([path]);
    await client.from("photos").delete().eq("id", id);
  }
  async function updateMeta(id, caption, place){
    const patch = { caption };
    if (place !== undefined) patch.place = place;
    await client.from("photos").update(patch).eq("id", id);
  }

  return { enabled: ready, list, upload, del, updateMeta, updateCaption: updateMeta };
})();
