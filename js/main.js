/* =========================================================
   逻辑文件 main.js  —— 一般不用改这里。
   架构：主页(枢纽) + 多个板块页，用 #hash 路由切换。
   ========================================================= */
const $ = (id) => document.getElementById(id);

/* ---------- 通用输入弹层（兼容 iOS Safari：不用 prompt） ---------- */
/* 把上传/网络错误转成好懂的中文提示 */
function friendlyErr(err){
  const m = (err && err.message) || "";
  if (err instanceof TypeError || /fetch|network|NetworkError|ECONN|Failed to fetch/i.test(m))
    return "网络连接失败（照片存在境外服务器，建议连 WiFi 或挂代理后重试）";
  return m || "未知错误，请检查网络";
}
function askInput(title, placeholder, defaultValue, callback, isPassword){
  $("modalTitle").textContent = title;
  $("modalInput").placeholder = placeholder || "";
  $("modalInput").value = defaultValue || "";
  $("modalInput").type = isPassword ? "password" : "text";
  $("modalMask").classList.remove("hidden");
  let settled = false;
  const done = v => { if (settled) return; settled = true; $("modalMask").classList.add("hidden"); callback(v); };
  $("modalOk").onclick = () => done($("modalInput").value.trim());
  $("modalCancel").onclick = () => done(null);
  setTimeout(() => { try { $("modalInput").focus(); } catch(e){} }, 80);
}

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

/* ---------- 主页入口；位置与大小由 bubbles.css 分屏控制 ---------- */
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

const BUBBLE_ICONS = {
  gallery: '<rect x="5" y="7" width="23" height="19" rx="3"/><path d="m5 21 7-7 6 6 4-4 6 6M10 7V4h22v19h-4"/><circle cx="21" cy="12" r="1.5"/>',
  map: '<path d="m4 8 9-4 10 4 9-4v23l-9 4-10-4-9 4ZM13 4v23M23 8v23"/><path d="M25 14c0 4-5 8-5 8s-5-4-5-8a5 5 0 0 1 10 0Z"/><circle cx="20" cy="14" r="1.5"/>',
  timeline: '<path d="M8 8c-6 6-4 18 6 21 10 3 19-6 16-16C27 3 16 1 8 8ZM8 8V2M8 8h6M18 10v8l6 3"/>',
  her: '<rect x="4" y="10" width="28" height="20" rx="4"/><path d="m11 10 3-5h8l3 5"/><circle cx="18" cy="20" r="6"/><path d="M27 15h1"/>',
  letter: '<rect x="4" y="8" width="28" height="21" rx="3"/><path d="m5 10 13 10 13-10M5 27l9-10M31 27l-9-10"/>',
  sleep: '<path d="M28 24A13 13 0 0 1 13 4a13 13 0 1 0 15 20Z"/><path d="m26 5 1.4 4.6L32 11l-4.6 1.4L26 17l-1.4-4.6L20 11l4.6-1.4Z"/>',
  days: '<rect x="5" y="8" width="26" height="24" rx="4"/><path d="M5 15h26M12 4v8M24 4v8M12 21h3M21 21h3M12 27h3"/>',
  wish: '<path d="m18 3 3.8 9.2L32 13l-7.8 6.7L26.5 30 18 24.7 9.5 30l2.3-10.3L4 13l10.2-.8Z"/>',
};

