/* =========================================================
   逻辑文件 main.js  —— 一般不用改这里。
   架构：主页(枢纽) + 多个板块页，用 #hash 路由切换。
   ========================================================= */
const $ = (id) => document.getElementById(id);

/* ---------- 多主题切换 ----------
   主题的配色定义在 css/style.css 里（body.theme-xxx 覆盖变量）。
   选择会保存在浏览器本地，下次打开保持。 */
const THEMES = [
  { id:"default", name:"紫绿梦幻", c1:"#b79cff", c2:"#84e8c0" },
  { id:"gold",    name:"暖金夜色", c1:"#e8c9a0", c2:"#f5e6d3" },
  { id:"sakura",  name:"樱花粉梦", c1:"#f2a6c0", c2:"#ffd9e6" },
  { id:"mint",    name:"薄荷清夜", c1:"#7fd4e8", c2:"#9ff0d0" },
];
const THEME_KEY = "site_theme";
function currentTheme(){ return localStorage.getItem(THEME_KEY) || "default"; }
function applyTheme(id){
  if (!id) id = "default";
  document.body.classList.remove(...THEMES.map(t => "theme-" + t.id));
  if (id !== "default") document.body.classList.add("theme-" + id);
  localStorage.setItem(THEME_KEY, id);
  $("themePanel").querySelectorAll(".theme-opt").forEach(o =>
    o.classList.toggle("on", o.dataset.theme === id));
  // 地图颜色随主题：若地图已初始化则重绘
  if (chart){ chart.dispose(); chart = null; }
  if (location.hash === "#map") setTimeout(() => initMap(), 60);
}
/* 初始化主题面板 + 应用已保存的主题 */
(function initThemeUI(){
  $("themePanel").innerHTML = THEMES.map(t => `
    <button class="theme-opt" data-theme="${t.id}">
      <span class="theme-dot" style="background:linear-gradient(135deg,${t.c1},${t.c2})"></span>
      <span>${t.name}</span>
    </button>`).join("");
  $("themePanel").querySelectorAll(".theme-opt").forEach(o =>
    o.addEventListener("click", () => { applyTheme(o.dataset.theme); $("themePanel").classList.add("hidden"); }));
  $("themeBtn").addEventListener("click", e => { e.stopPropagation(); $("themePanel").classList.toggle("hidden"); });
  document.addEventListener("click", e => {
    if (!$("themePanel").classList.contains("hidden") && !e.target.closest("#themePanel") && !e.target.closest("#themeBtn"))
      $("themePanel").classList.add("hidden");
  });
  const t = currentTheme();
  if (t !== "default") document.body.classList.add("theme-" + t);
})();

/* ---------- 主页入口定义（顺序/文字/大小 改这里即可）
   size 可填 "lg"(大块) / "wide"(宽块) / ""(普通) ---------- */
const SECTIONS = [
  { id:"map",      icon:"🌍", title:"去过的地方", sub:"把坐标慢慢点亮",     size:"lg" },
  { id:"gallery",  icon:"📷", title:"我们的相册", sub:"一些真实的瞬间",     size:"wide" },
  { id:"timeline", icon:"🕰", title:"我们的故事", sub:"从同桌到异地",       size:"" },
  { id:"her",      icon:"🌷", title:"你眼里的世界", sub:"宝宝拍到的生活",    size:"" },
  { id:"letter",   icon:"📮", title:"邮箱嘎嘎",  sub:"狗狗认真写的",       size:"wide" },
  { id:"sleep",    icon:"🌙", title:"晚安",       sub:"宿舍吵也慢慢睡",      size:"wide" },
  { id:"days",     icon:"📅", title:"重要日子",   sub:"见面和纪念日",        size:"" },
  { id:"wish",     icon:"✨", title:"想做的事",   sub:"不急，一件件来",      size:"" },
];

