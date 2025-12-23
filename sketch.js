// Game state management
let gameState = 'START_SCREEN'; // START_SCREEN, MOVING, ASKING, ANSWERED, FINALE, SCENE_DIALOGUE
let finaleCatchCount = 0; // 結局抓捕計數
let screenShake = 0; // 畫面震動計時器
let projectiles = []; // 儲存發射物
let clones = []; // 儲存分身
let playerAmmo = 5; // 玩家彈藥
let lastAmmoReloadTime = 0; // 彈藥裝填計時
let currentDialogueLines = []; // 對話內容
let currentDialogueIndex = 0; // 對話進度
let optionButtons = []; // 存放選項按鈕區域
let showHowToPlay = false; // 是否顯示玩法介紹
let showAbout = false; // 是否顯示遊戲主旨
let startScreenParticles = []; // 開始畫面粒子

let transition = {
  active: false,
  state: 'IN', // 'IN', 'HOLD', 'OUT'
  progress: 0,
  speed: 0.02,
  holdTimer: 0,
  nextState: null // 用於儲存轉場後的目標狀態
};
let recoveryState = 'NONE'; // NONE, ANIMATING, DONE
let recoveryStartTime = 0;

// 角色物件
let player;
let savedMapPos = { x: 0, y: 0 }; // 儲存玩家在進入房間前的地圖位置
let questioners = [];
let hintGiver;
let playerSpeech = null; // 用於儲存玩家的對話
let hintGiverSpeech = null;
let questionPrompt = null;// 用於儲存提示者的對話
// 圖片資源
let playerStandSprite;
let playerMoveSprite;
let playerRightSprite;
let playerWrongSprite;
let q1Sprite;
let q2Sprite;
let q3Sprite;
let hintGiverSprite;
let bgImage; // 背景圖片

// 角色縮放比例
const playerScale = 2.5;
const questionerScale = 4.0; // 將提問者放大

// 互動與問答相關變數
let activeQuestioner = null;
let currentQuestion = null;
let feedbackMessage = '';
let feedbackTimer = 0;
let hintTimer = 0; // 提示顯示計時器
let closeButton = {}; // 用於存放關閉按鈕的屬性
let hintButton = {}; // 用於存放提示按鈕的屬性
let yesButton = {}; // 存放 '是' 按鈕屬性
let noButton = {}; // 存放 '否' 按鈕屬性
let playAgainYesButton = {}; // 存放 '再玩一次' 的 '是' 按鈕
let playAgainNoButton = {}; // 存放 '再玩一次' 的 '否' 按鈕

// 攝影機/視角 物件
let camera = { x: 0, y: 0 };
let moonwalkMode = false; // 預設為一般模式，按下 M 鍵切換

// 提問者反應文字
const correctPhrases = ["答對了，好厲害！", "真聰明！", "恭喜你！", "表現得很好喔！"];
const wrongPhrases = ["差一點點，再加油！", "沒關係，再試一次吧。", "這個答案好像不對喔。", "別灰心，你可以的！"];

// --- 新增：星空效果物件 ---
let celestialEffect = {
  isActive: false,
  particles: [],
  x: 0, y: 0, radius: 250,
  finaleStartTime: 0, // 用於結局動畫計時
  isFrozen: false, // 用於結局靜止
  isExpanding: false // 用於控制黑色擴散轉場
};
/**
 * p5.js 的 preload 函數，在 setup() 之前執行
 * 用於預先載入所有外部資源 (例如圖片、聲音、字體)
 * 確保資源在程式開始時就已準備就緒
 */
function preload() {
  // 載入玩家圖片
  playerStandSprite = loadImage('stand/00.png'); // 靜止 (79x39, 2幀)
  playerMoveSprite = loadImage('move/00.png');   // 移動 (163x39, 4幀)
  playerRightSprite = loadImage('right/00.png'); // 答對 (81x40, 2幀)
  playerWrongSprite = loadImage('roung/00.png'); // 答錯 (85x38, 2幀)

  // 載入提問者圖片
  q1Sprite = loadImage('Q1/00.png'); // 91x23, 4幀
  q2Sprite = loadImage('Q2/00.png'); // 83x20, 4幀
  q3Sprite = loadImage('Q3/00.png'); // 175x24, 6幀
  hintGiverSprite = loadImage('AN/00.png'); // 提示者 (291x31, 8幀)

  // 載入背景圖片
  bgImage = loadImage('background/origbig.png');

}

/**
 * p5.js 的 setup 函數，只會在程式開始時執行一次
 * 用於初始化設定，例如畫布大小、物件初始狀態等
 */
function setup() {
  createCanvas(windowWidth, windowHeight); // 創建全螢幕畫布

  // 初始化提示者物件
  hintGiver = {
    x: 150, // 固定在螢幕左側 150px 的位置
    y: height - 80, // 固定在螢幕下方 80px 的位置
    img: hintGiverSprite,
    w: 291 / 8,
    h: 31,
    totalFrames: 8,
    currentFrame: 0,
    frameDelay: 10,
    scale: 3.0
    ,
    speedX: 2.0, // 再次提高夢幻的基礎速度
    speedY: 1.5 // 再次提高夢幻的基礎速度
  };


  // 初始化提問者物件陣列
  questioners.push({
    id: 'q1', // 伊布 (加密貨幣)
    x: -1200,
    y: height * 0.75, // 移到畫面下方
    reaction: null, // 'correct' 或 'wrong'
    reactionText: '', // 儲存反應文字
    correctAnswersCount: 0, // 追蹤此提問者被答對的次數
    cooldownUntil: 0, // 互動冷卻計時器
    img: q1Sprite,
    w: 91 / 4,
    h: 23,
    totalFrames: 4,
    currentFrame: 0,
    frameDelay: 15,
    questions: [...cryptoQuestions] // 分配加密貨幣題庫
  });
  questioners.push({
    id: 'q2', // 小火龍 (台股)
    x: 1300,
    y: height * 0.7, // 移到畫面下方
    reaction: null,
    reactionText: '',
    correctAnswersCount: 0,
    cooldownUntil: 0,
    img: q2Sprite,
    w: 83 / 4,
    h: 20,
    totalFrames: 4,
    currentFrame: 0,
    frameDelay: 15,
    questions: [...twStockQuestions] // 分配台股題庫
  });
  questioners.push({
    id: 'q3', // 傑尼龜 (美股)
    x: 100,
    y: height * 0.85, // 移到畫面更下方
    reaction: null,
    reactionText: '',
    correctAnswersCount: 0,
    cooldownUntil: 0,
    img: q3Sprite,
    w: 175 / 6,
    h: 24,
    totalFrames: 6,
    currentFrame: 0,
    frameDelay: 12,
    questions: [...usStockQuestions] // 分配美股題庫
  });

  // --- 計算提問者的中心點來設定玩家初始位置 ---
  let centerX = 0;
  let centerY = 0;
  for (let q of questioners) {
    centerX += q.x;
    centerY += q.y;
  }
  centerX /= questioners.length;
  centerY /= questioners.length;

  // 初始化玩家物件
  player = {
    x: centerX,
    y: centerY - 100, 
    speed: 4, // 稍微降低玩家移動速度
    isMoving: false,
    direction: -1, // -1 表示向左, 1 表示向右 (預設朝左)
    feedbackState: null, // 'correct' 或 'wrong'
    // 動畫相關屬性
    animation: {
      stand: {
        img: playerStandSprite,
        w: 79 / 2,  // 39.5
        h: 39,
        totalFrames: 2
      },
      move: {
        img: playerMoveSprite,
        w: 163 / 4, // 40.75
        h: 39,
        totalFrames: 4
      },
      right: {
        img: playerRightSprite,
        w: 81 / 2,
        h: 40,
        totalFrames: 2
      },
      wrong: {
        img: playerWrongSprite,
        w: 85 / 2,
        h: 38,
        totalFrames: 2
      },
      currentFrame: 0,
      frameDelay: 10 // 每 10 個繪圖幀更新一次動畫
    }
  };
}

/**
 * p5.js 的 draw 函數，會以每秒約 60 次的頻率不斷重複執行
 * 所有動畫、互動和繪圖都發生在這裡
 */
