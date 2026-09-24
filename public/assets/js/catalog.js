/* ==========================================================================
   順手工具箱 — 工具總目錄
   所有頁面共用。新增工具只要在這裡加一筆，首頁、搜尋、相關工具會自動更新。
   欄位：slug 對應 /t/<slug>.html
   ========================================================================== */

const SITE = {
  name: '順手工具箱',
  tagline: '免費線上小工具，打開就能用',
  desc: '輪盤抽籤、倒數計時、文字處理、符號表情、編碼轉換、單位換算、圖片壓縮——全部免安裝、免註冊，資料只留在你的瀏覽器。',
  mark: '🧰',
  // 部署後改成你的正式網址（結尾不要斜線），會用在 canonical 與結構化資料
  origin: 'https://tools.luka-life.com',

  /* Google AdSense 設定
     每個工具頁只放一個版位，位置在工具面板與說明內文之間——
     使用者這時已經用完工具，注意力自然轉移，不會干擾操作。
     首頁不放，因為那是導覽頁，放廣告會影響找工具的效率。

     ID 已填好，要開啟廣告只要把 enabled 改成 true。
     enabled 為 false 時，頁面完全不會載入任何廣告程式碼，
     連 AdSense 的 script 都不會出現在原始碼裡。

     建議等站台上線幾天、確認 AdSense 後台的網站狀態正常後再開。 */
  adsense: {
    enabled: true,
    client: 'ca-pub-1396679738965903',
    slot: '6383693441'          // 廣告單元「itools」
  },

  /* Google Analytics (GA4)
     只看流量與哪些工具真的有人用，沒有自訂事件，
     也不會把使用者在工具裡輸入的任何內容送出去。

     enabled 為 false 時完全不載入，連 gtag 的 script 都不會出現在原始碼裡。
     改動這裡記得同步更新 privacy.html 的第三方服務那一節。 */
  analytics: {
    enabled: true,
    id: 'G-P6F2324FNV'          // 資源「順手工具箱」
  }
};

const CATEGORIES = [
  { id: 'random', name: '隨機抽籤', icon: '🎲', desc: '決定不了的時候交給機率' },
  { id: 'time',   name: '時間計時', icon: '⏱️', desc: '倒數、碼錶、日期天數' },
  { id: 'text',   name: '文字處理', icon: '📝', desc: '比對、統計、整理大量文字' },
  { id: 'symbol', name: '符號表情', icon: '✨', desc: '特殊符號與表情一鍵複製' },
  { id: 'dev',    name: '開發編碼', icon: '⚙️', desc: '編碼、雜湊、格式化' },
  { id: 'calc',   name: '計算換算', icon: '🧮', desc: '單位、百分比、分帳' },
  { id: 'image',  name: '圖片處理', icon: '🖼️', desc: '壓縮、縮放、轉檔，不上傳' },
  { id: 'pdf',    name: 'PDF 文件', icon: '📄', desc: '合併、分割、轉檔，檔案不上傳' },
  { id: 'social', name: '社群小幫手', icon: '💬', desc: 'IG、FB、Threads 貼文排版' },
  { id: 'travel', name: '旅遊出行', icon: '✈️', desc: '匯率、行李、時差，出國前先查' },
  { id: 'tw',     name: '台灣生活', icon: '🇹🇼', desc: '房貸、薪資、勞基法、發票對獎' },
  { id: 'device', name: '裝置檢測', icon: '🖥️', desc: '鍵盤、麥克風、螢幕快速測試' }
];