/* ---------- 密码门 ---------- */
$("gateTitle").textContent = CONFIG.gateTitle || `给 ${CONFIG.herName} · ${CONFIG.coverTitle}`;
function tryEnter(){
  if ($("gateInput").value.trim() === String(CONFIG.password)){
    $("gate").classList.add("hidden");
    // 开场打字机动画：把副标题一个字一个字打出来，然后进入主页
    const text = CONFIG.coverSubtitle;
    $("introType").textContent = "";
    $("intro").classList.remove("hidden");
    let i = 0;
    const timer = setInterval(() => {
      i++;
      $("introType").textContent = text.slice(0, i);
      if (i >= text.length){
        clearInterval(timer);
        setTimeout(() => {
          $("intro").classList.add("hidden");
          $("app").classList.remove("hidden");
          $("player").classList.remove("hidden");
          boot();
        }, 700);
      }
    }, 100);
  } else {
    $("gateErr").textContent = "凑饱饱连纪念日都忘记啦";
    $("gateInput").value = "";
  }
}
$("gateBtn").addEventListener("click", tryEnter);
$("gateInput").addEventListener("keydown", e => { if (e.key === "Enter") tryEnter(); });

/* ---------- 启动渲染 ---------- */
function boot(){
  // 主页文字
  $("heroGreet").textContent = CONFIG.coverSubtitle;
  $("distLine").innerHTML = `${CONFIG.cityA.name} <b>${CONFIG.distanceKm}km</b> ${CONFIG.cityB.name}`;
  updateTimer(); setInterval(updateTimer, 1000);
  updateBday();

  // 入口传送门
  $("cards").innerHTML = SECTIONS.map(s => `
    <div class="portal ${s.size||""}" data-go="${s.id}">
      <span class="c-icon">${s.icon}</span>
      <div class="c-title">${s.title}</div>
      <div class="c-sub">${s.sub}</div>
    </div>`).join("");
  $("cards").querySelectorAll(".portal").forEach(c =>
    c.addEventListener("click", () => location.hash = c.dataset.go));

  // 各板块内容
  renderTimeline();
  renderGallery("gallery");
  renderGallery("herGallery");
  $("letter").innerHTML = DATA.letter.map(b => {
    if (b.type === "quote") return `<blockquote class="letter-quote">${b.text}</blockquote>`;
    if (b.type === "sign" || b.type === "date") return `<p class="letter-sign">${b.text}</p>`;
    if (b.type === "greet") return `<p class="letter-greet">${b.text}</p>`;
    return `<p class="letter-p">${b.text}</p>`;
  }).join("");
  $("lyrics").innerHTML = DATA.lyrics.map(p => `<p>${p}</p>`).join("");
  $("sleep").innerHTML  = DATA.sleepText.map(p => `<p>${p}</p>`).join("");
  $("secretText").textContent = DATA.secret;
  renderDays();
  renderWishlist();
  renderUpCities();
  $("editBtn").classList.remove("hidden");

  route();
}

/* ---------- 路由：主页 <-> 板块 ---------- */
const VIEWS = ["home", ...SECTIONS.map(s => s.id), "upload"];
let pendingGalleryScroll = null;   // 地图跳相册时记录要滚动到的地点
function route(){
  let h = location.hash.replace("#","") || "home";
  if (!VIEWS.includes(h)) h = "home";
  // 传照片页需要编辑密码才能进（本次会话记住）
  if (h === "upload" && !ensureUpAuth()){ h = "home"; location.hash = "home"; }
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  $("view-" + h).classList.add("active");
  $("app").classList.toggle("in-sub", h !== "home");
  const sec = SECTIONS.find(s => s.id === h);
  $("topbarTitle").textContent = h === "upload" ? "传照片" : (sec ? sec.title : "");
  $("view-" + h).scrollTop = 0;
  if (h === "map"){ initMap(); setTimeout(() => chart && chart.resize(), 220); }
  // 从地图跳过来：滚动到对应地点分组并高亮一下
  if (h === "gallery" && pendingGalleryScroll){
    const target = pendingGalleryScroll;
    pendingGalleryScroll = null;
    setTimeout(() => {
      const el = document.getElementById("gg-" + encodeURIComponent(target));
      if (!el) return;
      el.scrollIntoView({ behavior:"smooth", block:"start" });
      el.classList.add("flash");
      setTimeout(() => el.classList.remove("flash"), 1600);
    }, 350);
  }
}
window.addEventListener("resize", () => chart && chart.resize());
window.addEventListener("hashchange", route);
$("backBtn").addEventListener("click", () => location.hash = "home");