function draw() {
  // 如果是開始畫面
  if (gameState === 'START_SCREEN') {
    drawStartScreen();
    if (transition.active) drawTransition();
    return;
  }

  // 如果是結局狀態，執行獨立的繪圖邏輯
  if (gameState === 'FINALE') {
    drawFinale();
    return;
  }
  
  // 如果是室內場景狀態 (問答或對話)
  if (gameState === 'SCENE_DIALOGUE' || gameState === 'ASKING' || gameState === 'ANSWERED') {
    drawRoomEnvironment(); // 繪製背景和角色

    if (gameState === 'SCENE_DIALOGUE') {
      // 確保索引在範圍內才繪製對話框，避免 undefined
      if (currentDialogueIndex < currentDialogueLines.length) {
        drawDialogueBox();
      }
    } else if (gameState === 'ASKING') {
      displayQuestion();
      displayTimedHint();
    } else if (gameState === 'ANSWERED') {
      displayFeedback();
    }
    // 確保在此狀態下也能執行並繪製轉場動畫，否則對話結束後會卡住
    if (transition.active) drawTransition();
    return;
  }

  // --- 更新攝影機 ---
  // 讓攝影機的 x 位置平滑地跟隨玩家，創造出玩家在畫面中央，背景移動的效果
  // lerp(start, stop, amt) 計算兩點之間的線性內插值
  camera.x = lerp(camera.x, player.x - width / 2, 0.1);

  // --- 繪製世界 (會隨攝影機移動的物件) ---
  background(210, 240, 255); // 先畫一個底色，以防圖片沒填滿
  push();
  translate(-camera.x, 0); // 將整個畫布根據攝影機位置進行平移
  
  // --- 繪製背景 ---
  // 計算保持長寬比填滿螢幕高度所需的寬度
  const bgAspectRatio = bgImage.width / bgImage.height;
  const bgDrawWidth = height * bgAspectRatio;
  
  // --- 實現無限滾動背景 ---
  // 1. 計算攝影機在一個背景寬度內的相對偏移量
  const offsetX = camera.x % bgDrawWidth;
  // 2. 根據偏移量，計算第一個背景圖的起始繪製位置
  const startX = camera.x - offsetX;
  
  // 3. 繪製多張背景圖以填滿畫面，並確保無縫銜接
  imageMode(CORNER);
  image(bgImage, startX - bgDrawWidth, 0, bgDrawWidth, height); // 繪製在當前畫面左側的圖
  image(bgImage, startX, 0, bgDrawWidth, height);               // 繪製在當前畫面的圖
  image(bgImage, startX + bgDrawWidth, 0, bgDrawWidth, height); // 繪製在當前畫面右側的圖

  // 繪製所有角色 (他們的位置是世界座標，會被 translate 影響)
  drawPlayer();
  drawQuestioners();

  // --- 新增：繪製星空效果 ---
  if (celestialEffect.isActive) {
    drawCelestialEffect();
  }

  pop(); // 恢復畫布，讓接下來的 UI 不會被攝影機移動影響

  // --- 繪製 UI (固定在螢幕上的物件) ---

  // 將提示者移到 UI 層繪製，使其固定在螢幕上
  moveHintGiver(); // 更新提示者的位置
  drawHintGiver();

  // 根據遊戲狀態執行不同邏輯
  if (gameState === 'MOVING') {
    movePlayer();
    checkInteractions();
    drawHUD(); // 繪製寶石蒐集介面
  } else if (gameState === 'PROMPT') {
     //當問題出現時，讓玩家停止移動動畫
     player.isMoving = false;
    displayPrompt();
   }

  // --- 檢查是否在星雲內並顯示勝利畫面 ---
  if (celestialEffect.isActive) {
    const playerDist = dist(player.x, player.y, celestialEffect.x, celestialEffect.y);
    // 當玩家進入圈圈時，觸發擴散
    if (playerDist < celestialEffect.radius && !celestialEffect.isExpanding) {
      celestialEffect.isExpanding = true;
    }
  }

  // 處理黑色擴散轉場
  if (celestialEffect.isExpanding) {
    celestialEffect.radius += 30; // 擴散速度
    if (celestialEffect.radius > width * 2) { // 確保覆蓋全螢幕
      startFinale();
      celestialEffect.isExpanding = false;
    }
  }

  // 如果轉場動畫正在進行，繪製轉場
  if (transition.active) drawTransition();
}

/**
 * 繪製玩家角色
 */
function drawPlayer() {
  let anim;
  // 1. 優先檢查玩家是否有回饋狀態 (無論遊戲狀態為何)
  if (player.feedbackState) {
    if (player.feedbackState === 'correct') {
      anim = player.animation.right;
    } else {
      anim = player.animation.wrong;
    }
  // 2. 檢查是否在左右移動 (且不在問答中)
  } else if (gameState === 'MOVING' && (keyIsDown(65) || keyIsDown(68))) { // A or D
    anim = player.animation.move;
  // 3. 最後才是靜止狀態
  } else { 
    anim = player.animation.stand;
  }

  // 更新動畫幀 (只有在移動或站立動畫有多幀時才有效果)
  if (frameCount % player.animation.frameDelay === 0) {
    player.animation.currentFrame = (player.animation.currentFrame + 1) % anim.totalFrames;
  }

  // 計算目前要顯示的影格在圖片中的 x 座標
  let frameX = player.animation.currentFrame * anim.w;

  // 使用 image() 的裁切功能來繪製單一影格
  imageMode(CENTER); // 這裡的模式只影響這個函式內部
  
  push(); // 保存當前的繪圖狀態
  translate(player.x, player.y); // 將座標原點移動到玩家中心
  
  // 只有在使用側面行走動畫時，才需要根據方向翻轉圖片
  if (player.direction !== 0) { 
    let scaleX = player.direction;
    if (moonwalkMode) {
      scaleX *= -1; // 按下 M 時圖片交換 (反轉)
    }
    scale(scaleX, 1); 
  }

  image(anim.img, 0, 0, anim.w * playerScale, anim.h * playerScale, frameX, 0, anim.w, anim.h);
  pop(); // 恢復繪圖狀態

  // --- 繪製玩家對話框 ---
  if (playerSpeech && gameState === 'MOVING') {
    fill(255);
    stroke(0);
    strokeWeight(2);
    rectMode(CENTER);
    textAlign(CENTER, CENTER);
    textSize(16);

    let textW = textWidth(playerSpeech) + 20;
    let textH = 40;
    // 將對話框放在玩家頭頂
    let bubbleX = player.x;
    let bubbleY = player.y - (anim.h * playerScale / 2) - 30;

    rect(bubbleX, bubbleY, textW, textH, 10);

    noStroke();
    fill(0);
    text(playerSpeech, bubbleX, bubbleY);
  }
}

/**
 * 繪製所有提問者
 */
function drawQuestioners() {
  imageMode(CENTER);
  for (let q of questioners) {
    // 更新每個提問者自己的動畫幀
    if (frameCount % q.frameDelay === 0) {
      q.currentFrame = (q.currentFrame + 1) % q.totalFrames;
    }

    let frameX = q.currentFrame * q.w;
    let drawX = q.x;
    let drawY = q.y;

    // --- 提問者反應動畫 ---
    // 只有在答題回饋階段，且是當前的提問者，才執行反應動畫
    if (q.reaction) { // 只要有反應狀態就執行
      if (q.reaction === 'correct') {
        // 開心反應：上下跳動
        drawY += sin(frameCount * 0.5) * 5;
      } else if (q.reaction === 'wrong') {
        // 失望反應：左右搖晃
        drawX += sin(frameCount * 0.8) * 5;
      }
    }

    // 如果此提問者已被答對三次，就將它變灰
    if (q.correctAnswersCount >= 3) {
      push();
      tint(150, 150); // 套用灰色濾鏡
      image(q.img, drawX, drawY, q.w * questionerScale, q.h * questionerScale, frameX, 0, q.w, q.h);
      pop();
    } else {
      image(q.img, drawX, drawY, q.w * questionerScale, q.h * questionerScale, frameX, 0, q.w, q.h);
    }

    // --- 繪製反應文字對話框 ---
    drawReactionText(q);

  }
}

/**
 * 繪製提問者的反應文字
 * @param {object} q - The questioner object.
 */
function drawReactionText(q) {
  if (!q.reactionText) return;

  let bubbleX = q.x;
  let textX = q.x;

  if (q.reactionText === "孬種，有種回答！") {
    bubbleX -= 30;
    textX -= 70;
  } else {
    textX = bubbleX;
  }

  const bubbleY = q.y - (q.h * questionerScale / 2) - 40; // 統一放在頭頂
  const textContent = q.reactionText;
  const textW = textWidth(textContent) + 30;
  const textH = 50;

  // 如果是答對的反應，使用新的、更華麗的對話框
  if (q.reaction === 'correct') {
    push();
    // 繪製外框
    fill(255, 250, 205); // 檸檬雪紡色
    stroke(255, 215, 0); // 金色
    strokeWeight(3);
    rectMode(CENTER);
    rect(bubbleX, bubbleY, textW, textH, 15);

    // 繪製文字
    noStroke();
    fill(50); // 深灰色文字
    textSize(18);
    textStyle(BOLD);
    text(textContent, textX, bubbleY);
    pop(); 
  } else { // 其他反應 (例如答錯、放棄) 使用原本的普通對話框
    fill(255);
    stroke(0);
    strokeWeight(2);
    rectMode(CENTER);
    rect(bubbleX, bubbleY, textW, textH - 10, 10);
    noStroke();
    fill(0);
    textSize(16);
    text(textContent, textX, bubbleY);
  }
}
/**
 * 繪製提示者
 */
function drawHintGiver() {
  imageMode(CENTER);
  // 更新動畫幀
  if (frameCount % hintGiver.frameDelay === 0) {
    hintGiver.currentFrame = (hintGiver.currentFrame + 1) % hintGiver.totalFrames;
  }

  let frameX = hintGiver.currentFrame * hintGiver.w;
  image(hintGiver.img, hintGiver.x, hintGiver.y, hintGiver.w * hintGiver.scale, hintGiver.h * hintGiver.scale, frameX, 0, hintGiver.w, hintGiver.h);

  // --- 繪製提示者對話框 ---
  if (hintGiverSpeech) {
    fill(255);
    stroke(0);
    strokeWeight(2);
    rectMode(CENTER);
    textAlign(CENTER, CENTER);
    textSize(16);

    let textW = textWidth(hintGiverSpeech) + 20;
    let textH = 40;
    let bubbleX;
    let bubbleY = hintGiver.y;
    let buffer = 10; // Minimum distance from the edge

    // 判斷提示者在螢幕的哪一側，來決定對話框位置
    if (hintGiver.x < width / 2) {
      bubbleX = hintGiver.x + (hintGiver.w * hintGiver.scale / 2) + (textW / 2) + 10;
       // Adjust if bubble exceeds right boundary
      if (bubbleX + textW/2 > width - buffer) {
        bubbleX = width - buffer - textW/2;
      }
    } else {
      bubbleX = hintGiver.x - (hintGiver.w * hintGiver.scale / 2) - (textW / 2) - 10;
       // Adjust if bubble exceeds left boundary
      if (bubbleX - textW/2 < buffer) {
        bubbleX = buffer + textW/2;
      }
    }

    rect(bubbleX, bubbleY, textW, textH, 10);

    noStroke();
    fill(0);
    text(hintGiverSpeech, bubbleX, bubbleY);
  }
}

