// 台股相關題目 (小火龍)
const twStockQuestions = [
  {
    question: "台積電的股票代號?",
    options: ["1.0050", "2.2330", "3.2317"],
    answer: 2,
    hint: "這家公司是台灣的「護國神山」。",
  },
  {
    question: "由元大發行成分股包含台灣前50大公司的股票代號為？",
    options: ["1.006208", "2.0500", "3.0050"],
    answer: 3,
    hint: "前(50)大。",
  },
  {
    question: "12/9之前 台積電最高股價是多少？",
    options: ["1.1525", "2.1480", "3.1545"],
    answer: 1,
    hint: "最高點的日期在10/31。",
  },
  {
    question: "台灣證券交易所的股票漲跌幅限制目前是多少？",
    options: ["1.7%", "2.10%", "3.15%"],
    answer: 2,
    hint: "以前是7%，後來放寬了。",
  },
  {
    question: "股市用語「韭菜」通常指誰？",
    options: ["1.主力大戶", "2.賺大錢的人", "3.被收割的散戶"],
    answer: 3,
    hint: "指容易賠錢、被大戶收割的散戶。",
  },
  {
    question: "股票術語「除息」代表什麼？",
    options: ["1.公司發放現金股利", "2.公司倒閉", "3.股價創新高"],
    answer: 1,
    hint: "股價會扣除相應的金額。",
  },
];

// 加密貨幣相關題目 (伊布)
const cryptoQuestions = [
  {
    question: "比特幣的單位是什麼？",
    options: ["1.bit", "2.聰", "3.coin"],
    answer: 2,
    hint: "創造者名為中本聰。",
  },
  {
    question: "比特幣可分割至小數點後幾位數？",
    options: ["1.8", "2.10", "3.7"],
    answer: 1,
    hint: "你可以購買0.00000001顆比特幣。",
  },
  {
    question: "比特幣最多會有多少顆？",
    options: ["1.4000萬顆", "2.無限發行", "3.2100萬顆"],
    answer: 3,
    hint: "有人稱之為數位黃金。",
  },
  {
    question: "何者為穩定幣？",
    options: ["1.ETH", "2.DOGE", "3.USDT"],
    answer: 3,
    hint: "穩定幣與美元掛鉤。",
  },
  {
    question: "以太坊的創始人是誰？",
    options: ["1.中本聰", "2.維塔利克·布特林", "3.伊龍·馬斯克"],
    answer: 2,
    hint: "俄羅斯裔加拿大人。",
  },
  {
    question: "哪一個不是加密貨幣交易所？",
    options: ["1.Binance", "2.Coinbase", "3.Amazon"],
    answer: 3,
    hint: "它是全球最大的電商平台。",
  },
  {
    question: "加密貨幣中的「挖礦」是指什麼？",
    options: ["1.在地下挖寶", "2.驗證交易並獲取獎勵", "3.駭客攻擊"],
    answer: 2,
    hint: "這是維護區塊鏈運作的過程。",
  },
  {
    question: "區塊鏈(Blockchain)的主要特性是什麼？",
    options: ["1.中心化管理", "2.去中心化與不可篡改", "3.完全匿名且無法追蹤"],
    answer: 2,
    hint: "資料分散在各個節點，難以被單一控制。",
  },
];

// 美股相關題目 (傑尼龜)
const usStockQuestions = [
  {
    question: "何者非追蹤美國前500大公司的指數？",
    options: ["1. QQQ", "2. SPY", "3. VOO"],
    answer: 1,
    hint: "又稱標普500。",
  },
  {
    question: "曾經由多位諾獎得主和聯準會前主席等人物組成的夢幻團隊 公司名為？",
    options: ["1.TSMC", "2.JPMorgan", "3.LTCM"],
    answer: 3,
    hint: "全名為長期資本管理公司。",
  },
  {
    question: "股票市場中，「牛市」代表什麼？",
    options: ["1.股價下跌", "2.股價持平", "3.股價上漲"],
    answer: 3,
    hint: "想像牛角往上頂。",
  },
  {
    question: "股票市場中，「熊市」代表什麼？",
    options: ["1.股價下跌", "2.股價上漲", "3.股價波動劇烈"],
    answer: 1,
    hint: "想像熊掌往下揮。",
  },
  {
    question: "美股代號 NVDA 是哪家公司？",
    options: ["1.微軟", "2.輝達", "3.特斯拉"],
    answer: 2,
    hint: "AI 晶片龍頭。",
  },
  {
    question: "股神巴菲特掌管的公司叫什麼？",
    options: ["1.波克夏海瑟威", "2.高盛", "3.摩根大通"],
    answer: 1,
    hint: "股價非常高的一家控股公司。",
  },
  {
    question: "IPO 是什麼縮寫？",
    options: ["1.首次公開募股", "2.國際警察組織", "3.個人電腦操作"],
    answer: 1,
    hint: "公司第一次將股票賣給大眾。",
  },
  {
    question: "投資報酬率的英文縮寫是？",
    options: ["1.CEO", "2.KPI", "3.ROI"],
    answer: 3,
    hint: "Return On Investment。",
  },
];