/* ---------- 恋爱计时 ---------- */
function pad(n){ return String(n).padStart(2,"0"); }
function updateTimer(){
  const start = new Date(CONFIG.anniversary + "T00:00:00");
  let diff = Math.floor((Date.now() - start)/1000);
  const days = Math.floor(diff/86400); diff -= days*86400;
  const h = Math.floor(diff/3600); diff -= h*3600;
  const m = Math.floor(diff/60); const s = diff - m*60;
  $("timer").innerHTML = `我们在一起 <b>${days}</b> 天 <b>${pad(h)}</b>:<b>${pad(m)}</b>:<b>${pad(s)}</b>`;
}

/* ---------- 生日倒计时 ---------- */
function updateBday(){
  const bd = new Date(CONFIG.herBirthday), now = new Date();
  let next = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (next < today) next.setFullYear(now.getFullYear()+1);
  const age = next.getFullYear() - bd.getFullYear();
  const days = Math.round((next - today)/86400000);
  $("bday").innerHTML = days === 0
    ? `🎂 今天宝宝 <b>${age}</b> 岁啦`
    : `距宝宝 <b>${age}</b> 岁生日还有 <b>${days}</b> 天`;
}

/* ---------- 时间线 ---------- */
function renderTimeline(){
  $("timeline").innerHTML = DATA.timeline.map(t => `
    <div class="tl-item">
      <div class="tl-date">${t.date}</div>
      <div class="tl-title">${t.title}</div>
      <div class="tl-text">${t.text}</div>
      ${t.photo ? `<img src="${t.photo}" alt="" onerror="this.style.display='none'">` : ""}
    </div>`).join("");
}

/* ---------- 相册（内置照片 + 本地上传照片 合并显示） ---------- */
const ALBUMS = {
  gallery:    { album:"gallery", base:() => DATA.gallery },
  herGallery: { album:"her",     base:() => DATA.herPhotos },
};
const albumCache = {};   // 合并后的列表，供大图/投影用

/* 找某个地点分组对应的"感受"文字（来自 provinces 的 story 字段） */
function storyFor(place){
  if (!place) return "";
  const p = DATA.provinces.find(pr => (pr.cities || []).some(c => c.name === place));
  return (p && p.story) ? p.story : "";
}