/**
 * 處理提示者的移動邏輯
 */
function moveHintGiver() {
  // 更新提示者的位置
  hintGiver.x += hintGiver.speedX;
  hintGiver.y += hintGiver.speedY;

  // 計算提示者的繪製尺寸
  const halfW = (hintGiver.w * hintGiver.scale) / 2;
  const halfH = (hintGiver.h * hintGiver.scale) / 2;

  // 檢查並反轉水平方向
  if (hintGiver.x < halfW) {
    hintGiver.x = halfW; // 將位置拉回邊界內，避免卡住
    hintGiver.speedX *= -1;
  } else if (hintGiver.x > width - halfW) {
    hintGiver.x = width - halfW; // 將位置拉回邊界內
    hintGiver.speedX *= -1;
  }
  // 檢查並反轉垂直方向
  if (hintGiver.y < halfH) {
    hintGiver.y = halfH; // 將位置拉回邊界內
    hintGiver.speedY *= -1;
  } else if (hintGiver.y > height - halfH) {
    hintGiver.y = height - halfH; // 將位置拉回邊界內
    hintGiver.speedY *= -1;
  }
}

/**
 * 處理玩家的移動邏輯
 */
function movePlayer() {
  // 檢查是否有任何方向鍵被按下
  player.isMoving = keyIsDown(65) || keyIsDown(68) || keyIsDown(87) || keyIsDown(83); // A, D, W, S

  if ((keyIsDown(65) || keyIsDown(68)) && moonwalkMode) { // A or D
    playerSpeech = "我是Michael Jackson";
  } else {
    playerSpeech = null;
  }

  if (keyIsDown(65)) { // A
    player.x -= player.speed;
    player.direction = 1; // 更新方向為向右 (圖像交換)
  }
  if (keyIsDown(68)) { // D
    player.x += player.speed;
    player.direction = -1; // 更新方向為向左 (圖像交換)
  }
  if (keyIsDown(87)) { player.y -= player.speed; } // W
  if (keyIsDown(83)) { player.y += player.speed; } // S

  // 限制玩家的垂直移動範圍
  let playerHeight = player.animation.stand.h * playerScale;
  player.y = constrain(player.y, playerHeight / 2, height - playerHeight / 2);
}

/**
 * 當瀏覽器視窗大小改變時，p5.js 會自動呼叫此函數
 */
function windowResized() {
  // 重新設定畫布大小
  resizeCanvas(windowWidth, windowHeight);
}

/**
 * 檢查玩家與提問者的互動
 */
function checkInteractions() {
  // --- 檢查是否所有提問者都已完成 ---
  const allSatisfied = questioners.every(q => q.correctAnswersCount >= 3);
  if (allSatisfied && !celestialEffect.isActive) {
    activateCelestialEffect(); // 如果全部完成且效果尚未啟動，則啟動效果
  }

  for (let q of questioners) {
    // 計算碰撞距離
    let playerSize = (player.animation.stand.w * playerScale) / 2;
    let questionerSize = (q.w * questionerScale) / 2;
    let d = dist(player.x, player.y, q.x, q.y);

    // 根據提問者狀態決定互動
    if (q.correctAnswersCount >= 3) {
      // 如果提問者已完成，靠近時顯示提示
      if (d < playerSize + questionerSize) {
        q.reactionText = "按.按..按M";
      } else if (q.reactionText === "按.按..按M") {
        // 離開時清除提示
        q.reactionText = null;
      }
    } else {
      // 如果提問者未完成，靠近時觸發提問
      if (d < playerSize + questionerSize && millis() > q.cooldownUntil && q.questions.length > 0) {
        gameState = 'PROMPT';
        activeQuestioner = q;
        questionPrompt = "挑戰者，你敢回答我的問題嗎？";
        let randomIndex = floor(random(q.questions.length));
        currentQuestion = q.questions[randomIndex];
        return; // 觸發一個後就停止檢查
      }
    }
  }

  // 檢查與提示者的互動
  let playerSize = (player.animation.stand.w * playerScale) / 2;
  let hintGiverSize = (hintGiver.w * hintGiver.scale) / 2;
  // 由於提示者現在是螢幕座標，我們需要將玩家的世界座標轉換為螢幕座標來計算距離
  let playerScreenX = player.x - camera.x;
  let playerScreenY = player.y;
  let dToHintGiver = dist(playerScreenX, playerScreenY, hintGiver.x, hintGiver.y);

  if (dToHintGiver < playerSize + hintGiverSize) {
    hintGiverSpeech = "瞅啥 我是你爹";
  } else {
    hintGiverSpeech = null; // 玩家離開時清除對話
  }
}

/**
 * --- 新增：啟動星空效果 ---
 */
function activateCelestialEffect() {
  celestialEffect.isActive = true;

  // 計算效果中心點 (所有提問者的中心上方)
  let centerX = 0;
  questioners.forEach(q => centerX += q.x);
  celestialEffect.x = centerX / questioners.length;
  celestialEffect.y = height * 0.3; // 固定在天空較高的位置

  // 在圓形區域內生成 150 個粒子
  for (let i = 0; i < 150; i++) {
    let angle = random(TWO_PI);
    let r = celestialEffect.radius * sqrt(random()); // 使用 sqrt 讓粒子分佈更均勻
    let pX = celestialEffect.x + r * cos(angle);
    let pY = celestialEffect.y + r * sin(angle);
    celestialEffect.particles.push({
      pos: createVector(pX, pY),
      vel: p5.Vector.random2D().mult(random(0.2, 0.8)) // 降低粒子速度
    });
  }
}

/**
 * --- 新增：啟動結局動畫 ---
 */
function startFinale() {
  gameState = 'FINALE';
  finaleCatchCount = 0; // 重置計數
  hintGiverSpeech = null; // 清除之前的對話
  playerSpeech = null; // 清除玩家對話
  // 將玩家放置在螢幕中央，準備在結局場景中移動
  player.x = width / 2;
  player.y = height / 2;
  player.speed = 3; // 結局時降低皮卡丘速度
  player.animation.frameDelay = 15; // 結局時減慢動畫速度
  
  projectiles = []; // 重置發射物
  clones = []; // 重置分身
  hintGiver.stunEndTime = 0; // 重置暈眩時間
  player.stunEndTime = 0; // 重置玩家暈眩
  playerAmmo = 5; // 重置彈藥
  lastAmmoReloadTime = millis(); // 重置裝填時間
  recoveryState = 'NONE'; // 重置恢復動畫狀態

  celestialEffect.finaleStartTime = millis(); // 重新啟用結局計時器
  celestialEffect.particles = []; // 清空舊粒子

  // 移除初始粒子生成，改在 drawFinale 中漸進生成

  // 結局開始時，讓夢幻的速度更難預測
  if (random(1) > 0.5) {
    hintGiver.speedX *= -1;
  }
}

/**
 * --- 新增：繪製星空效果 ---
 */
function drawCelestialEffect() {
  const particles = celestialEffect.particles;
  // 在 FINALE 狀態下，效果範圍是整個螢幕
  const isFinale = gameState === 'FINALE';

  const centerX = celestialEffect.x;
  const centerY = celestialEffect.y;
  const radius = celestialEffect.radius;
  const connectionThreshold = 80; // 粒子間開始連線的最大距離

  // --- 繪製黑色背景圓 ---
  if (!isFinale) { // 結局模式下不繪製背景圓 (因為背景已經是黑的)
    if (celestialEffect.isExpanding) {
      fill(0); // 擴散時變成實心黑色
    } else {
      fill(0, 0, 0, 150); // 平常是半透明黑色
    }
    noStroke();
    circle(centerX, centerY, radius * 2);
  }

  // --- 更新粒子位置並處理反彈 ---
  for (let p of particles) {
    if (celestialEffect.isExpanding) {
      // 擴散時，粒子快速向外散開
      let dir = createVector(p.pos.x - centerX, p.pos.y - centerY);
      if (dir.mag() === 0) dir = p5.Vector.random2D();
      dir.normalize();
      dir.mult(35); // 速度略快於圓圈擴散速度 (30)，讓粒子看起來是被推著走
      p.pos.add(dir);
    } else {
      p.pos.add(p.vel);
    }
    
    if (isFinale) {
      // 在結局模式下，處理矩形螢幕邊界反彈
      if (p.pos.x < 0 || p.pos.x > width) p.vel.x *= -1;
      if (p.pos.y < 0 || p.pos.y > height) p.vel.y *= -1;
    } else {
      // 在遊戲中，處理圓形邊界反彈
      if (!celestialEffect.isExpanding) { // 只有在不擴散時才限制在圓內
        const d = dist(p.pos.x, p.pos.y, centerX, centerY);
        if (d > radius) {
          p.pos.set(
            centerX + (p.pos.x - centerX) * radius / d,
            centerY + (p.pos.y - centerY) * radius / d
          );
          const normal = createVector(p.pos.x - centerX, p.pos.y - centerY).normalize();
          p.vel.reflect(normal);
        }
      }
    }
  }
  
  // 繪製粒子間的連線
  strokeWeight(0.5);
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const d = dist(particles[i].pos.x, particles[i].pos.y, particles[j].pos.x, particles[j].pos.y);
      if (d < connectionThreshold) {
        // 距離越近，線條越不透明
        const lineAlpha = map(d, connectionThreshold, 0, 0, 150);
        stroke(255, 255, 255, lineAlpha);
        // 在 FINALE 狀態下，線條在整個螢幕繪製
        // 在 MOVING 狀態下，線條只在圓內繪製
        if (isFinale || (dist(particles[i].pos.x, particles[i].pos.y, centerX, centerY) < radius && dist(particles[j].pos.x, particles[j].pos.y, centerX, centerY) < radius)) {
          line(particles[i].pos.x, particles[i].pos.y, particles[j].pos.x, particles[j].pos.y);
        }
      }
    }
  }

  // 只在遊戲中繪製圓形邊界
  if (!isFinale) {
    noFill();
    stroke(255, 255, 255, 50); // 非常淡的白色邊界
    strokeWeight(2);
    circle(centerX, centerY, radius * 2);
  }

  // 繪製粒子點
  noStroke();
  for (let p of particles) {
    // 讓粒子有輕微的閃爍效果
    const particleAlpha = 150 + sin(frameCount * 0.1 + p.pos.x) * 100;
    fill(255, 255, 255, particleAlpha);
    circle(p.pos.x, p.pos.y, 2);
  }
}