function bubbleMarkup(section){
  const id = section.id;
  const outline = 'M100 8a92 92 0 1 1 0 184a92 92 0 1 1 0-184Z';
  return `<a class="bubble bubble--${id}" data-bubble href="#${id}" aria-label="${section.title}">
    <span class="bubble-rest"><span class="bubble-surface">
      <svg class="bubble-film" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id="film-${id}" cx="30%" cy="20%" r="85%">
            <stop offset="0" stop-color="#ffffff" stop-opacity=".16"/>
            <stop offset=".38" stop-color="var(--bubble-tint)" stop-opacity=".075"/>
            <stop offset=".72" stop-color="var(--bg)" stop-opacity=".04"/>
            <stop offset="1" stop-color="var(--bubble-tint)" stop-opacity=".19"/>
          </radialGradient>
          <linearGradient id="rim-${id}" x1="12%" y1="2%" x2="83%" y2="100%">
            <stop stop-color="#fff5ec" stop-opacity=".88"/>
            <stop offset=".2" stop-color="var(--purple)" stop-opacity=".68"/>
            <stop offset=".43" stop-color="var(--green)" stop-opacity=".14"/>
            <stop offset=".65" stop-color="var(--purple)" stop-opacity=".35"/>
            <stop offset=".86" stop-color="var(--green)" stop-opacity=".85"/>
            <stop offset="1" stop-color="#fff5ec" stop-opacity=".58"/>
          </linearGradient>
          <radialGradient id="pearl-${id}" cx="75%" cy="92%" r="65%">
            <stop stop-color="var(--green)" stop-opacity=".22"/>
            <stop offset=".5" stop-color="var(--purple)" stop-opacity=".055"/>
            <stop offset="1" stop-color="var(--purple)" stop-opacity="0"/>
          </radialGradient>
          <clipPath id="clip-${id}"><path data-membrane d="${outline}"/></clipPath>
        </defs>
        <path data-membrane d="${outline}" fill="url(#film-${id})"/>
        <path data-membrane d="${outline}" fill="url(#pearl-${id})" stroke="url(#rim-${id})" stroke-width=".95"/>
        <g clip-path="url(#clip-${id})" fill="none" stroke-linecap="round">
          <path class="bubble-highlight" d="M30 52C47 21 87 12 117 20" stroke="url(#rim-${id})" stroke-width="2.2"/>
          <path d="M34 54C49 29 75 21 93 21" stroke="#fff6ff" stroke-opacity=".22" stroke-width=".65"/>
          <path d="M76 185C125 199 175 161 184 119" stroke="url(#rim-${id})" stroke-width="3.4" opacity=".45"/>
          <path d="M16 107C15 130 27 155 43 167" stroke="var(--purple)" stroke-width="1.8" opacity=".26"/>
        </g>
      </svg>
      <span class="bubble-content">
        <svg class="bubble-icon" viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${BUBBLE_ICONS[id]}</svg>
        <span class="bubble-title">${section.title}</span>
        <span class="bubble-sub">${section.sub}</span>
      </span>
      <span class="bubble-enter" aria-hidden="true">↗</span>
      <span class="bubble-ripples" aria-hidden="true"></span>
    </span></span>
  </a>`;
}