async function renderGallery(elId){
  const meta = ALBUMS[elId];
  // 云端/本地加载失败也要容错：不中断渲染，只提示
  let cloud = [], local = [], cloudErr = false;
  try { cloud = await Cloud.list(meta.album); }
  catch (err){ cloudErr = true; console.warn("[gallery] 云端照片加载失败：", err); }
  try { local = await Store.byAlbum(meta.album); }
  catch (err){ console.warn("[gallery] 本地照片读取失败：", err); }
  const list = [
    ...meta.base(),
    ...cloud.map(c => ({ src:c.src, caption:c.caption, place:c.place||"", _id:c.id, _src:"cloud", _path:c.path })),
    ...local.map(p => ({ src:p.src, caption:p.caption||"", place:p.place||"", _id:p.id, _src:"local" })),
  ];
  albumCache[elId] = list;

  const figureHTML = (g, i) => `
    <figure data-i="${i}">
      <img src="${g.src}" alt="" onerror="this.src='assets/placeholder.svg'">
      <figcaption class="gal-cap">${g.caption || ""}</figcaption>
      ${editMode && g._id ? `<button class="del" data-id="${g._id}" data-src="${g._src}" data-path="${g._path||""}">✕</button>` : ""}
    </figure>`;

  let html = "";
  if (cloudErr) html += `<p class="gallery-tip">☁ 云端照片没加载出来（网络不稳？），先看看这些</p>`;
  if (elId === "gallery" && list.length){
    // 按地点分组：有 place 的按 place 分，没 place 的归"日常"放最后
    const groups = {};
    list.forEach((g, i) => {
      const p = g.place || "日常";
      (groups[p] = groups[p] || []).push({ g, i });
    });
    const names = Object.keys(groups).filter(n => n !== "日常");
    if (groups["日常"]) names.push("日常");
    names.forEach(name => {
      const items = groups[name];
      html += `<div class="gallery-group" id="gg-${encodeURIComponent(name)}">`;
      html += `<h3 class="gg-title">${name}<span class="gg-count">${items.length}</span></h3>`;
      const story = storyFor(name);
      if (story) html += `<p class="gg-story">${story}</p>`;
      html += `<div class="gallery-grid">`;
      items.forEach(it => { html += figureHTML(it.g, it.i); });
      html += `</div></div>`;
    });
  } else {
    html += `<div class="gallery-grid">` + list.map((g,i) => figureHTML(g, i)).join("") + `</div>`;
  }
  if (editMode)
    html += `<div class="gallery-grid"><label class="add-tile"><span>＋</span>添加照片
      <input type="file" accept="image/*" multiple hidden></label></div>`;
  $(elId).innerHTML = html;

  $(elId).querySelectorAll("figure").forEach(f => {
    const i = +f.dataset.i;
    f.querySelector("img").addEventListener("click", () => {
      if (editMode) editItem(elId, i);
      else openLightbox(albumCache[elId], i, false);
    });
  });
  if (editMode){
    $(elId).querySelectorAll(".del").forEach(b => b.addEventListener("click", async e => {
      e.stopPropagation();
      if (b.dataset.src === "cloud") await Cloud.del(+b.dataset.id, b.dataset.path);
      else await Store.del(+b.dataset.id);
      toast("已删除"); renderGallery(elId);
    }));
    const input = $(elId).querySelector(".add-tile input");
    if (input) input.addEventListener("change", e => handleUpload(elId, e.target.files));
  }
}

async function handleUpload(elId, files){
  if (!files || !files.length) return;
  // gallery 相册上传时问一下拍在哪个城市（留空=日常分组）
  let place = "";
  if (elId === "gallery"){
    place = (prompt("这批照片拍在哪个城市？（留空归到\"日常\"分组）", "") || "").trim();
  }
  toast(`正在添加 ${files.length} 张…`);
  for (const file of files){
    try {
      if (Cloud.enabled){
        const blob = await fileToBlob(file);
        if (blob) await Cloud.upload(ALBUMS[elId].album, blob, "", place);
      } else {
        const src = await fileToDataURL(file);
        if (src) await Store.add({ album: ALBUMS[elId].album, src, caption:"", place, ts: Date.now() });
      }
    } catch (err){ console.warn(err); toast("上传失败：" + (err.message || "请检查 Supabase 配置")); return; }
  }
  toast(Cloud.enabled ? "已上传到云端" : "已添加到本地");
  renderGallery(elId);
}