/**
 * --- 新增：繪製結局畫面 ---
 */
function drawFinale() {
  background(0); // 全黑背景

  const playerPikaSize = (player.animation.stand.w * playerScale) / 2;
  const hintGiverSize = (hintGiver.w * hintGiver.scale) / 2;

  // --- 震動效果 ---
  push();
  if (screenShake > 0) {
    translate(random(-8, 8), random(-8, 8));
    screenShake--;
  }

  // --- 1. 狀態更新 ---
  const fadeDuration = 4000; // 4 秒內變亮
  const timePassed = millis() - celestialEffect.finaleStartTime;

  // 檢查玩家是否暈眩
  let isPlayerStunned = millis() < (player.stunEndTime || 0);

  // 顏色恢復後才允許移動，且畫面未靜止
  if (timePassed > fadeDuration && !celestialEffect.isFrozen && !isPlayerStunned) {
    movePlayerInFinale();
  } else {
    player.isMoving = false; // 確保在恢復期間，玩家處於非移動狀態
  }

  // --- 2. 繪製背景元素 ---
  // 漸進式生成粒子：隨著時間 (皮卡丘變亮) 增加粒子數量
  const maxParticles = 200;
  const currentTarget = map(timePassed, 0, fadeDuration, 0, maxParticles, true);
  while (celestialEffect.particles.length < currentTarget) {
    celestialEffect.particles.push({
      pos: createVector(random(width), random(height)),
      vel: p5.Vector.random2D().mult(random(0.2, 0.8))
    });
  }

  drawCelestialEffect();

  // --- 彈藥裝填邏輯 ---
  if (playerAmmo < 5 && millis() - lastAmmoReloadTime > 2000) {
    playerAmmo++;
    lastAmmoReloadTime = millis();
  }

  // --- 新增：右上角提示 ---
  fill(255);
  textAlign(RIGHT, TOP);
  textSize(20);
  text(`按 '滑鼠左鍵' 發射電擊讓夢幻停下！ (彈藥: ${playerAmmo}/5)`, width - 20, 20);

  // --- 新增：處理發射物 ---
  for (let i = projectiles.length - 1; i >= 0; i--) {
    let p = projectiles[i];
    p.x += p.vx;
    p.y += p.vy;
    
    // 繪製發射物 (黃色圓球)
    fill(255, 255, 0);
    noStroke();
    circle(p.x, p.y, p.size);
    
    // 檢查是否擊中分身 (噴到分身會麻痺)
    let hitClone = false;
    for (let clone of clones) {
        if (dist(p.x, p.y, clone.x, clone.y) < hintGiverSize + p.size / 2) {
            player.stunEndTime = millis() + 500; // 玩家暈眩 0.5 秒
            projectiles.splice(i, 1);
            hitClone = true;
            break;
        }
    }
    if (hitClone) continue;

    // 檢查是否擊中夢幻
    let d = dist(p.x, p.y, hintGiver.x, hintGiver.y);
    if (d < hintGiverSize + p.size / 2) {
      hintGiver.stunEndTime = millis() + 500; // 暈眩 0.5 秒
      projectiles.splice(i, 1); // 移除發射物
      continue;
    }
    
    // 移除超出畫面的發射物
    if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
      projectiles.splice(i, 1);
    }
  }

  // --- 繪製分身 ---
  for (let clone of clones) {
      if (!celestialEffect.isFrozen) {
          // --- 分身移動邏輯 (仿照本體) ---
          // 隨機擾動
          if (frameCount % 10 === 0) {
             clone.vx += random(-3, 3);
             clone.vy += random(-3, 3);
          }

          // 限制分身最大速度，避免速度無限疊加
          clone.vx = constrain(clone.vx, -8, 8);
          clone.vy = constrain(clone.vy, -8, 8);

          // 更新位置
          clone.x += clone.vx;
          clone.y += clone.vy;

          // 4. 邊界反彈
          if (clone.x < hintGiverSize) { clone.x = hintGiverSize; clone.vx *= -1; }
          else if (clone.x > width - hintGiverSize) { clone.x = width - hintGiverSize; clone.vx *= -1; }
          
          if (clone.y < hintGiverSize) { clone.y = hintGiverSize; clone.vy *= -1; }
          else if (clone.y > height - hintGiverSize) { clone.y = height - hintGiverSize; clone.vy *= -1; }
      }
      let frameX = hintGiver.currentFrame * hintGiver.w;
      image(hintGiver.img, clone.x, clone.y, hintGiver.w * hintGiver.scale, hintGiver.h * hintGiver.scale, frameX, 0, hintGiver.w, hintGiver.h);
      
      // 碰到分身也會暈眩
      if (dist(player.x, player.y, clone.x, clone.y) < playerPikaSize + hintGiverSize) {
          player.stunEndTime = millis() + 500; // 玩家暈眩 0.5 秒
      }

      // 分身也要說話 (跟隨本尊)
      if (hintGiverSpeech) {
        fill(255);
        stroke(0);
        strokeWeight(2);
        rectMode(CENTER);
        textAlign(CENTER, CENTER);
        textSize(16);

        let textW = textWidth(hintGiverSpeech) + 20;
        let textH = 40;
        let bubbleX = clone.x;
        let bubbleY = clone.y - 60;

        rect(bubbleX, bubbleY, textW, textH, 10);

        noStroke();
        fill(0);
        text(hintGiverSpeech, bubbleX, bubbleY);
      }
  }

  // --- 3. 繪製夢幻 ---
  // 檢查是否暈眩
  let isStunned = millis() < (hintGiver.stunEndTime || 0);

  // --- 4. 檢查互動與碰撞 ---
  const dToHintGiver = dist(player.x, player.y, hintGiver.x, hintGiver.y);

  // 當皮卡丘靠近時，夢幻會主動遠離
  const fleeRadius = playerPikaSize + hintGiverSize + 150; // 夢幻開始逃跑的感應範圍
  if (dToHintGiver < fleeRadius && !celestialEffect.isFrozen && !isStunned) {
    // 計算逃跑方向 (從皮卡丘指向夢幻)
    let fleeVec = createVector(hintGiver.x - player.x, hintGiver.y - player.y);
    fleeVec.normalize();
    // 將夢幻的速度方向設定為逃跑方向
    // 距離越近，速度越快
    const minDist = playerPikaSize + hintGiverSize;
    const distClamped = constrain(dToHintGiver, minDist, fleeRadius);
    const fleeSpeed = map(distClamped, minDist, fleeRadius, 15.0, 5.0); // 提高速度：近距離 15，遠距離 5
    hintGiver.speedX = fleeVec.x * fleeSpeed;
    hintGiver.speedY = fleeVec.y * fleeSpeed;
  }

  // 額外的隨機擾動，讓軌跡更不規則
  if (!celestialEffect.isFrozen && frameCount % 10 === 0 && !isStunned) {
    hintGiver.speedX += random(-3, 3);
    hintGiver.speedY += random(-3, 3);
  }

  // 只有在畫面未靜止時才更新夢幻的位置
  if (!celestialEffect.isFrozen && !isStunned) {
    moveHintGiver();
  }
  
  // 暈眩時變色提示
  if (isStunned) {
    tint(255, 100, 100); // 變紅
  }
  drawHintGiver();
  noTint(); // 恢復顏色

  // --- 5. 繪製皮卡丘 ---
  const tintValue = map(timePassed, 0, fadeDuration, 0, 255, true);

  push();
  // 在顏色恢復前固定在中央，恢復後跟隨玩家移動
  if (timePassed > fadeDuration) {
    translate(player.x, player.y);
  } else {
    translate(width / 2, height / 2);
  }
  
  scale(player.direction, 1); // 使用玩家自身的 direction
  tint(tintValue);

  let anim;
  if (player.isMoving) {
    anim = player.animation.move;
  } else {
    anim = player.animation.stand;
  }

  // 更新動畫幀
  if (!celestialEffect.isFrozen && frameCount % player.animation.frameDelay === 0) {
    player.animation.currentFrame = (player.animation.currentFrame + 1) % anim.totalFrames;
  }
  let frameX = player.animation.currentFrame * anim.w;
  imageMode(CENTER);
  image(anim.img, 0, 0, anim.w * playerScale, anim.h * playerScale, frameX, 0, anim.w, anim.h);
  pop();
  noTint(); // 移除濾鏡，確保後續 UI 正常顯示

  // 繪製皮卡丘的對話框 (結局專用)
  if (playerSpeech) {
    fill(255);
    stroke(0);
    strokeWeight(2);
    rectMode(CENTER);
    textAlign(CENTER, CENTER);
    textSize(16);

    let textW = textWidth(playerSpeech) + 20;
    let textH = 40;
    let bubbleX = player.x;
    let bubbleY = player.y - 60;

    rect(bubbleX, bubbleY, textW, textH, 10);

    noStroke();
    fill(0);
    text(playerSpeech, bubbleX, bubbleY);
  }

  // 繪製玩家暈眩提示
  if (isPlayerStunned) {
    fill(255, 0, 0);
    textSize(24);
    textAlign(CENTER, CENTER);
    text("麻痺", player.x, player.y - 90);
  }

  pop(); // 結束震動效果範圍

  // --- 6. 檢查勝利條件並顯示 UI ---
  if (celestialEffect.isFrozen) {
      if (recoveryState === 'NONE') {
          recoveryState = 'ANIMATING';
          recoveryStartTime = millis();
      }
      drawRecoverySequence();
  } else if (dToHintGiver < playerPikaSize + hintGiverSize) {
    if (finaleCatchCount < 3) {
        // 彈開邏輯
        finaleCatchCount++;
        
        // 剩下一次反彈時 (count 變成 2)，分裂成四個
        if (finaleCatchCount === 2) {
            // 產生 3 個分身
            for(let k=0; k<3; k++) {
                clones.push({
                    x: 0, y: 0, // 稍後分配位置
                    vx: random(-6, 6),
                    vy: random(-6, 6)
                });
            }
            
            // 準備 4 個隨機位置並打亂，讓本尊和分身位置混淆
            let positions = [];
            for(let k=0; k<4; k++) {
                positions.push({ x: random(100, width - 100), y: random(100, height - 100) });
            }
            positions = shuffle(positions);
            
            // 分配位置給本尊
            hintGiver.x = positions[0].x;
            hintGiver.y = positions[0].y;
            hintGiver.speedX = random(-6, 6);
            hintGiver.speedY = random(-6, 6);
            
            // 分配位置給分身
            for(let k=0; k<3; k++) {
                clones[k].x = positions[k+1].x;
                clones[k].y = positions[k+1].y;
            }
        }

        // 隨機彈到固定距離以外的位置
        let safeDistance = 400;
        let targetX, targetY;
        let found = false;
        for(let i=0; i<50; i++) {
            targetX = random(width);
            targetY = random(height);
            if(dist(targetX, targetY, hintGiver.x, hintGiver.y) > safeDistance) {
                found = true;
                break;
            }
        }
        if(!found) {
            targetX = width - hintGiver.x;
            targetY = height - hintGiver.y;
        }
        player.x = targetX;
        player.y = targetY;
        
        screenShake = 20; // 觸發震動

        hintGiverSpeech = "走開";
        setTimeout(() => {
            hintGiverSpeech = null;
        }, 3000);
    } else {
        celestialEffect.isFrozen = true; // 觸發靜止
        // 下一幀會進入上面的 if (celestialEffect.isFrozen) 區塊開始動畫
    }
  } else {
    cursor(ARROW);
  }
}