const TOOLS = [
  /* ---------- 隨機抽籤 ---------- */
  { slug: 'wheel', cat: 'random', icon: '🎯', name: '幸運輪盤',
    desc: '自訂選項轉盤，動畫轉出結果', kw: '轉盤 抽獎 輪盤 決定 wheel spin' },
  { slug: 'dice', cat: 'random', icon: '🎲', name: '線上擲骰子',
    desc: '1 到 10 顆骰子，支援多種面數', kw: '骰子 擲骰 dice 桌遊 d20' },
  { slug: 'coin', cat: 'random', icon: '🪙', name: '擲硬幣',
    desc: '正面反面二選一，附統計', kw: '硬幣 丟銅板 正反面 coin flip' },
  { slug: 'number', cat: 'random', icon: '🔢', name: '隨機數字產生器',
    desc: '指定範圍抽號，可不重複', kw: '亂數 抽號碼 random number 樂透' },
  { slug: 'group', cat: 'random', icon: '👥', name: '隨機分組',
    desc: '名單貼上自動平均分隊', kw: '分組 分隊 team 分班 隨機' },
  { slug: 'picker', cat: 'random', icon: '🎰', name: '隨機抽籤點名',
    desc: '從名單抽一個或多個', kw: '抽籤 點名 抽人 lucky draw' },
  { slug: 'rps', cat: 'random', icon: '✊', name: '猜拳',
    desc: '跟電腦剪刀石頭布，記錄戰績', kw: '猜拳 剪刀石頭布 rps 划拳' },
  { slug: 'fb-draw', cat: 'random', icon: '🎁', name: 'FB 留言抽獎',
    desc: '貼上留言自動去重複並抽出得獎者', kw: 'fb 臉書 抽獎 留言 抽獎小幫手 社團 粉專 得獎' },

  /* ---------- 時間計時 ---------- */
  { slug: 'countdown', cat: 'time', icon: '⏳', name: '倒數計時器',
    desc: '大字幕倒數，時間到提示音', kw: '倒數 計時器 timer 廚房計時' },
  { slug: 'pomodoro', cat: 'time', icon: '🍅', name: '番茄鐘',
    desc: '25 分工作 5 分休息，可自訂', kw: '番茄鐘 pomodoro 專注 讀書' },
  { slug: 'stopwatch', cat: 'time', icon: '⏱️', name: '線上碼錶',
    desc: '正數計時，支援分段記錄', kw: '碼錶 stopwatch 計時 分段 lap' },
  { slug: 'clock', cat: 'time', icon: '🕐', name: '線上時鐘',
    desc: '全螢幕大字時鐘與日期', kw: '時鐘 現在時間 clock 全螢幕' },
  { slug: 'date-diff', cat: 'time', icon: '📅', name: '日期天數計算',
    desc: '算兩天相差幾天，或推算日期', kw: '天數 日期計算 相差 幾天 date' },
  { slug: 'age', cat: 'time', icon: '🎂', name: '年齡計算器',
    desc: '精確到天，附生肖與星座', kw: '年齡 歲數 虛歲 生日 age' },
  { slug: 'timezone', cat: 'travel', icon: '🌏', name: '世界時區換算',
    desc: '一百多個城市，時差一次看', kw: '時差 時區 世界時間 timezone utc 幾點 當地時間' },

  /* ---------- 文字處理 ---------- */
  { slug: 'diff', cat: 'text', icon: '🔍', name: '文字比對',
    desc: '逐行找出兩段文字的差異', kw: '比對 差異 diff 對照 比較' },
  { slug: 'count', cat: 'text', icon: '🔠', name: '字數統計',
    desc: '字數、字元、行數、中英分計', kw: '字數 統計 word count 計算字數' },
  { slug: 'case', cat: 'text', icon: 'Aa', name: '大小寫轉換',
    desc: '全大寫、全小寫、駝峰、蛇形', kw: '大小寫 camel snake case 轉換' },
  { slug: 'dedupe', cat: 'text', icon: '🧹', name: '重複行移除',
    desc: '去除重複、空行，可排序', kw: '去重複 移除 重複行 dedupe unique' },
  { slug: 'sort', cat: 'text', icon: '↕️', name: '文字排序',
    desc: '依筆畫、字母、數字、長度排', kw: '排序 sort 字母 順序 亂序' },
  { slug: 'replace', cat: 'text', icon: '🔁', name: '批次取代',
    desc: '一次換掉全部，支援正規表示式', kw: '取代 replace 尋找 批次 regex' },
  { slug: 'fancy', cat: 'text', icon: '🅵', name: '酷炫字體產生器',
    desc: '英數轉花體、圓圈、粗體字', kw: '特殊字體 花體字 酷文字 fancy text' },
  { slug: 'zh-convert', cat: 'text', icon: '繁', name: '繁簡轉換',
    desc: '詞彙級判斷，台灣用語一併轉', kw: '繁簡 簡體 繁體 轉換 简体 繁體字 台灣正體 大陸用語' },

  /* ---------- 符號表情 ---------- */
  { slug: 'symbols', cat: 'symbol', icon: '★', name: '特殊符號大全',
    desc: '箭頭、星星、數學、貨幣一鍵複製', kw: '特殊符號 符號 複製 箭頭 星星' },
  { slug: 'emoji', cat: 'symbol', icon: '😀', name: 'Emoji 表情符號',
    desc: '分類瀏覽並複製 Emoji', kw: 'emoji 表情符號 貼圖 圖示' },
  { slug: 'kaomoji', cat: 'symbol', icon: '(°▽°)', name: '顏文字',
    desc: '日系顏文字分類收錄', kw: '顏文字 kaomoji 表情 日式 文字表情' },

  /* ---------- 開發編碼 ---------- */
  { slug: 'base64', cat: 'dev', icon: '🔐', name: 'Base64 編碼解碼',
    desc: '文字與 Base64 雙向轉換', kw: 'base64 編碼 解碼 encode decode' },
  { slug: 'urlencode', cat: 'dev', icon: '🔗', name: 'URL 編碼解碼',
    desc: '網址參數編碼與還原', kw: 'url encode 網址編碼 percent 中文網址' },
  { slug: 'json', cat: 'dev', icon: '{}', name: 'JSON 格式化',
    desc: '排版美化、壓縮、語法檢查', kw: 'json 格式化 美化 壓縮 驗證 format' },
  { slug: 'hash', cat: 'dev', icon: '#️⃣', name: '雜湊值產生器',
    desc: 'MD5 / SHA-1 / SHA-256 / SHA-512', kw: 'md5 sha256 雜湊 hash 加密' },
  { slug: 'qrcode', cat: 'dev', icon: '📱', name: 'QR Code 產生器',
    desc: '網址文字轉 QR，可下載 PNG', kw: 'qrcode qr 二維碼 條碼 產生' },
  { slug: 'uuid', cat: 'dev', icon: '🆔', name: 'UUID 產生器',
    desc: '批次產生 v4 UUID', kw: 'uuid guid 唯一識別碼 產生' },
  { slug: 'password', cat: 'dev', icon: '🔑', name: '密碼產生器',
    desc: '自訂長度與字元，附強度檢測', kw: '密碼 產生 隨機密碼 password 強度' },
  { slug: 'color', cat: 'dev', icon: '🎨', name: '色碼轉換器',
    desc: 'HEX / RGB / HSL 互轉與配色', kw: '色碼 顏色 hex rgb hsl 調色' },
  { slug: 'timestamp', cat: 'dev', icon: '⌛', name: 'Unix 時間戳轉換',
    desc: '時間戳與日期互轉，自動辨識秒毫秒', kw: 'timestamp 時間戳 unix epoch 毫秒 時區 日期轉換 2038' },

  /* ---------- 計算換算 ---------- */
  { slug: 'unit', cat: 'calc', icon: '📏', name: '單位換算',
    desc: '長度、重量、溫度、面積、容量', kw: '單位換算 公分 英吋 公斤 磅 坪' },
  { slug: 'bmi', cat: 'calc', icon: '⚖️', name: 'BMI 計算器',
    desc: '身高體重算 BMI 與標準體重', kw: 'bmi 身體質量指數 體重 標準體重' },
  { slug: 'percent', cat: 'calc', icon: '％', name: '百分比計算',
    desc: '折扣、成長率、佔比一次算', kw: '百分比 折扣 打折 成長率 percent' },
  { slug: 'split', cat: 'calc', icon: '🧾', name: '分帳計算機',
    desc: '均分帳單、含服務費與小費', kw: '分帳 AA 均分 帳單 服務費' },
  { slug: 'radix', cat: 'calc', icon: '⇄', name: '進位轉換',
    desc: '2 / 8 / 10 / 16 進位互轉', kw: '進位 二進位 十六進位 binary hex' },

  /* ---------- 圖片處理 ---------- */
  { slug: 'image-compress', cat: 'image', icon: '🗜️', name: '圖片壓縮',
    desc: '調畫質縮檔案，不上傳伺服器', kw: '圖片壓縮 縮小 檔案大小 compress' },
  { slug: 'image-resize', cat: 'image', icon: '📐', name: '圖片尺寸調整',
    desc: '指定寬高縮放，可鎖定比例', kw: '圖片尺寸 縮放 resize 改大小 解析度' },
  { slug: 'image-convert', cat: 'image', icon: '🔄', name: '圖片格式轉換',
    desc: 'PNG / JPG / WebP 互轉', kw: '圖片轉檔 png jpg webp 格式轉換' },

  /* ---------- PDF 文件 ---------- */
  { slug: 'pdf-merge', cat: 'pdf', icon: '📎', name: 'PDF 合併',
    desc: '多個 PDF 串成一份，可調順序', kw: 'pdf 合併 merge 結合 多合一' },
  { slug: 'pdf-split', cat: 'pdf', icon: '✂️', name: 'PDF 分割取頁',
    desc: '指定頁碼抽出或拆成單頁', kw: 'pdf 分割 拆頁 split 抽出頁面' },
  { slug: 'pdf-organize', cat: 'pdf', icon: '🔃', name: 'PDF 旋轉與刪頁',
    desc: '轉正掃描檔、刪掉不要的頁', kw: 'pdf 旋轉 刪除頁面 轉正 排序' },
  { slug: 'img-to-pdf', cat: 'pdf', icon: '🖨️', name: '圖片轉 PDF',
    desc: '多張照片合成一份 PDF', kw: '圖片轉pdf jpg轉pdf 照片 合併 掃描' },

  /* ---------- 社群小幫手 ---------- */
  { slug: 'ig-space', cat: 'social', icon: '␣', name: 'IG 空白字元產生器',
    desc: '讓 IG 貼文與簡介正常換行', kw: 'ig 空白 換行 斷行 限動 簡介 bio' },
  { slug: 'social-count', cat: 'social', icon: '🔢', name: '社群貼文字數計算',
    desc: '各平台字數上限即時檢查', kw: 'ig threads 字數 上限 推特 貼文長度' },
  { slug: 'hashtag', cat: 'social', icon: '#️⃣', name: 'Hashtag 整理器',
    desc: '自動加井號、去重複、排版', kw: 'hashtag 標籤 井字號 ig 標記' },
  { slug: 'social-crop', cat: 'social', icon: '🖼️', name: '社群圖片尺寸裁切',
    desc: '內建 IG、FB、YT 各版位尺寸', kw: '社群 尺寸 裁切 ig 限動 封面 縮圖' },
  { slug: 'yt-thumbnail', cat: 'social', icon: '▶️', name: 'YouTube 縮圖擷取',
    desc: '貼網址取得各尺寸封面圖', kw: 'youtube 縮圖 封面 thumbnail 下載' },
  { slug: 'divider', cat: 'social', icon: '〰️', name: '分隔線裝飾產生器',
    desc: '貼文用的線條與裝飾框', kw: '分隔線 裝飾 線條 貼文 排版 花邊' },
  { slug: 'grid-split', cat: 'social', icon: '🔲', name: '九宮格切圖',
    desc: '大圖切成 IG 版面，附上傳順序', kw: '九宮格 切圖 ig 版面 分割 大圖 拼圖' },
  { slug: 'square-fit', cat: 'social', icon: '⬜', name: '圖片轉正方形',
    desc: '不裁切放進正方形，可模糊補邊', kw: '正方形 ig 不裁切 補白邊 模糊背景 直式' },
  { slug: 'watermark', cat: 'social', icon: '💧', name: '圖片浮水印',
    desc: '批次加上帳號名稱或標誌', kw: '浮水印 watermark 版權 logo 批次 加字' },
  { slug: 'collage', cat: 'social', icon: '🧩', name: '多圖拼貼',
    desc: '2 到 6 張合成一張，可調邊框', kw: '拼貼 拼圖 多圖 合成 併圖 collage 照片' },
  { slug: 'cover-safe', cat: 'social', icon: '🛡️', name: '封面安全區預覽',
    desc: 'FB、YT 封面被裁掉哪裡先看清楚', kw: '封面 安全區 fb youtube 橫幅 被裁切 尺寸' },

  /* ---------- 旅遊出行 ---------- */
  { slug: 'exchange', cat: 'travel', icon: '💱', name: '匯率換算',
    desc: '即時參考匯率，可估算銀行價差', kw: '匯率 換匯 日圓 美金 兌換 旅費 外幣' },
  { slug: 'flight', cat: 'travel', icon: '🛫', name: '航班時間轉機計算',
    desc: '跨時區飛行時數與轉機空檔', kw: '航班 飛行時間 轉機 時差 抵達時間 紅眼 幾小時' },
  { slug: 'packing', cat: 'travel', icon: '🎒', name: '行李打包清單',
    desc: '依天數行程自動算件數', kw: '打包 清單 行李 帶什麼 出國 checklist 準備' },
  { slug: 'weather', cat: 'travel', icon: '🧥', name: '旅遊天氣穿搭建議',
    desc: '七天預報換成該穿什麼', kw: '天氣 穿搭 氣溫 預報 穿什麼 幾度 weather' },
  { slug: 'tax-refund', cat: 'travel', icon: '🧾', name: '出國退稅計算器',
    desc: '估算扣手續費後實拿多少', kw: '退稅 免稅 tax refund 消費稅 日本 歐洲 機場' },
  { slug: 'luggage', cat: 'travel', icon: '🧳', name: '行李重量尺寸檢查',
    desc: '算線性尺寸，比對手提託運上限', kw: '行李 尺寸 重量 手提 託運 登機箱 幾吋 限制' },
  { slug: 'plug', cat: 'travel', icon: '🔌', name: '各國插頭電壓查詢',
    desc: '附插頭圖，判斷要帶轉接頭還是變壓器', kw: '插頭 插座 電壓 轉接頭 變壓器 110v 220v 萬用 出國 充電' },
  { slug: 'passport', cat: 'travel', icon: '🛂', name: '護照效期檢查',
    desc: '六個月規定一秒判斷能不能出國', kw: '護照 效期 六個月 到期 換發 申根 入境 有效期' },

  /* ---------- 台灣生活 ---------- */
  { slug: 'mortgage', cat: 'tw', icon: '🏠', name: '房貸試算',
    desc: '本息本金攤還、寬限期、提前還款', kw: '房貸 貸款 試算 利息 攤還 寬限期' },
  { slug: 'salary', cat: 'tw', icon: '💰', name: '薪資實領計算',
    desc: '勞健保、勞退扣完實領多少', kw: '薪資 勞保 健保 勞退 實領 扣款' },
  { slug: 'income-tax', cat: 'tw', icon: '📋', name: '綜合所得稅試算',
    desc: '免稅額扣除額算應繳稅額', kw: '所得稅 報稅 綜所稅 稅率 扣除額' },
  { slug: 'fuel', cat: 'tw', icon: '⛽', name: '油錢與里程計算',
    desc: '算油耗、單趟油錢與每人分攤', kw: '油錢 油耗 公里 加油 里程 分攤' },
  { slug: 'invoice', cat: 'tw', icon: '🧾', name: '統一發票對獎',
    desc: '輸入號碼比對本期中獎號碼', kw: '發票 對獎 統一發票 中獎號碼 兌獎' },
  { slug: 'annual-leave', cat: 'tw', icon: '🏖️', name: '特休天數計算',
    desc: '依到職日算年資與應有特休', kw: '特休 年假 特別休假 年資 勞基法 天數' },
  { slug: 'overtime', cat: 'tw', icon: '🕗', name: '加班費計算',
    desc: '平日、休息日、國定假日費率', kw: '加班費 延長工時 休息日 加班 時薪 勞基法' },
  { slug: 'severance', cat: 'tw', icon: '📤', name: '資遣費計算',
    desc: '新舊制年資分開算應領金額', kw: '資遣費 資遣 遣散費 年資 新制 舊制' },

  /* ---------- 裝置檢測 ---------- */
  { slug: 'keyboard-test', cat: 'device', icon: '⌨️', name: '鍵盤按鍵測試',
    desc: '檢查有沒有卡鍵或失靈', kw: '鍵盤 測試 按鍵 卡鍵 失靈 檢測' },
  { slug: 'av-test', cat: 'device', icon: '🎙️', name: '麥克風與鏡頭測試',
    desc: '開會前先確認收音與畫面', kw: '麥克風 鏡頭 視訊 測試 收音 webcam' },
  { slug: 'screen-test', cat: 'device', icon: '🔳', name: '螢幕壞點檢測',
    desc: '純色全螢幕找亮點與暗點', kw: '螢幕 壞點 亮點 檢測 液晶 dead pixel' },
  { slug: 'typing', cat: 'device', icon: '⌨️', name: '打字速度測試',
    desc: '測每分鐘字數與正確率', kw: '打字 速度 測試 wpm 中打 英打 正確率' },

  /* ---------- 台灣生活（續） ---------- */
  { slug: 'electricity', cat: 'tw', icon: '💡', name: '電費計算',
    desc: '台電累進電價，夏月非夏月分開算', kw: '電費 台電 度數 夏月 累進 冷氣' },
  { slug: 'stock-fee', cat: 'tw', icon: '📈', name: '股票手續費計算',
    desc: '手續費、證交稅與損益兩平價', kw: '股票 手續費 證交稅 台股 損益 折扣' },
  { slug: 'tax-id', cat: 'tw', icon: '🏢', name: '統一編號驗證',
    desc: '檢查公司統編格式是否正確', kw: '統編 統一編號 公司行號 驗證 檢查碼' },
  { slug: 'car-tax', cat: 'tw', icon: '🚗', name: '牌照稅燃料費試算',
    desc: '按排氣量算車稅，附級距懸崖提醒', kw: '牌照稅 燃料稅 汽燃費 公路養管費 車稅 排氣量 cc 機車 電動車' },
  { slug: 'nhi-supplement', cat: 'tw', icon: '🏥', name: '二代健保補充保費',
    desc: '股利租金兼職獎金要扣多少', kw: '二代健保 補充保費 健保 股利 租金 兼職 獎金 利息 2.11' },

  /* ---------- 計算換算（續） ---------- */
  { slug: 'compound', cat: 'calc', icon: '📊', name: '複利與定存試算',
    desc: '單筆與定期定額的本利和', kw: '複利 定存 利息 年化 報酬 存錢 試算' },
  { slug: 'tdee', cat: 'calc', icon: '🔥', name: 'TDEE 基礎代謝計算',
    desc: '算 BMR 與每日總消耗，附熱量目標', kw: 'tdee bmr 基礎代謝 熱量 減脂 增肌 卡路里 每日消耗' },
  { slug: 'discount', cat: 'calc', icon: '🏷️', name: '折扣比價計算機',
    desc: '促銷換算成折數，每單位價格比一比', kw: '折扣 打折 幾折 第二件 買一送一 滿額 比價 每單位 便宜' }
];

/* 便利查詢 */
const byCat = id => TOOLS.filter(t => t.cat === id);
const getTool = slug => TOOLS.find(t => t.slug === slug);
const getCat = id => CATEGORIES.find(c => c.id === id);