/* ---------- 传照片页（手机友好：选城市 → 选照片 → 自动上传） ---------- */
const UP_AUTH_KEY = "upload_auth_ok";
const UP_PLACE_KEY = "upload_place";
function ensureUpAuth(){
  if (sessionStorage.getItem(UP_AUTH_KEY) === "1") return true;
  const pw = prompt("请输入编辑密码：");
  if (pw === null) return false;
  if (pw === String(CONFIG.editPassword)){ sessionStorage.setItem(UP_AUTH_KEY, "1"); return true; }
  toast("编辑密码不对"); return false;
}
function renderUpCities(){
  const cities = ["日常"];
  DATA.provinces.forEach(p => (p.cities || []).forEach(c => { if (!cities.includes(c.name)) cities.push(c.name); }));
  const last = localStorage.getItem(UP_PLACE_KEY) || "日常";
  $("upCity").innerHTML = cities.map(c =>
    `<button class="up-chip ${c === last ? "on" : ""}" data-c="${c}">${c}</button>`).join("");
  $("upCity").querySelectorAll(".up-chip").forEach(b => b.addEventListener("click", () => {
    localStorage.setItem(UP_PLACE_KEY, b.dataset.c);
    $("upCity").querySelectorAll(".up-chip").forEach(x => x.classList.toggle("on", x === b));
  }));
}
async function uploadMany(files){
  if (!files || !files.length) return;
  if (!Cloud.enabled){ toast("云端未配置，无法上传"); return; }
  const place = localStorage.getItem(UP_PLACE_KEY) || "日常";
  const list = [...files];
  $("upProgress").classList.remove("hidden");
  $("upThumbs").innerHTML = "";
  let ok = 0, fail = 0;
  for (let i = 0; i < list.length; i++){
    $("upStatus").textContent = `正在上传 ${i + 1}/${list.length}…`;
    $("upBar").style.width = Math.round(i / list.length * 100) + "%";
    try {
      const blob = await fileToBlob(list[i]);
      if (!blob) throw new Error("图片处理失败");
      await Cloud.upload("gallery", blob, "", place);
      ok++;
      const thumb = document.createElement("img");
      thumb.src = URL.createObjectURL(list[i]);
      thumb.className = "up-thumb";
      $("upThumbs").appendChild(thumb);
    } catch (err){ fail++; console.warn(err); }
    $("upBar").style.width = Math.round((i + 1) / list.length * 100) + "%";
  }
  $("upStatus").textContent = fail
    ? `完成：成功 ${ok} 张，失败 ${fail} 张（失败的可重新选一次）`
    : `完成：已上传 ${ok} 张到「${place}」✅`;
  $("upBar").style.width = "100%";
  toast(`已上传 ${ok} 张`);
  $("upFile").value = "";
  renderGallery("gallery");   // 刷新相册缓存，进相册就是最新的
}
$("upFile").addEventListener("change", e => uploadMany(e.target.files));
$("upLink").addEventListener("click", () => { location.hash = "upload"; });

async function editItem(elId, i){
  const g = albumCache[elId][i];
  if (!g._id){ toast("内置照片的文字和地点请在 data.js 里改"); return; }
  const cap = prompt("给这张照片写一句旁白：", g.caption || "");
  if (cap === null) return;
  let place = g.place || "";
  if (elId === "gallery"){
    place = (prompt("拍在哪个城市？（留空归到\"日常\"分组）", g.place || "") || "").trim();
  }
  if (g._src === "cloud"){
    await Cloud.updateMeta(g._id, cap, place);
  } else {
    const local = await Store.byAlbum(ALBUMS[elId].album);
    const rec = local.find(p => p.id === g._id);
    if (rec){ rec.caption = cap; rec.place = place; await Store.update(rec); }
  }
  renderGallery(elId); toast("已保存");
}

/* ---------- 编辑模式 ---------- */
let editMode = false;
function setEdit(on){
  editMode = on;
  document.body.classList.toggle("editing", on);
  $("editBtn").classList.toggle("on", on);
  renderGallery("gallery"); renderGallery("herGallery");
  toast(on ? (Cloud.enabled ? "编辑模式 · 云端已连接 ☁" : "编辑模式 · 本地存储") : "已退出编辑模式");
}
$("editBtn").addEventListener("click", () => {
  if (editMode){ setEdit(false); return; }
  const pw = prompt("请输入编辑密码：");
  if (pw === null) return;
  if (pw === String(CONFIG.editPassword)) setEdit(true);
  else toast("编辑密码不对");
});

/* ---------- 轻提示 ---------- */
let toastT = null;
function toast(msg){
  $("toast").textContent = msg;
  $("toast").classList.remove("hidden");
  clearTimeout(toastT);
  toastT = setTimeout(() => $("toast").classList.add("hidden"), 2200);
}