/**
 * --- 新增：在結局場景中處理玩家移動 ---
 */
function movePlayerInFinale() {
  // 檢查是否有任何方向鍵被按下
  player.isMoving = keyIsDown(65) || keyIsDown(68) || keyIsDown(87) || keyIsDown(83); // A, D, W, S

  if (keyIsDown(65)) { // A
    player.x -= player.speed;
    player.direction = 1; // 更新方向為向右 (圖像交換)
  }
  if (keyIsDown(68)) { // D
    player.x += player.speed;
    player.direction = -1; // 更新方向為向左 (圖像交換)
  }
  if (keyIsDown(87)) { // W
    player.y -= player.speed;
  }
  if (keyIsDown(83)) { // S
    player.y += player.speed;
  }

  // 限制玩家不出螢幕邊界
  player.x = constrain(player.x, 0, width);
  player.y = constrain(player.y, 0, height);
}

/**
 * 顯示詢問介面
 */
function displayPrompt() {
  // 繪製半透明背景
  fill(0, 0, 0, 150);
  rectMode(CENTER);
  rect(width / 2, height / 2, width * 0.8, height * 0.3, 20);

  // 繪製問題文字
  fill(255);
  noStroke(); // 確保文字沒有邊框，看起來會比較細
  textAlign(CENTER, CENTER);
  textSize(24);
  text(questionPrompt, width / 2, height * 0.45);

  // --- 定義並繪製按鈕 ---
  const buttonW = 120;
  const buttonH = 50;
  const buttonY = height * 0.55;

  yesButton = {
    x: width / 2 - buttonW - 20,
    y: buttonY,
    w: buttonW,
    h: buttonH
  };

  noButton = {
    x: width / 2 + 20,
    y: buttonY,
    w: buttonW,
    h: buttonH
  };

  // 檢查滑鼠懸停
  const onYes = mouseX > yesButton.x && mouseX < yesButton.x + yesButton.w &&
                mouseY > yesButton.y && mouseY < yesButton.y + yesButton.h;
  const onNo = mouseX > noButton.x && mouseX < noButton.x + noButton.w &&
               mouseY > noButton.y && mouseY < noButton.y + noButton.h;

  // 統一處理滑鼠指標
  if (onYes || onNo) {
    cursor(HAND);
  } else if (gameState === 'PROMPT') { // 只有在 PROMPT 狀態才重設為箭頭
    cursor(ARROW);
  }

  // 繪製 '是' 按鈕
  rectMode(CORNER);
  fill(onYes ? '#4CAF50' : '#8BC34A'); // 綠色系
  rect(yesButton.x, yesButton.y, yesButton.w, yesButton.h, 10);
  fill(255);
  textSize(22);
  textAlign(CENTER, CENTER);
  text("來啊", yesButton.x + yesButton.w / 2, yesButton.y + yesButton.h / 2);

  // 繪製 '否' 按鈕
  fill(onNo ? '#F44336' : '#FF5722'); // 紅色系
  rect(noButton.x, noButton.y, noButton.w, noButton.h, 10);
  fill(255);
  text("不要", noButton.x + noButton.w / 2, noButton.y + noButton.h / 2);
}



/**
 * 處理詢問狀態下的按鍵事件
 */
function promptKeyPressed() {
  if (gameState === 'PROMPT') {
    // 玩家選擇 "是"
    if (key.toUpperCase() === 'Y') {
      if (activeQuestioner) {
        savedMapPos = { x: player.x, y: player.y }; // 記錄當前地圖位置
        activeQuestioner.reactionText = "有點意思，來吧！"; 
        activeQuestioner.reaction = 'correct'; // 顯示開心動畫
      }
      // 觸發轉場進入問答狀態
      transition.active = true;
      transition.state = 'IN';
      transition.nextState = 'ASKING';
      transition.speed = 0.01; // 稍微加快轉場速度 (原本 0.005)

      // 3 秒後清除提問者的反應，避免一直顯示
      setTimeout(() => {
        if (activeQuestioner) activeQuestioner.reaction = null;
        if (activeQuestioner) activeQuestioner.reactionText = null;
      }, 3000);

    // 玩家選擇 "否"
    } else if (key.toUpperCase() === 'N') {
      gameState = 'MOVING';
      let q = activeQuestioner;
      if (q) {
        q.reactionText = "孬種，有種回答！";
        q.reaction = 'wrong'; // 顯示失望動畫
        q.cooldownUntil = millis() + 3000; // 提問者冷卻 3 秒

        // 3 秒後清除提問者的反應
        setTimeout(() => {
          q.reaction = null;
          q.reactionText = null;
        }, 3000);
      }
      questionPrompt = null;
    }
  }
}

/**
 * 繪製抬頭顯示器 (HUD) - 顯示寶石蒐集進度
 */
function drawHUD() {
  // 繪製背景
  fill(0, 0, 0, 150);
  noStroke();
  rectMode(CORNER);
  rect(20, 20, 220, 50, 15);
  
  // 繪製文字
  fill(255, 215, 0); // 金色
  textSize(20);
  textAlign(LEFT, CENTER);
  text("助記詞:", 40, 45);
  
  // 繪製碎片圖示
  // q1: Crypto (Blue), q2: TW (Green), q3: US (Red)
  let startX = 130;
  let gap = 40;
  
  rectMode(CENTER);
  questioners.forEach((q, index) => {
      if (q.correctAnswersCount >= 3) {
          if (q.id === 'q1') fill(0, 191, 255); // 藍色 (加密)
          else if (q.id === 'q2') fill(50, 205, 50); // 綠色 (台股)
          else fill(255, 69, 0); // 紅色 (美股)
          
          drawingContext.shadowBlur = 10;
          drawingContext.shadowColor = 'white';
      } else {
          fill(80); // 未獲得 (灰色)
          drawingContext.shadowBlur = 0;
      }
      rect(startX + index * gap, 45, 20, 30, 4);
  });
  drawingContext.shadowBlur = 0;
}



/**
 * 繪製助記詞恢復與資產拿回動畫
 */
