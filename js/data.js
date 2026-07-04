/* =========================================================
   内容文件  data.js
   —— 时间线、照片、地图地点、信、歌词 都在这里加。
   —— 每一项用 { } 包起来，项与项之间用逗号隔开。
   —— 照片放进 photos 文件夹，这里写 "photos/文件名.jpg"。
   ========================================================= */

const DATA = {

  /* ---------- 1. 恋爱时间线 ----------
     从高中到现在，想加几个加几个，按时间顺序往下排。
     date 是显示的日期文字，title 是标题，text 是那段话，photo 可留空 "" */
  timeline: [
    { date: "高一",        title: "我们相遇",     text: "在最好的年纪遇见你。", photo: "photos/t1.jpg" },
    { date: "2023.03.28",  title: "在一起",       text: "从这天起，我有了想守护一辈子的人。", photo: "photos/t2.jpg" },
    { date: "现在",        title: "异地的我们",   text: "杭州到北京，距离没能让我们更远。", photo: "photos/t3.jpg" }
    // { date: "2024.xx.xx", title: "标题", text: "内容", photo: "photos/xx.jpg" },
  ],

  /* ---------- 2. 去过的省份（地图上会点亮，点进去看城市相册） ----------
     name 省份名（"浙江"或"浙江省"都行）。
     cities 数组：该省去过的城市，每个城市有 name/note/photos。
     date 时间，note 鼠标悬停显示的一句话。 */
  provinces: [
    {
      name: "浙江", date: "我在的地方", note: "杭州，我们的城市之一。",
      cities: [
        { name: "杭州", note: "我在这里", photos: ["photos/zj1.jpg"] }
      ]
    },
    {
      name: "北京", date: "你在的地方", note: "北京，你在的城市。",
      cities: [
        { name: "北京", note: "你在的地方", photos: ["photos/bj1.jpg"] }
      ]
    },
    {
      name: "湖北", date: "", note: "武汉，一起走过的城市。",
      cities: [
        { name: "武汉", note: "", photos: [] }
      ]
    },
    {
      name: "山东", date: "", note: "济南，一起走过的城市。",
      cities: [
        { name: "济南", note: "", photos: [] }
      ]
    },
    {
      name: "吉林", date: "", note: "长春与吉林，一起走过的城市。",
      cities: [
        { name: "长春", note: "", photos: [] },
        { name: "吉林", note: "", photos: [] }
      ]
    }
    // {
    //   name: "云南", date: "2024.暑假", note: "一起去看的风景。",
    //   photos: ["photos/yn1.jpg", "photos/yn2.jpg"]
    // },
  ],

  /* ---------- 3. 总相册（投影模式轮播也用这里） ----------
     src 照片路径，caption 是你给这张照片写的旁白（投影时会显示）。 */
  gallery: [
    { src: "photos/g1.jpg", caption: "想把每一个瞬间都留下来。" },
    { src: "photos/g2.jpg", caption: "和你在一起的时间，都闪闪发光。" },
    { src: "photos/g3.jpg", caption: "" }
    // { src: "photos/xx.jpg", caption: "旁白文字" },
  ],

  /* ---------- 4. 她的摄影作品专区 ---------- */
  herPhotos: [
    { src: "photos/her1.jpg", caption: "你眼里的世界。" },
    { src: "photos/her2.jpg", caption: "" }
  ],

  /* ---------- 5. 生日电子情书（每个 "..." 是一段） ---------- */
  letter: [
    "亲爱的：",
    "在写这封信的时候，我又想起了我们认识的那个夏天。",
    "异地的这段日子，谢谢你一直愿意和我一起走下去。",
    "十九岁生日快乐，往后的每一年，我都想陪你过。",
    "—— 永远爱你的我"
  ],

  /* ---------- 6. 华晨宇歌词（信里和暖心区做引语用） ---------- */
  lyrics: [
    "「我只想是我，得到祝福的我，得到你的爱。」",
    "「好想爱这个世界啊。」"
  ],

  /* ---------- 7. 睡前暖心文案（专门写给她宿舍睡不好这件事） ---------- */
  sleepText: [
    "我知道宿舍很吵，你常常睡不好。",
    "戴上耳塞、盖好被子，把那些声音关在外面。",
    "如果还是睡不着，就想想我，想想我们一起去过的地方。",
    "晚安，我的宝贝，好好睡，我在。"
  ],

  /* ---------- 8. 隐藏悄悄话彩蛋（连点页脚星星出现） ---------- */
  secret: "其实，我每天醒来第一件事，就是想你。",

  /* ---------- 9. 重要日子倒数 ----------
     type 固定写 "countdown"。
     date 日期，格式 "2026-07-10"。
     repeat 是否每年重复："yearly"（生日/纪念日用）或 ""（一次性）。 */
  days: [
    { label: "你的生日", date: "2026-07-10", repeat: "yearly", emoji: "🎂" },
    { label: "我们在一起", date: "2026-03-28", repeat: "yearly", emoji: "💕" },
    { label: "下次见面", date: "2026-08-15", repeat: "", emoji: "✈️" }
    // { label: "自定义", date: "2026-xx-xx", repeat: "", emoji: "✨" },
  ],

  /* ---------- 10. 想一起做的100件事 ----------
     done: true 表示已完成，false 表示还没做。
     勾选状态会自动存在浏览器本地（换设备不通用，但同一设备持久）。 */
  wishlist: [
    { text: "一起看一次日出", done: false },
    { text: "一起看一次日落", done: false },
    { text: "一起去海边", done: false },
    { text: "一起坐摩天轮", done: false },
    { text: "一起吃一顿火锅", done: false },
    { text: "一起看一场演唱会", done: false },
    { text: "一起拍一组情侣照", done: false },
    { text: "一起养一株植物", done: false },
    { text: "一起做一顿饭", done: false },
    { text: "一起看一场雪", done: false }
    // 继续加，照着上面格式复制一行，
  ]

};