/* ---------- 大图 / 投影 ---------- */
let lbList = [], lbIdx = 0, projTimer = null;
function openLightbox(list, idx, projection){
  lbList = list; lbIdx = idx;
  $("lightbox").classList.remove("hidden");
  $("lightbox").classList.toggle("projection", projection);
  showLb();
  if (projection) projTimer = setInterval(() => { lbIdx = (lbIdx+1)%lbList.length; showLb(); }, 4500);
}
function showLb(){
  const g = lbList[lbIdx];
  $("lbImg").src = g.src;
  $("lbImg").onerror = () => { $("lbImg").src = "assets/placeholder.svg"; };
  $("lbCap").textContent = g.caption || "";
}
function closeLb(){ $("lightbox").classList.add("hidden"); if (projTimer){ clearInterval(projTimer); projTimer=null; } }
$("lbClose").addEventListener("click", closeLb);
$("lbPrev").addEventListener("click", () => { lbIdx=(lbIdx-1+lbList.length)%lbList.length; showLb(); });
$("lbNext").addEventListener("click", () => { lbIdx=(lbIdx+1)%lbList.length; showLb(); });
document.addEventListener("keydown", e => {
  if ($("lightbox").classList.contains("hidden")) return;
  if (e.key==="ArrowLeft") $("lbPrev").click();
  if (e.key==="ArrowRight") $("lbNext").click();
  if (e.key==="Escape") closeLb();
});
$("projBtn").addEventListener("click", () => openLightbox(albumCache["gallery"] || DATA.gallery, 0, true));

/* ---------- 省份地图（ECharts，懒加载） ---------- */
let chart = null;
/* 地图三色随主题：home=狗狗在的地方 / her=宝宝在的地方 / visit=一起玩过(暖金发光) */
const MAP_THEME_COLORS = {
  default:{ home:"#b79cff", homeHi:"#d6c9ff", her:"#4fd6a6", herHi:"#84e8c0", visit:"#ffc46b", visitHi:"#ffd9a0" },
  gold:   { home:"#e8c9a0", homeHi:"#f2dcbc", her:"#f5e6d3", herHi:"#fff3e0", visit:"#ffc46b", visitHi:"#ffd9a0" },
  sakura: { home:"#f2a6c0", homeHi:"#ffc4d8", her:"#ffd9e6", herHi:"#ffeef4", visit:"#ffc46b", visitHi:"#ffd9a0" },
  mint:   { home:"#7fd4e8", homeHi:"#a8e4f2", her:"#9ff0d0", herHi:"#c8f8e6", visit:"#ffc46b", visitHi:"#ffd9a0" },
};
function mapColors(){ return MAP_THEME_COLORS[currentTheme()] || MAP_THEME_COLORS.default; }
function coreName(n){ return n.replace(/(省|市|自治区|特别行政区|维吾尔|壮族|回族|自治州)/g, ""); }
function initMap(){
  if (chart) return;
  chart = echarts.init($("map"));
  chart.showLoading({ text:"地图加载中…", textColor:"#a59ec8", maskColor:"rgba(11,10,24,0)", color:"#84e8c0" });
  fetch("assets/vendor/china.json")
    .then(r => r.json())
    .catch(() => fetch("https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json").then(r => r.json()))
    .then(geo => {
      echarts.registerMap("china", geo);
      const fullByCore = {};
      geo.features.forEach(f => { fullByCore[coreName(f.properties.name)] = f.properties.name; });
      const visited = DATA.provinces.map(p => ({ full: fullByCore[coreName(p.name)] || p.name, p }));
      chart.hideLoading();
      chart.setOption({
        tooltip:{ trigger:"item", backgroundColor:"#15122a", borderColor:"rgba(183,156,255,.4)",
          textStyle:{ color:"#f0ecff" },
          formatter: pr => { const v = visited.find(x => x.full === pr.name);
            return v ? `<b style="color:#84e8c0">${v.p.name}</b><br>${v.p.note||""}<br><span style="color:#a59ec8">${v.p.date||""} · 点击看相册</span>` : pr.name; } },
        series:[{
          type:"map", map:"china", roam:false, zoom:1.15, selectedMode:false,
          label:{ show:false },
          itemStyle:{ areaColor:"#1a1535", borderColor:"rgba(183,156,255,.30)", borderWidth:.7 },
          emphasis:{ label:{ show:true, color:"#0b0a18", fontSize:11 },
            itemStyle:{ areaColor:"#b79cff" } },
          data: visited.map(v => {
            const mc = mapColors();
            const k = v.p.type === "home" ? "home" : v.p.type === "her" ? "her" : "visit";
            const area = mc[k], hi = mc[k + "Hi"];
            return { name:v.full, value:1,
              itemStyle:{ areaColor:area, borderColor:hi, shadowColor:area, shadowBlur: k === "visit" ? 18 : 10 },
              emphasis:{ itemStyle:{ areaColor:hi } } };
          })
        }]
      });
      chart.on("click", pr => {
        const v = visited.find(x => x.full === pr.name);
        if (v) showCityPanel(v.p);
      });
    })
    .catch(() => { chart.hideLoading();
      $("map").innerHTML = "<p style='text-align:center;color:#ef9fb8;padding-top:30%'>地图加载失败（需要联网），请检查网络后回到主页再进一次</p>"; });
}