function drawRecoverySequence() {
  // 背景遮罩
  fill(0, 0, 0, 220);
  rectMode(CORNER);
  rect(0, 0, width, height);

  let t = (millis() - recoveryStartTime) / 1000; // 動畫經過秒數
  let cx = width / 2;
  let cy = height / 2;

  // --- 繪製冷錢包裝置 ---
  let walletW = 300;
  let walletH = 200;
  
  // 錢包本體
  fill(40);
  stroke(100);
  strokeWeight(3);
  rectMode(CENTER);
  rect(cx, cy, walletW, walletH, 20);
  
  // 螢幕區域
  fill(10);
  noStroke();
  rect(cx, cy - 20, walletW - 40, 100, 5);

  // --- 動畫階段：碎片飛入 ---
  // 定義三個碎片 (對應 HUD 的顏色)
  let fragments = [
      { color: color(0, 191, 255), label: "Words\n1-8" }, // 藍
      { color: color(50, 205, 50), label: "Words\n9-16" },  // 綠
      { color: color(255, 69, 0), label: "Words\n17-24" }       // 紅
  ];

  for (let i = 0; i < 3; i++) {
      // 起始位置 (模擬從左上角 HUD 飛過來)
      let startX = 130 + i * 40;
      let startY = 45;
      
      // 目標位置 (錢包螢幕上的三個插槽)
      let endX = cx - 80 + i * 80;
      let endY = cy - 20;

      // 每個碎片的動畫時間錯開
      let startTime = 0.5 + i * 0.6;
      let duration = 0.8;
      let progress = constrain((t - startTime) / duration, 0, 1);
      
      // 緩動函數 (Ease out)
      let ease = 1 - Math.pow(1 - progress, 3);

      if (t > startTime) {
          let currX = lerp(startX, endX, ease);
          let currY = lerp(startY, endY, ease);
          let currW = lerp(20, 60, ease); // 飛行過程中變大
          let currH = lerp(30, 40, ease);
          
          fill(fragments[i].color);
          noStroke();
          rectMode(CENTER);
          rect(currX, currY, currW, currH, 4);
          
          // 到達後顯示文字
          if (progress > 0.9) {
              fill(255);
              textSize(10);
              textAlign(CENTER, CENTER);
              text(fragments[i].label, currX, currY);
          }
      }
  }

  // --- 動畫階段：成功訊息 ---
  if (t > 3.0) {
      // 螢幕發光
      fill(0, 255, 0, 50 + sin(frameCount * 0.2) * 50);
      rectMode(CENTER);
      rect(cx, cy - 20, walletW - 40, 100);
      
      fill(0, 255, 0);
      textSize(30);
      textAlign(CENTER, CENTER);
      text("ACCESS GRANTED", cx, cy - 20);
      
      fill(255, 215, 0);
      textSize(24);
      text("資產已恢復！", cx, cy + 60);
  }

  // --- 動畫階段：顯示按鈕 ---
  if (t > 4.5) {
      recoveryState = 'DONE';
      
      // 繪製 '再玩一次' 按鈕 (使用之前的邏輯)
      const buttonW = 200;
      const buttonH = 60;
      const buttonY = cy + 130;

      playAgainYesButton = {
        x: cx - buttonW / 2,
        y: buttonY,
        w: buttonW,
        h: buttonH
      };

      const onYes = mouseX > playAgainYesButton.x && mouseX < playAgainYesButton.x + playAgainYesButton.w &&
                    mouseY > playAgainYesButton.y && mouseY < playAgainYesButton.y + playAgainYesButton.h;

      rectMode(CORNER);
      fill(onYes ? '#4CAF50' : '#8BC34A');
      rect(playAgainYesButton.x, playAgainYesButton.y, playAgainYesButton.w, playAgainYesButton.h, 10);
      fill(255);
      textSize(22);
      textAlign(CENTER, CENTER);
      text("再玩一次", playAgainYesButton.x + playAgainYesButton.w / 2, playAgainYesButton.y + playAgainYesButton.h / 2);
  }
}

/**
 * 顯示問題介面
 */
function displayQuestion() {
  // 繪製下方對話框背景
  fill(0, 0, 0, 200);
  rectMode(CORNER);
  let panelH = 300;
  let panelY = height - panelH;
  rect(0, panelY, width, panelH);

  // 繪製問題文字
  fill(255);
  noStroke(); // 確保文字沒有邊框，看起來會比較細
  textAlign(LEFT, TOP);
  textSize(24);
  text("問題：" + currentQuestion.question, 50, panelY + 30, width - 100, 60);
  
  // 繪製選項按鈕
  optionButtons = [];
  let startY = panelY + 100;
  let btnH = 50;
  let gap = 15;
  
  textSize(20);
  textAlign(LEFT, CENTER);
  let isAnyOptionHover = false;

  for (let i = 0; i < currentQuestion.options.length; i++) {
    let btnY = startY + i * (btnH + gap);
    let btnX = 50;
    let btnW = width - 250; // 留空間給右邊的功能按鈕

    // 檢查滑鼠懸停
    let isHover = mouseX > btnX && mouseX < btnX + btnW &&
                  mouseY > btnY && mouseY < btnY + btnH;
    
    if (isHover) {
      fill(100, 100, 150);
      isAnyOptionHover = true;
    } else {
      fill(50, 50, 80);
    }
    
    rect(btnX, btnY, btnW, btnH, 10);
    
    fill(255);
    text(currentQuestion.options[i], btnX + 20, btnY + btnH / 2);

    // 儲存按鈕區域供點擊偵測
    optionButtons.push({
      x: btnX, y: btnY, w: btnW, h: btnH, index: i + 1
    });
  }
  
  // --- 定義提示按鈕 (放在右側) ---
  hintButton = {
    w: 120,
    h: 50,
    x: width - 150,
    y: panelY + 100,
  };

  // 檢查滑鼠是否懸停在按鈕上
  const onHint = mouseX > hintButton.x && mouseX < hintButton.x + hintButton.w &&
                 mouseY > hintButton.y && mouseY < hintButton.y + hintButton.h;

  // --- 統一處理滑鼠指標 ---
  if (onHint || isAnyOptionHover) {
    cursor(HAND);
  } else if (gameState === 'ASKING') { // 只有在 ASKING 狀態才重設為箭頭
    cursor(ARROW);
  }

  // --- 繪製提示按鈕 ---
  if (onHint) {
    fill(255, 200, 0); // 懸停時變色
  } else {
    fill(255, 165, 0); // 預設顏色
  }
  
  rectMode(CORNER);
  rect(hintButton.x, hintButton.y, hintButton.w, hintButton.h, 10);
  
  fill(0);
  textSize(20);
  textAlign(CENTER, CENTER);
  text("提示", hintButton.x + hintButton.w / 2, hintButton.y + hintButton.h / 2);

}

/**
 * 處理滑鼠點擊事件
 */
function mousePressed() {
  // 處理開始畫面的點擊
  if (gameState === 'START_SCREEN') {
    handleStartScreenClick();
    return;
  }

  // 處理詢問介面的按鈕點擊
  if (gameState === 'PROMPT') {
    const onYes = mouseX > yesButton.x && mouseX < yesButton.x + yesButton.w &&
                  mouseY > yesButton.y && mouseY < yesButton.y + yesButton.h;
    const onNo = mouseX > noButton.x && mouseX < noButton.x + noButton.w &&
                 mouseY > noButton.y && mouseY < noButton.y + noButton.h;

    if (onYes) {
      // 模擬按下 'Y'
      key = 'Y';
      promptKeyPressed();
    } else if (onNo) {
      // 模擬按下 'N'
      key = 'N';
      promptKeyPressed();
    }
    return; // 處理完畢，直接返回
  }
  
  // 新增：處理場景對話點擊
  if (gameState === 'SCENE_DIALOGUE') {
    currentDialogueIndex++;
    if (currentDialogueIndex >= currentDialogueLines.length) {
      // 對話結束，觸發轉場回到移動模式
      transition.active = true;
      transition.state = 'IN';
      transition.nextState = 'MOVING';
    }
    return;
  }

  // 檢查是否在勝利畫面點擊 '再玩一次'
  if (gameState === 'FINALE') {
    // 只有當勝利畫面顯示時 (isFrozen 為真)，才檢查按鈕點擊
    if (celestialEffect.isFrozen && recoveryState === 'DONE') {
        const onYes = mouseX > playAgainYesButton.x && mouseX < playAgainYesButton.x + playAgainYesButton.w &&
                      mouseY > playAgainYesButton.y && mouseY < playAgainYesButton.y + playAgainYesButton.h;
        if (onYes) {
          resetGame();
        }
    } else if (mouseButton === LEFT) {
        // 結局模式下，按滑鼠左鍵發射
        if (playerAmmo > 0) {
          playerAmmo--;

          // 計算朝向滑鼠的向量
          let v = createVector(mouseX - player.x, mouseY - player.y);
          v.normalize();
          v.mult(15); // 設定速度

          projectiles.push({
            x: player.x,
            y: player.y,
            vx: v.x,
            vy: v.y,
            size: 20
          });
        }
    }
  }

  // 只有在提問狀態下才檢查按鈕點擊
  if (gameState === 'ASKING') {
    // 檢查選項按鈕
    for (let btn of optionButtons) {
      if (mouseX > btn.x && mouseX < btn.x + btn.w &&
          mouseY > btn.y && mouseY < btn.y + btn.h) {
        handleAnswer(btn.index);
        return;
      }
    }

    const onHint = mouseX > hintButton.x && mouseX < hintButton.x + hintButton.w &&
                   mouseY > hintButton.y && mouseY < hintButton.y + hintButton.h;

    if (onHint) {
      hintTimer = millis() + 2000; // 點擊提示按鈕時，設定提示計時器為 2 秒
    }
  }
}