// A single soft expansion connects the selected bubble to its page.
$("cards").addEventListener("bubbleactivate", event => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const anchor = event.target.closest(".bubble");
  if (!anchor || !Element.prototype.animate) return;
  const rect = anchor.getBoundingClientRect();
  if (!rect.width) return;
  const veil = document.createElement("div");
  veil.className = "bubble-opening";
  veil.setAttribute("aria-hidden", "true");
  Object.assign(veil.style, {
    left: rect.left + "px", top: rect.top + "px",
    width: rect.width + "px", height: rect.height + "px",
  });
  document.body.appendChild(veil);
  const expansion = 2 * Math.hypot(innerWidth, innerHeight) / rect.width;
  const animation = veil.animate([
    { transform: "scale(1)", opacity: .25 },
    { transform: `scale(${expansion})`, opacity: .25, offset: .65 },
    { transform: `scale(${expansion})`, opacity: 0 },
  ], { duration: 520, easing: "cubic-bezier(.25,.65,.25,1)" });
  animation.finished.catch(() => {}).then(() => veil.remove());
});

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
  $("heroMyName").textContent = CONFIG.myName;
  $("heroHerName").textContent = CONFIG.herName;
  $("homeSince").textContent = "始于 " + CONFIG.anniversary.replace(/-/g, ".");
  $("heroGreet").textContent = CONFIG.coverSubtitle;
  $("distLine").innerHTML = `<span>${CONFIG.cityA.name}</span><span class="distance-thread" aria-hidden="true"></span><b>${CONFIG.distanceKm} km</b><span class="distance-thread" aria-hidden="true"></span><span>${CONFIG.cityB.name}</span>`;
  updateTimer(); setInterval(updateTimer, 1000);
  updateBday();

  $("cards").innerHTML = SECTIONS.map(bubbleMarkup).join("");
  if (window.BubbleField) window.BubbleField.mount($("cards"));

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
const viewScroll = new Map();
function route(){
  const previous = document.querySelector(".view.active");
  if (previous) viewScroll.set(previous.id, previous.scrollTop);
  let h = location.hash.replace("#","") || "home";
  if (!VIEWS.includes(h)) h = "home";
  // 传照片页需要编辑密码才能进（本次会话记住）
  if (h === "upload"){
    ensureUpAuth(ok => { if (!ok && location.hash === "#upload") location.hash = "home"; });
  }
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  $("view-" + h).classList.add("active");
  $("app").classList.toggle("in-sub", h !== "home");
  const sec = SECTIONS.find(s => s.id === h);
  $("topbarTitle").textContent = h === "upload" ? "传照片" : (sec ? sec.title : "");
  $("view-" + h).scrollTop = viewScroll.get("view-" + h) || 0;
  if (h === "map"){ initMap(); setTimeout(() => chart && chart.resize(), 220); }
  // 从地图跳过来：滚动到对应地点分组并高亮一下
  if (h === "gallery" && pendingGalleryScroll){
    const target = pendingGalleryScroll;
    pendingGalleryScroll = null;
    setTimeout(() => {
      const el = document.getElementById("gg-" + encodeURIComponent(target));
      if (!el) return;
      const album = el.querySelector("details");
      if (album) { album.open = true; hydrateAlbum(album); }
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
  $("timer").innerHTML = `<span class="timer-label">已经一起走过</span><span class="timer-days"><b>${days.toLocaleString("zh-CN")}</b><span>天</span></span><span class="timer-clock">${pad(h)} <i>:</i> ${pad(m)} <i>:</i> ${pad(s)}</span>`;
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

const galleryVersions = {};
const expandedAlbums = new Set();
let albumCovers = {};
try { albumCovers = JSON.parse(localStorage.getItem("albumCovers") || "{}"); if (!albumCovers || typeof albumCovers !== "object") albumCovers = {}; } catch (_) {}
// Original sample paths have no files in this project; retain data but omit from display.
const missingSamplePhotos = new Set(["photos/g1.jpg", "photos/g2.jpg", "photos/g3.jpg", "photos/her1.jpg", "photos/her2.jpg"]);
function realPhoto(photo){ return !!photo.src && !/placeholder/i.test(photo.src) && !missingSamplePhotos.has(photo.src); }

function galleryEscape(value){
  return String(value == null ? "" : value).replace(/[&<>"']/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '\"':"&quot;", "'":"&#39;"}[c]));
}
function hydrateAlbum(album){
  album.querySelectorAll("img[data-src]").forEach(img => {
    img.src = img.dataset.src;
    delete img.dataset.src;
  });
}
async function renderGallery(elId){
  const version = galleryVersions[elId] = (galleryVersions[elId] || 0) + 1;
  const meta = ALBUMS[elId];
  // 云端/本地加载失败也要容错：不中断渲染，只提示
  let cloud = [], local = [], cloudErr = false;
  try { cloud = await Cloud.list(meta.album); }
  catch (err){ cloudErr = true; console.warn("[gallery] 云端照片加载失败：", err); }
  try { local = await Store.byAlbum(meta.album); }
  catch (err){ console.warn("[gallery] 本地照片读取失败：", err); }
  const list = [
    ...meta.base().filter(realPhoto),
    ...cloud.map(c => ({ src:c.src, caption:c.caption, place:c.place||"", _id:c.id, _src:"cloud", _path:c.path })),
    ...local.map(p => ({ src:p.src, caption:p.caption||"", place:p.place||"", _id:p.id, _src:"local" })),
  ];
  if (version !== galleryVersions[elId]) return;
  albumCache[elId] = list;

  const figureHTML = (g, i, deferred = false) => `
    <figure data-i="${i}">
      <button class="photo-open" type="button" aria-label="${galleryEscape(g.caption || g.place || "照片")}，${editMode ? "编辑" : "查看大图"}">
        <img ${deferred ? "data-src" : "src"}="${galleryEscape(g.src)}" loading="lazy" decoding="async" alt="${galleryEscape(g.caption || "")}" onerror="this.onerror=null;this.src='assets/placeholder.svg'">
      </button>
      <figcaption class="gal-cap">${galleryEscape(g.caption || "")}</figcaption>
      ${editMode && g._id ? `<button class="del" data-id="${galleryEscape(g._id)}" data-src="${galleryEscape(g._src)}" data-path="${galleryEscape(g._path||"")}">✕</button>` : ""}
    </figure>`;

  let html = "";
  if (cloudErr) html += `<p class="gallery-tip">云端照片暂时没加载出来，可以稍后重新进入。</p>`;
  if (!list.length) html += `<p class="gallery-tip">这里还没有照片，去「添张照片」留下第一张吧。</p>`;
  if (elId === "gallery" && list.length){
    const groups = new Map();
    list.forEach((g, i) => {
      const place = g.place || "日常";
      if (!groups.has(place)) groups.set(place, []);
      groups.get(place).push({g, i});
    });
    const names = [...groups.keys()].filter(n => n !== "日常");
    if (groups.has("日常")) names.push("日常");
    names.sort((a,b) => Number(groups.get(b).some(it => realPhoto(it.g))) - Number(groups.get(a).some(it => realPhoto(it.g))));
    names.forEach(name => {
      const items = groups.get(name), cover = items.find(it => it.g.src === albumCovers[name] && realPhoto(it.g)) || items.find(it => realPhoto(it.g)) || items[0];
      const open = editMode || expandedAlbums.has(name);
      const story = storyFor(name);
      html += `<section class="gallery-group album-chapter" id="gg-${encodeURIComponent(name)}">
        <div class="album-lead">
          <div class="album-cover">${figureHTML(cover.g, cover.i)}</div>
          <div class="album-intro"><p class="album-count">${items.length} 张照片</p>
            <h3 class="gg-title">${galleryEscape(name)}</h3>
            ${story ? `<p class="gg-story">${galleryEscape(story)}</p>` : ""}
            <p class="album-cover-hint">点照片，慢慢看</p>
          </div>
        </div>`;
      if (items.length > 1) html += `<details class="album-details" data-place="${galleryEscape(name)}" ${open ? "open" : ""}>
        <summary><span class="album-expand">展开其余 ${items.length - 1} 张照片</span><span class="album-collapse">收起照片</span><span aria-hidden="true">＋</span></summary>
        <div class="gallery-grid">${items.filter(it => it !== cover).map(it => figureHTML(it.g, it.i, !open)).join("")}</div>
      </details>`;
      html += `</section>`;
    });
  } else if (list.length) {
    html += `<div class="gallery-grid photography-grid">` + list.map((g,i) => figureHTML(g, i)).join("") + `</div>`;
  }
  if (editMode)
    html += `<div class="gallery-grid"><button class="add-tile" type="button" data-add="${elId}"><span>＋</span>添加照片</button></div>`;
  const view = $(elId).closest(".view");
  const savedScroll = view.classList.contains("active") ? view.scrollTop : (viewScroll.get(view.id) || 0);
  $(elId).innerHTML = html;
  view.scrollTop = savedScroll;
  $(elId).querySelectorAll(".album-details").forEach(album => {
    album.addEventListener("toggle", () => {
      if (album.open) { expandedAlbums.add(album.dataset.place); hydrateAlbum(album); }
      else expandedAlbums.delete(album.dataset.place);
    });
  });

  $(elId).querySelectorAll("figure").forEach(f => {
    const i = +f.dataset.i;
    f.querySelector(".photo-open").addEventListener("click", () => {
      if (editMode) editItem(elId, i);
      else openLightbox(albumCache[elId], i, false, elId);
    });
  });
  if (editMode){
    $(elId).querySelectorAll(".del").forEach(b => b.addEventListener("click", async e => {
      e.stopPropagation();
      if (b.dataset.src === "cloud") await Cloud.del(+b.dataset.id, b.dataset.path);
      else await Store.del(+b.dataset.id);
      toast("已删除"); renderGallery(elId);
    }));
    $(elId).querySelectorAll(".add-tile").forEach(b => b.addEventListener("click", () => {
      const inp = document.createElement("input");
      inp.type = "file"; inp.accept = "image/*"; inp.multiple = true; inp.style.display = "none";
      document.body.appendChild(inp);
      inp.addEventListener("change", e => { handleUpload(elId, e.target.files); document.body.removeChild(inp); });
      inp.click();
    }));
  }
}

async function handleUpload(elId, files){
  if (!files || !files.length) return;
  if (elId === "gallery"){
    askInput("这批照片拍在哪个城市？（留空归到\"日常\"）", "如：北京", "", v => doUpload(elId, files, (v || "").trim()));
  } else {
    doUpload(elId, files, "");
  }
}
async function doUpload(elId, files, place){
  toast(`正在添加 ${files.length} 张…`);
  for (const file of files){
    try {
      if (Cloud.enabled){
        const blob = await fileToBlob(file);
        if (!blob) throw new Error("照片格式无法转换（HEIC？请用 Safari 打开，或把 iPhone 相机格式设为\"兼容性最好\"）");
        await Cloud.upload(ALBUMS[elId].album, blob, "", place);
      } else {
        const src = await fileToDataURL(file);
        if (src) await Store.add({ album: ALBUMS[elId].album, src, caption:"", place, ts: Date.now() });
      }
    } catch (err){ console.warn(err); toast("上传失败：" + friendlyErr(err), 6000); return; }
  }
  toast(Cloud.enabled ? "已上传到云端" : "已添加到本地");
  renderGallery(elId);
}

/* ---------- 传照片页（手机友好：选城市 → 选照片 → 自动上传） ---------- */
const UP_AUTH_KEY = "upload_auth_ok";
const UP_PLACE_KEY = "upload_place";
function ensureUpAuth(cb){
  if (sessionStorage.getItem(UP_AUTH_KEY) === "1"){ cb(true); return; }
  askInput("请输入编辑密码", "编辑密码", "", v => {
    if (v !== null && v === String(CONFIG.editPassword)){ sessionStorage.setItem(UP_AUTH_KEY, "1"); cb(true); }
    else { toast("编辑密码不对"); cb(false); }
  }, true);
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
  let ok = 0, fail = 0, failMsg = "";
  for (let i = 0; i < list.length; i++){
    $("upStatus").textContent = `正在上传 ${i + 1}/${list.length}…`;
    $("upBar").style.width = Math.round(i / list.length * 100) + "%";
    try {
      const blob = await fileToBlob(list[i]);
      if (!blob) throw new Error("照片格式无法转换（HEIC？请用 Safari 打开，或把 iPhone 相机格式设为\"兼容性最好\"）");
      await Cloud.upload("gallery", blob, "", place);
      ok++;
      const thumb = document.createElement("img");
      thumb.src = URL.createObjectURL(list[i]);
      thumb.className = "up-thumb";
      $("upThumbs").appendChild(thumb);
    } catch (err){ fail++; if (!failMsg) failMsg = friendlyErr(err); console.warn(err); }
    $("upBar").style.width = Math.round((i + 1) / list.length * 100) + "%";
  }
  $("upStatus").textContent = fail
    ? `完成：成功 ${ok} 张，失败 ${fail} 张${failMsg ? "（" + failMsg + "）" : ""}`
    : `完成：已上传 ${ok} 张到「${place}」✅`;
  $("upBar").style.width = "100%";
  toast(`已上传 ${ok} 张`);
  $("upFile").value = "";
  renderGallery("gallery");   // 刷新相册缓存，进相册就是最新的
}
$("upFileBtn").addEventListener("click", () => $("upFile").click());
$("upFile").addEventListener("change", e => uploadMany(e.target.files));
$("upLink").addEventListener("click", () => { location.hash = "upload"; });

async function editItem(elId, i){
  const g = albumCache[elId][i];
  if (!g._id){ toast("内置照片的文字和地点请在 data.js 里改"); return; }
  askInput("给这张照片写一句旁白", "旁白", g.caption || "", cap => {
    if (cap === null) return;
    if (elId === "gallery"){
      askInput("拍在哪个城市？（留空归到\"日常\"）", "如：北京", g.place || "", place => saveEdit(elId, g, cap, (place || "").trim()));
    } else {
      saveEdit(elId, g, cap, g.place || "");
    }
  });
}
async function saveEdit(elId, g, cap, place){
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
  $("dupeBtn").classList.toggle("hidden", !on);
  renderGallery("gallery"); renderGallery("herGallery");
  toast(on ? (Cloud.enabled ? "编辑模式 · 云端已连接 ☁" : "编辑模式 · 本地存储") : "已退出编辑模式");
}
$("editBtn").addEventListener("click", () => {
  if (editMode){ setEdit(false); return; }
  askInput("请输入编辑密码", "编辑密码", "", v => {
    if (v === null) return;
    if (v === String(CONFIG.editPassword)) setEdit(true);
    else toast("编辑密码不对");
  }, true);
});

/* ---------- 一键删除重复照片 ----------
   只删除【字节完全相同】的照片（SHA-256 指纹一致的才算重复），
   每组保留 1 张；"看起来像"但内容不同的照片绝不误删。 */
async function findDuplicateGroups(photos, onProgress){
  const groups = new Map();
  let done = 0;
  const queue = [...photos];
  const CONC = 6;   // 同时下载 6 张，避免太慢
  async function worker(){
    while (queue.length){
      const p = queue.shift();
      try {
        const resp = await fetch(p.src);
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        const buf = await resp.arrayBuffer();
        const digest = await crypto.subtle.digest("SHA-256", buf);
        const h = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
        const arr = groups.get(h) || [];
        arr.push(p);
        groups.set(h, arr);
      } catch (err){
        console.warn("[dupe] 跳过无法读取的照片", p.id, err.message);
      }
      done++;
      if (onProgress) onProgress(done, photos.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONC, queue.length) }, worker));
  return [...groups.values()].filter(g => g.length > 1);
}
async function deleteDupes(){
  if (!Cloud.enabled){ toast("云端未连接，无法扫描"); return; }
  if (!window.crypto || !window.crypto.subtle){ toast("当前浏览器不支持安全比对"); return; }
  let photos = [];
  try { photos = await Cloud.list("gallery"); }
  catch (err){ toast("读取云端照片失败"); return; }
  if (!photos.length){ toast("云端相册还没有照片"); return; }
  $("dupeTip").classList.remove("hidden");
  $("dupeTip").textContent = "正在下载照片并比对（完全相同的才会被标记）…";
  const groups = await findDuplicateGroups(photos, (d, t) => {
    $("dupeTip").textContent = `正在比对 ${d}/${t}…`;
  });
  if (!groups.length){
    $("dupeTip").textContent = "✅ 没有发现完全相同的重复照片";
    setTimeout(() => $("dupeTip").classList.add("hidden"), 4000);
    return;
  }
  const removeCount = groups.reduce((s, g) => s + g.length - 1, 0);
  if (!confirm(`找到 ${groups.length} 组完全相同的照片，将删除其中 ${removeCount} 张（每组保留 1 张）。确定删除？`)){
    $("dupeTip").textContent = "已取消";
    setTimeout(() => $("dupeTip").classList.add("hidden"), 2500);
    return;
  }
  let ok = 0;
  for (const g of groups){
    const [, ...rest] = g;
    for (const p of rest){
      try { await Cloud.del(p.id, p.path); ok++; }
      catch (err){ console.warn("[dupe] 删除失败", p.id, err.message); }
    }
  }
  $("dupeTip").textContent = `已删除 ${ok} 张重复照片`;
  setTimeout(() => $("dupeTip").classList.add("hidden"), 4000);
  toast(`已删除 ${ok} 张重复照片`);
  renderGallery("gallery");
}
$("dupeBtn").addEventListener("click", deleteDupes);

/* ---------- 轻提示 ---------- */
let toastT = null;
function toast(msg, ms){
  $("toast").textContent = msg;
  $("toast").classList.remove("hidden");
  clearTimeout(toastT);
  toastT = setTimeout(() => $("toast").classList.add("hidden"), ms || 2200);
}

/* ---------- 大图 / 投影 ---------- */
let lbList = [], lbIdx = 0, projTimer = null;
let lbAlbum = "", lbZoom = false, lbPlaying = false, lbReturnFocus = null;
function scheduleProjection(){
  clearInterval(projTimer); projTimer = null;
  $("lbPause").textContent = lbPlaying ? "暂停" : "继续播放";
  if (lbPlaying && !document.hidden) projTimer = setInterval(() => stepLb(1), Number($("lbSpeed").value));
}
function setLbZoom(zoom){
  const imageWidth = $("lbImg").getBoundingClientRect().width;
  lbZoom = zoom;
  $("lbImg").style.width = zoom ? `${imageWidth * 2}px` : "";
  $("lbImg").style.maxHeight = zoom ? "none" : "";
  $("lbStage").classList.toggle("zoomed", zoom);
  $("lbZoom").textContent = zoom ? "适应屏幕" : "放大 2 倍";
  $("lbZoom").setAttribute("aria-pressed", String(zoom));
  $("lbStage").scrollTop = 0; $("lbStage").scrollLeft = 0;
  if (zoom && lbPlaying) { lbPlaying = false; scheduleProjection(); }
}
function openLightbox(list, idx, projection, album = ""){
  if (!list || !list.length) { toast("还没有可以播放的照片"); return; }
  lbReturnFocus = document.activeElement;
  lbList = list; lbIdx = idx; lbAlbum = album; lbPlaying = !!projection;
  $("lightbox").classList.remove("hidden");
  $("lightbox").classList.toggle("projection", projection);
  $("lbProjection").hidden = !projection;
  $("app").inert = true;
  $("player").inert = true;
  showLb(); scheduleProjection(); $("lbClose").focus();
}
function showLb(){
  const g = lbList[lbIdx];
  setLbZoom(false);
  $("lbImg").onerror = () => { $("lbImg").onerror = null; $("lbImg").src = "assets/placeholder.svg"; };
  $("lbImg").src = g.src;
  $("lbImg").alt = g.caption || g.place || "照片";
  $("lbCap").textContent = g.caption || g.place || "";
  $("lbCount").textContent = `${lbIdx + 1} / ${lbList.length}`;
  $("lbCover").hidden = lbAlbum !== "gallery" || !realPhoto(g);
  $("lbCover").textContent = albumCovers[g.place || "日常"] === g.src ? "已设为本机封面" : "设为本机封面";
  [-1, 1].forEach(offset => {
    const adjacent = lbList[(lbIdx + offset + lbList.length) % lbList.length];
    if (adjacent && adjacent.src !== g.src) { const image = new Image(); image.src = adjacent.src; }
  });
}
function stepLb(offset){ lbIdx = (lbIdx + offset + lbList.length) % lbList.length; showLb(); }
function closeLb(){
  lbPlaying = false; scheduleProjection();
  $("lightbox").classList.add("hidden");
  $("app").inert = false; $("player").inert = false;
  if (lbReturnFocus && lbReturnFocus.isConnected) lbReturnFocus.focus({preventScroll:true});
  else $("backBtn").focus({preventScroll:true});
}
$("lbClose").addEventListener("click", closeLb);
$("lbPrev").addEventListener("click", () => { stepLb(-1); scheduleProjection(); });
$("lbNext").addEventListener("click", () => { stepLb(1); scheduleProjection(); });
$("lbZoom").addEventListener("click", () => setLbZoom(!lbZoom));
$("lbImg").addEventListener("dblclick", () => setLbZoom(!lbZoom));
$("lbPause").addEventListener("click", () => { if (!lbPlaying) setLbZoom(false); lbPlaying = !lbPlaying; scheduleProjection(); });
$("lbSpeed").addEventListener("change", scheduleProjection);
document.addEventListener("visibilitychange", scheduleProjection);
$("lbCover").addEventListener("click", () => {
  const g = lbList[lbIdx], place = g.place || "日常";
  const next = {...albumCovers, [place]: g.src};
  try { localStorage.setItem("albumCovers", JSON.stringify(next)); }
  catch (_) { toast("浏览器无法保存封面，请检查存储空间"); return; }
  albumCovers = next;
  $("lbCover").textContent = "已设为本机封面";
  renderGallery("gallery");
});
let swipeStart = null;
$("lbStage").addEventListener("touchstart", e => {
  swipeStart = !lbZoom && e.touches.length === 1 ? {x:e.touches[0].clientX, y:e.touches[0].clientY} : null;
}, {passive:true});
$("lbStage").addEventListener("touchmove", e => { if (e.touches.length !== 1) swipeStart = null; }, {passive:true});
$("lbStage").addEventListener("touchcancel", () => { swipeStart = null; });
$("lbStage").addEventListener("touchend", e => {
  if (!swipeStart || lbZoom) return;
  const dx = e.changedTouches[0].clientX - swipeStart.x, dy = e.changedTouches[0].clientY - swipeStart.y;
  swipeStart = null;
  if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) { stepLb(dx < 0 ? 1 : -1); scheduleProjection(); }
}, {passive:true});
document.addEventListener("keydown", e => {
  if ($("lightbox").classList.contains("hidden")) return;
  if (e.key === "Escape") { closeLb(); return; }
  if (e.key === "Tab") {
    const controls = [...$("lightbox").querySelectorAll("button, select")].filter(el => !el.hidden && el.getClientRects().length);
    const first = controls[0], last = controls[controls.length-1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  if (e.target.tagName === "SELECT" || lbZoom) return;
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); stepLb(e.key === "ArrowLeft" ? -1 : 1); scheduleProjection(); }
});
$("projBtn").addEventListener("click", () => openLightbox((albumCache["gallery"] || DATA.gallery).filter(realPhoto), 0, true, "gallery"));

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