/* ---------- 音乐播放器 ---------- */
const audio = $("audio");
let curTrack = -1;
$("playerList").innerHTML = CONFIG.music.map((m,i) => `<button data-i="${i}">♪ ${m.title}</button>`).join("");
function playTrack(i){
  curTrack = i;
  const t = CONFIG.music[i];
  audio.src = t.file;
  audio.play().catch(()=>{});
  $("plPlay").textContent = "❚❚";
  $("plTitle").textContent = t.title;
  $("playerList").querySelectorAll("button").forEach((b,bi)=> b.classList.toggle("playing", bi===i));
}
$("plPlay").addEventListener("click", () => {
  if (curTrack === -1){ playTrack(0); return; }
  if (audio.paused){ audio.play(); $("plPlay").textContent="❚❚"; }
  else { audio.pause(); $("plPlay").textContent="▶"; }
});
$("plPrev").addEventListener("click", () => playTrack((curTrack<=0?CONFIG.music.length:curTrack)-1));
$("plNext").addEventListener("click", () => playTrack((curTrack+1)%CONFIG.music.length));
$("plList").addEventListener("click", () => { $("volPanel").classList.add("hidden"); $("playerList").classList.toggle("show"); });
$("playerList").querySelectorAll("button").forEach(b =>
  b.addEventListener("click", () => { playTrack(+b.dataset.i); $("playerList").classList.remove("show"); }));
audio.addEventListener("ended", () => playTrack((curTrack+1)%CONFIG.music.length));
/* 播放器律动条：播放时跳动，暂停时静止 */
audio.addEventListener("play", () => document.body.classList.add("music-on"));
audio.addEventListener("pause", () => document.body.classList.remove("music-on"));

/* ---------- 音量控制（记住上次音量） ---------- */
const VOL_KEY = "player_vol";
(function initVol(){
  const saved = parseFloat(localStorage.getItem(VOL_KEY));
  if (!isNaN(saved)) audio.volume = Math.min(1, Math.max(0, saved));
  $("volRange").value = String(audio.volume);
  refreshVolIcon();
  $("plVol").addEventListener("click", e => {
    e.stopPropagation();
    $("playerList").classList.remove("show");
    $("volPanel").classList.toggle("hidden");
  });
  $("volRange").addEventListener("input", e => {
    audio.volume = parseFloat(e.target.value);
    localStorage.setItem(VOL_KEY, String(audio.volume));
    refreshVolIcon();
  });
  document.addEventListener("click", e => {
    if (!$("volPanel").classList.contains("hidden") && !e.target.closest("#volPanel") && !e.target.closest("#plVol"))
      $("volPanel").classList.add("hidden");
  });
})();
function refreshVolIcon(){
  $("plVol").textContent = audio.volume === 0 ? "🔇" : audio.volume < 0.5 ? "🔉" : "🔊";
}

/* ---------- 悄悄话彩蛋（连点星星 3 下） ---------- */
let eggCount = 0, eggTimer = null;
$("starEgg").addEventListener("click", () => {
  eggCount++; clearTimeout(eggTimer);
  eggTimer = setTimeout(() => eggCount=0, 1200);
  if (eggCount >= 3){ eggCount=0; $("secretBox").classList.remove("hidden"); }
});
$("secretClose").addEventListener("click", () => $("secretBox").classList.add("hidden"));