/**
 * --- 新增：繪製開始畫面 ---
 */
function drawStartScreen() {
  // 繪製背景圖片
  const bgAspectRatio = bgImage.width / bgImage.height;
  const bgDrawWidth = height * bgAspectRatio;
  imageMode(CORNER);
  for (let x = 0; x < width; x += bgDrawWidth) {
    image(bgImage, x, 0, bgDrawWidth, height);
  }

  // --- 1. 背景粒子特效 (金色錢幣氛圍) ---
  if (startScreenParticles.length === 0) {
    for (let i = 0; i < 50; i++) {
      startScreenParticles.push({
        x: random(width),
        y: random(height),
        size: random(2, 8),
        speed: random(0.5, 2),
        alpha: random(50, 150)
      });
    }
  }

  noStroke();
  for (let p of startScreenParticles) {
    fill(255, 215, 0, p.alpha); // 金色粒子
    circle(p.x, p.y, p.size);
    p.y -= p.speed; // 向上飄
    if (p.y < -10) {
      p.y = height + 10;
      p.x = random(width);
    }
  }

  // --- 2. 標題特效 (上下浮動 + 發光) ---
  let titleY = height * 0.2 + sin(frameCount * 0.05) * 10;

  fill(255, 215, 0); // 金色
  textAlign(CENTER, CENTER);
  textSize(60);
  
  // 簡單發光效果
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = 'rgba(255, 215, 0, 0.5)';
  text("金融大冒險", width / 2, titleY);
  drawingContext.shadowBlur = 0; // 重置

  // 按鈕參數
  let btnW = 300;
  let btnH = 60;
  let startY = height * 0.4;
  let gap = 80;

  rectMode(CENTER);
  strokeWeight(2);
  cursor(ARROW); // 預設游標

  // 繪製按鈕的輔助函式
  function drawAnimatedButton(label, x, y, baseColor, hoverColor) {
    let isHover = mouseX > x - btnW / 2 && mouseX < x + btnW / 2 &&
                  mouseY > y - btnH / 2 && mouseY < y + btnH / 2;
    
    let scaleVal = isHover ? 1.1 : 1.0;
    
    push();
    translate(x, y);
    scale(scaleVal);
    
    stroke(255);
    fill(isHover ? hoverColor : baseColor);
    rect(0, 0, btnW, btnH, 10);
    
    fill(255);
    noStroke();
    textSize(24);
    text(label, 0, 0);
    
    pop();
    
    if (isHover) cursor(HAND);
  }

  drawAnimatedButton("開始遊戲", width / 2, startY, color(0, 150, 0), color(0, 180, 0));
  drawAnimatedButton("玩法介紹", width / 2, startY + gap, color(0, 100, 200), color(0, 130, 230));
  drawAnimatedButton("遊戲主旨", width / 2, startY + gap * 2, color(200, 100, 0), color(230, 130, 0));

  // 繪製彈窗 (如果開啟)
  if (showHowToPlay) {
    drawOverlay("玩法介紹", "WASD：移動角色\n滑鼠左鍵：選擇答案 / 結局射擊\n\n在地圖上尋找提問者，回答正確問題\n集滿三次正確回答可獲得助記詞碎片\n集齊碎片後挑戰夢幻！");
  } else if (showAbout) {
    drawOverlay("遊戲主旨", "皮卡丘忘記了冷錢包的助記詞\n無法存取他的資產！\n\n為了找回助記詞\n皮卡丘來到這裡接受試煉\n\n蒐集三張助記詞碎片，打倒夢幻\n幫皮卡丘拿回冷錢包的控制權！");
  }
}

function drawOverlay(title, content) {
  fill(0, 0, 0, 200);
  rectMode(CORNER);
  rect(0, 0, width, height);

  fill(255);
  rectMode(CENTER);
  stroke(255);
  strokeWeight(3);
  fill(50, 50, 80);
  rect(width / 2, height / 2, 600, 400, 20);

  noStroke();
  fill(255, 215, 0);
  textSize(32);
  text(title, width / 2, height / 2 - 150);

  fill(255);
  textSize(20);
  textLeading(30);
  text(content, width / 2, height / 2, 560, 300);

  fill(200);
  textSize(16);
  text("點擊任意處關閉", width / 2, height / 2 + 170);
}

function handleStartScreenClick() {
  if (showHowToPlay || showAbout) {
    showHowToPlay = false;
    showAbout = false;
    return;
  }

  let btnW = 300;
  let btnH = 60;
  let startY = height * 0.4;
  let gap = 80;

  // 檢查 開始遊戲
  if (mouseX > width / 2 - btnW / 2 && mouseX < width / 2 + btnW / 2 &&
      mouseY > startY - btnH / 2 && mouseY < startY + btnH / 2) {
    // 啟動轉場動畫
    transition.active = true;
    transition.state = 'IN';
    transition.nextState = 'MOVING';
  }

  // 檢查 玩法介紹
  if (mouseX > width / 2 - btnW / 2 && mouseX < width / 2 + btnW / 2 &&
      mouseY > startY + gap - btnH / 2 && mouseY < startY + gap + btnH / 2) {
    showHowToPlay = true;
  }

  // 檢查 遊戲主旨
  if (mouseX > width / 2 - btnW / 2 && mouseX < width / 2 + btnW / 2 &&
      mouseY > startY + gap * 2 - btnH / 2 && mouseY < startY + gap * 2 + btnH / 2) {
    showAbout = true;
  }
}

/**
 * --- 新增：重置遊戲 ---
 */
function resetGame() {
  // 重置遊戲狀態
  gameState = 'MOVING';
  activeQuestioner = null;
  currentQuestion = null;
  player.feedbackState = null;
  finaleCatchCount = 0;
  player.speed = 4; // 重置速度
  player.animation.frameDelay = 10; // 重置動畫速度
  clones = []; // 重置分身
  player.stunEndTime = 0; // 重置玩家暈眩

  // 重置夢幻狀態 (恢復原本的移動機制)
  hintGiver.x = 150;
  hintGiver.y = height - 80;
  hintGiver.speedX = 2.0;
  hintGiver.speedY = 1.5;
  hintGiver.stunEndTime = 0;

  // --- 重置玩家位置到初始點 ---
  let centerX = 0;
  let centerY = 0;
  for (let q of questioners) {
    centerX += q.x;
    centerY += q.y;
  }
  centerX /= questioners.length;
  centerY /= questioners.length;
  player.x = centerX;
  player.y = centerY - 100;

  // 重置所有提問者
  for (let q of questioners) {
    q.correctAnswersCount = 0;
    q.reaction = null;
    q.reactionText = null;
    q.cooldownUntil = 0;
    // 根據 ID 重新分配題庫
    if (q.id === 'q1') {
      q.questions = [...cryptoQuestions];
    } else if (q.id === 'q2') {
      q.questions = [...twStockQuestions];
    } else if (q.id === 'q3') {
      q.questions = [...usStockQuestions];
    }
  }

  // 停用星空效果
  celestialEffect.isActive = false;
  celestialEffect.particles = [];
  celestialEffect.isFrozen = false; // 重置靜止狀態
  celestialEffect.isExpanding = false; // 重置擴散狀態
  celestialEffect.radius = 250; // 重置半徑

  cursor(ARROW); // 恢復滑鼠指標
}

/**
 * 處理按鍵事件 (答題)
 */
function keyPressed() {
  // 檢查 'M' 鍵來切換移動模式
  if (key.toUpperCase() === 'M') {
    moonwalkMode = !moonwalkMode;
  }
  

  // --- 除錯用：按下 'P' 鍵直接完成所有問題 ---
  if (key.toUpperCase() === 'P') {
    for (let q of questioners) {
      q.correctAnswersCount = 3;
    }
    console.log("DEBUG: All questions completed.");
  }

  if (gameState === 'PROMPT') {
    promptKeyPressed(); //如果再prompt狀態 就會到這邊
    return;
  }

  if (gameState === 'ASKING') {
    let choice = parseInt(key);
    handleAnswer(choice);
  }
}

/**
 * 顯示提示介面
 */
function displayTimedHint() {
  if (millis() < hintTimer) {
    // 在問答模式下，將提示顯示在畫面中央
    const boxW = 400;
    const boxH = 100;
    const boxX = width / 2;
    const boxY = height / 2;

    // 繪製對話框
    fill(255, 255, 200);
    stroke(0);
    strokeWeight(2);
    rectMode(CENTER);
    rect(boxX, boxY, boxW, boxH, 10);

    // 繪製提示文字
    noStroke();
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(20);
    text("提示：\n" + currentQuestion.hint, boxX, boxY);
  }
}

/**
 * 顯示答題回饋
 */
