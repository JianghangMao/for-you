/* =========================================================
   基础设置文件  config.js
   —— 这个文件里都是你可以随便改的东西，改完保存刷新页面就生效。
   —— 不懂的地方别删引号和逗号就行。
   ========================================================= */

const CONFIG = {

  /* 进入网站的密码（建议用你们的纪念日 0328，或她生日 0710） */
  password: "0328",

  /* 编辑密码：只有你知道。点左下角齿轮、输入它才能进入「编辑模式」上传/删除照片。
     一定要和上面的进入密码不一样，别让她猜到～ */
  editPassword: "0117",

  /* 云端存储（Supabase）：填了之后，上传的照片会存到云端，任何设备都能看到。
     留空则只用本地浏览器存储。 */
  supabase: {
    url:    "https://lrqvtmvviawkbttxkrwq.supabase.co",
    key:    "sb_publishable_KROPaPkL4qwUF9A4aYe34Q_sM_bUSBX",
    bucket: "photos"
  },

  /* 称呼 */
  herName: "宝贝",      // 她的名字/昵称
  myName: "我",         // 你的名字/昵称

  /* 纪念日：在一起的那天（格式 年-月-日，别改横杠） */
  anniversary: "2023-03-28",

  /* 她的生日（年-月-日） */
  herBirthday: "2007-07-10",

  /* 两座城市 */
  cityA: { name: "杭州", who: "我在这里", lat: 30.2741, lng: 120.1551 }, // 你
  cityB: { name: "北京", who: "你在这里", lat: 39.9042, lng: 116.4074 }, // 她
  distanceKm: 1230,   // 两地直线距离，大概数就行

  /* 首页副标题 */
  coverTitle: "写给我最爱的你",
  coverSubtitle: "十九岁生日快乐",

  /* 背景音乐歌单
     —— 以后想加歌（比如华晨宇），照着下面复制一行就行。
     —— file 是音频文件路径，把 mp3 放进 music 文件夹，名字对上即可。 */
  music: [
    { title: "星茶会",       file: "music/xingchahui.mp3" },
    { title: "Flower Dance", file: "music/flower-dance.mp3" }
    // { title: "好想爱这个世界啊", file: "music/haoxiang.mp3" },
  ]

};