/* ---------- 城市选择面板（点省份后弹出） ---------- */
function showCityPanel(prov){
  $("cityPanelTitle").textContent = prov.name;
  const cities = prov.cities || [];
  const gal = albumCache["gallery"] || [];
  $("cityList").innerHTML = cities.map((c, i) => {
    const n = gal.filter(g => (g.place || "日常") === c.name).length;
    return `
    <button class="city-card" data-i="${i}">
      <span class="city-name">${c.name}</span>
      <span class="city-note">${c.note || ""}</span>
      <span class="city-count">${n ? `相册里 ${n} 张` : "去相册看看"}</span>
    </button>`;
  }).join("");
  $("cityPanel").classList.remove("hidden");
  $("cityList").querySelectorAll(".city-card").forEach((b, i) => {
    b.addEventListener("click", () => {
      const c = cities[i];
      pendingGalleryScroll = c.name;
      $("cityPanel").classList.add("hidden");
      location.hash = "gallery";
    });
  });
}
$("cityPanelClose").addEventListener("click", () => $("cityPanel").classList.add("hidden"));

/* ---------- 重要日子倒数 ---------- */
function renderDays(){
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  $("daysGrid").innerHTML = DATA.days.map(d => {
    // 文字模式：不显示倒计时，直接放一段话（如"下次见面"）
    if (d.text){
      return `
      <div class="day-card day-textcard">
        <div class="day-emoji">${d.emoji || "📅"}</div>
        <div class="day-label">${d.label}</div>
        <div class="day-text">${d.text}</div>
      </div>`;
    }
    const base = new Date(d.date + "T00:00:00");
    if (d.mode === "elapsed"){
      const diff = Math.floor((today - base) / 86400000);
      return `
      <div class="day-card">
        <div class="day-emoji">${d.emoji || "📅"}</div>
        <div class="day-label">${d.label}</div>
        <div class="day-num">${diff}</div>
        <div class="day-unit">天啦</div>
      </div>`;
    }
    let target = new Date(today.getFullYear(), base.getMonth(), base.getDate());
    if (target < today && d.repeat === "yearly") target.setFullYear(now.getFullYear() + 1);
    if (target < today && d.repeat !== "yearly") target = base;
    const diff = Math.round((target - today) / 86400000);
    const isToday = diff === 0;
    const passed = diff < 0 && d.repeat !== "yearly";
    let num, unit, label;
    if (isToday){
      num = "🎉"; unit = "就是今天"; label = d.label;
    } else if (passed){
      num = Math.abs(diff); unit = "天前"; label = d.label;
    } else {
      num = diff; unit = "天后"; label = d.label;
    }
    return `
      <div class="day-card ${isToday ? 'today' : ''} ${passed ? 'past' : ''}">
        <div class="day-emoji">${d.emoji || "📅"}</div>
        <div class="day-label">${label}</div>
        <div class="day-num">${num}</div>
        <div class="day-unit">${unit}</div>
        <div class="day-date">${target.getFullYear()}.${pad(target.getMonth()+1)}.${pad(target.getDate())}</div>
      </div>`;
  }).join("");
}

/* ---------- 想一起做的事（本地存储勾选） ---------- */
const WISH_KEY = "wishlist_done";
function getWishDone(){
  try { return JSON.parse(localStorage.getItem(WISH_KEY)) || {}; } catch { return {}; }
}
function renderWishlist(){
  const done = getWishDone();
  let count = 0;
  $("wishlist").innerHTML = DATA.wishlist.map((w, i) => {
    const isDone = done[i] || w.done;
    if (isDone) count++;
    return `
      <label class="wish-item ${isDone ? 'done' : ''}">
        <input type="checkbox" data-i="${i}" ${isDone ? 'checked' : ''}>
        <span class="wish-check"></span>
        <span class="wish-text">${w.text}</span>
      </label>`;
  }).join("");
  $("wishProgress").textContent = `已完成 ${count} / ${DATA.wishlist.length}`;
  $("wishlist").querySelectorAll("input[type=checkbox]").forEach(cb => {
    cb.addEventListener("change", e => {
      const i = +e.target.dataset.i;
      const done = getWishDone();
      done[i] = e.target.checked;
      localStorage.setItem(WISH_KEY, JSON.stringify(done));
      renderWishlist();
    });
  });
}