function displayFeedback() {
  fill(255); // 改為白色文字，以便在深色背景上顯示
  textAlign(CENTER, CENTER);
  textSize(48);
  text(feedbackMessage, width / 2, height / 2);

  // 倒數計時後返回移動狀態
  if (millis() > feedbackTimer) {
    // 如果是按 'X' 離開 (此時玩家沒有回饋狀態)，才設定冷卻時間
    if (player.feedbackState === null && activeQuestioner) {
      activeQuestioner.cooldownUntil = millis() + 3000;
    }

    if (player.feedbackState === 'correct') {
      // 如果玩家答對了，但還沒滿足三題的條件
      if (activeQuestioner.correctAnswersCount < 3) {
        // 立刻進入下一個問題
        gameState = 'ASKING';
        let randomIndex = floor(random(activeQuestioner.questions.length));
        currentQuestion = activeQuestioner.questions[randomIndex];
        // 清除反應，準備下一題
        activeQuestioner.reaction = null;
        activeQuestioner.reactionText = '';
      } else { // 如果已經答對三題，則進入新場景對話
        gameState = 'SCENE_DIALOGUE';
        currentDialogueIndex = 0;
        
        // 根據提問者設定不同的對話內容
        if (activeQuestioner.id === 'q1') {
             currentDialogueLines = ["太厲害了！你對加密貨幣很懂喔。", "這張【助記詞碎片 (1-8)】交給你了。", "集齊三張碎片，就能找回冷錢包！"];
        } else if (activeQuestioner.id === 'q2') {
             currentDialogueLines = ["恭喜你通過了我的考驗！", "這張【助記詞碎片 (9-16)】是你的了。", "繼續加油，蒐集所有碎片吧！"];
        } else {
             currentDialogueLines = ["真不簡單！你的財商很高。", "收下這張【助記詞碎片 (17-24)】吧。", "你離找回冷錢包不遠了！"];
        }
        
        player.feedbackState = null; // 清除玩家的反應狀態
        // 注意：這裡不清除 activeQuestioner，因為對話場景需要用到它
      }
    } else if (player.feedbackState === null) { // 按 'X' 離開
      // 觸發轉場回到移動模式
      if (!transition.active) {
        transition.active = true;
        transition.state = 'IN';
        transition.nextState = 'MOVING';
      }
    } else { // 如果答錯了，就返回問題介面並顯示提示
      hintTimer = millis() + 2000; // 答錯時，自動顯示提示 2 秒
      gameState = 'ASKING'; // 返回問題介面
      // 清除反應，讓玩家和提問者恢復正常狀態
      if (activeQuestioner) {
        activeQuestioner.reaction = null;
        activeQuestioner.reactionText = '';
      }
      player.feedbackState = null;
    }
  }
}

/**
 * --- 新增：繪製轉場動畫 ---
 */
function drawTransition() {
  // 更新進度
  if (transition.state === 'IN') {
    transition.progress += transition.speed;
    if (transition.progress >= 1) {
      transition.progress = 1;
      transition.state = 'HOLD';
      transition.holdTimer = 30; // 停留約 0.5 秒，確保完全遮蓋
      
      // 當完全蓋住時，切換到目標狀態
      if (transition.nextState) {
        // 如果是回到移動模式，執行清理工作
        if (transition.nextState === 'MOVING') {
           // 如果是從房間相關狀態回來，恢復玩家在地圖上的位置
           if (gameState === 'SCENE_DIALOGUE' || gameState === 'ANSWERED' || gameState === 'ASKING') {
               player.x = savedMapPos.x;
               player.y = savedMapPos.y;
           }
           if (activeQuestioner) {
             activeQuestioner.reaction = null;
             activeQuestioner.reactionText = '';
           }
           activeQuestioner = null;
           currentQuestion = null;
           player.feedbackState = null;
        }
        gameState = transition.nextState;
        transition.nextState = null;
      }
    }
  } else if (transition.state === 'HOLD') {
    transition.holdTimer--;
    if (transition.holdTimer <= 0) {
      transition.state = 'OUT';
    }
  } else {
    transition.progress -= transition.speed;
    if (transition.progress <= 0) {
      transition.progress = 0;
      transition.active = false;
      transition.speed = 0.02; // 重置回預設速度
    }
  }

  if (transition.progress <= 0) return;

  // 繪製雲朵般的遮罩
  noStroke();
  rectMode(CORNER); // 確保使用 CORNER 模式繪製，以覆蓋全螢幕
  
  let maxW = width / 2 + 150; // 增加額外寬度以確保重疊
  let offset = maxW * transition.progress;
  
  let ctx = drawingContext;

  // 左側漸層 (白雲)
  let gradL = ctx.createLinearGradient(0, 0, offset, 0);
  gradL.addColorStop(0, 'rgb(255, 255, 255)');
  gradL.addColorStop(1, 'rgb(230, 240, 255)');
  ctx.fillStyle = gradL;
  ctx.fillRect(0, 0, offset, height);
  
  // 右側漸層 (白雲)
  let gradR = ctx.createLinearGradient(width, 0, width - offset, 0);
  gradR.addColorStop(0, 'rgb(255, 255, 255)');
  gradR.addColorStop(1, 'rgb(230, 240, 255)');
  ctx.fillStyle = gradR;
  ctx.fillRect(width - offset, 0, offset, height);
  
  // 邊緣圓形 (使用漸層末端的顏色)
  fill(230, 240, 255);

  // 在邊緣繪製圓形，模擬雲朵形狀
  for (let y = 0; y <= height; y += 30) {
      let r = 80 + (y % 40); // 讓圓形大小有變化
      // 左側邊緣雲朵 (多層次)
      circle(offset, y, r); 
      circle(offset - 20, y + 15, r * 0.8);
      // 右側邊緣雲朵 (多層次)
      circle(width - offset, y, r); 
      circle(width - offset + 20, y + 15, r * 0.8);
  }
}

/**
 * --- 新增：繪製室內場景背景與角色 ---
 */
function drawRoomEnvironment() {
  // 繪製新場景背景 (例如室內環境)
  background(60, 40, 70); // 深紫色背景
  
  // 繪製地板
  noStroke();
  fill(100, 80, 110);
  rect(0, height * 0.4, width, height * 0.6);
  
  // 繪製裝飾 (例如窗戶)
  fill(150, 200, 255, 100);
  rect(width * 0.2, height * 0.1, 150, 200);
  rect(width * 0.7, height * 0.1, 150, 200);

  // 繪製玩家 (左側，面向右)
  push();
  translate(width * 0.3, height * 0.45);
  scale(-1, 1); // 翻轉面向右
  let anim = player.animation.stand;
  // 更新動畫
  if (frameCount % player.animation.frameDelay === 0) {
    player.animation.currentFrame = (player.animation.currentFrame + 1) % anim.totalFrames;
  }
  let frameX = player.animation.currentFrame * anim.w;
  imageMode(CENTER);
  image(anim.img, 0, 0, anim.w * playerScale * 1.5, anim.h * playerScale * 1.5, frameX, 0, anim.w, anim.h);
  pop();

  // 繪製夢幻 (中間)
  push();
  translate(width * 0.5, height * 0.45);
  // 更新動畫
  if (frameCount % hintGiver.frameDelay === 0) {
    hintGiver.currentFrame = (hintGiver.currentFrame + 1) % hintGiver.totalFrames;
  }
  let hFrameX = hintGiver.currentFrame * hintGiver.w;
  imageMode(CENTER);
  // 稍微放大一點
  image(hintGiver.img, 0, 0, hintGiver.w * hintGiver.scale * 1.5, hintGiver.h * hintGiver.scale * 1.5, hFrameX, 0, hintGiver.w, hintGiver.h);
  pop();

  // 繪製提問者 (右側)
  if (activeQuestioner) {
    let q = activeQuestioner;
    push();
    translate(width * 0.7, height * 0.45);
    // 更新動畫
    if (frameCount % q.frameDelay === 0) {
      q.currentFrame = (q.currentFrame + 1) % q.totalFrames;
    }
    let qFrameX = q.currentFrame * q.w;
    imageMode(CENTER);
    image(q.img, 0, 0, q.w * questionerScale * 1.5, q.h * questionerScale * 1.5, qFrameX, 0, q.w, q.h);
    pop();
  }
}

function drawDialogueBox() {
  // 繪製對話框
  fill(0, 0, 0, 200);
  rectMode(CORNER);
  rect(0, height - 200, width, 200);
  
  // 繪製文字
  fill(255);
  textAlign(LEFT, TOP);
  textSize(28);
  text(currentDialogueLines[currentDialogueIndex], 50, height - 160, width - 100, 130);
  
  textSize(18);
  textAlign(RIGHT, BOTTOM);
  fill(200);
  text("點擊滑鼠繼續...", width - 30, height - 30);
}

/**
 * 處理回答邏輯
 */
function handleAnswer(choice) {
  if (choice >= 1 && choice <= 3) {
    gameState = 'ANSWERED';
    feedbackTimer = millis() + 1500; // 顯示回饋 1.5 秒
    if (choice === currentQuestion.answer) {
      feedbackMessage = "答對了！";
      activeQuestioner.correctAnswersCount++; // 為當前的提問者增加答對次數
      activeQuestioner.reaction = 'correct';
      activeQuestioner.reactionText = random(correctPhrases); // 隨機選取一句稱讚的話
      player.feedbackState = 'correct';
      // 從未問問題列表中移除剛剛答對的問題
      const index = activeQuestioner.questions.indexOf(currentQuestion);
      if (index > -1) {
        activeQuestioner.questions.splice(index, 1);
      }
    } else {
      // --- 答錯時的邏輯 (恢復原狀) ---
      feedbackMessage = "答錯了！";
      activeQuestioner.reaction = 'wrong';
      activeQuestioner.reactionText = random(wrongPhrases); // 隨機選取一句嘲諷/鼓勵的話
      player.feedbackState = 'wrong';
      // 答錯時，將回饋時間延長，讓玩家有時間看提示
      feedbackTimer = millis() + 1500; // 將答錯的回饋時間也改為 1.5 秒
    }
  }
}