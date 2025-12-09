let player;
let questioners = [];
let potion;
let hintCharacter;
let gameBackground;
let currentQuestioner = null;
let currentQuestionerIndex = 0; // 追蹤目前的提問者索引
let questionActive = false;
let hintCharacterVisible = false; // 追蹤提示角色是否應該顯示 
let playerAttacking = false; // 追蹤玩家是否正在攻擊

// 遊戲中的所有圖片資源
let images = {};

// 遊戲參數
const TILE_SIZE = 64; 
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

// 地面調整：角色腳底位於畫面高度的 65% 處 (約 390 像素高)
const GROUND_Y = GAME_HEIGHT * 0.65; 

// 動畫和角色尺寸常量
const PLAYER_SCALE = 0.5; 
const PLAYER_DISPLAY_W = 180 * PLAYER_SCALE; 
const PLAYER_DISPLAY_H = 193 * PLAYER_SCALE; 

const HINT_SCALE = 0.7; 
const HINT_DISPLAY_W = 167 * HINT_SCALE; 
const HINT_DISPLAY_H = 120 * HINT_SCALE; 

const QUESTIONER_SCALE = 0.6; 
const Q1_DISPLAY_W = 205 * QUESTIONER_SCALE; 
const Q1_DISPLAY_H = 192 * QUESTIONER_SCALE; 
const Q2_DISPLAY_W = 175 * QUESTIONER_SCALE; 
const Q2_DISPLAY_H = 166 * QUESTIONER_SCALE; 
const Q3_DISPLAY_W = 188 * QUESTIONER_SCALE; 
const Q3_DISPLAY_H = 141 * QUESTIONER_SCALE; 

const POTION_SCALE = 1.2;
const POTION_W = 541 / 8 * POTION_SCALE; // 單一影格寬度
const POTION_H = 73 * POTION_SCALE; // 影格高度

const ANIMATION_SPEED = 5; 

// 遊戲狀態
let playerHealth = 5;
const MAX_PLAYER_HEALTH = 5;

// --- 美術題庫定義 (選擇題) ---
// 答案為選項前的字母 (A, B, C...)
const QUESTION_BANK = {
    '提問者二': [ 
        { 
            question: "誰被稱為「印象派」的創始人，以描繪巴黎街景和芭蕾舞者著稱?", 
            options: ["A. 莫內", "B. 達文西", "C. 梵谷"],
            answer: "a", 
            hint: "他的代表作有《日出·印象》。" 
        },
        { 
            question: "哪種顏色是三原色之一，不能透過混合其他顏色得到?", 
            options: ["A. 綠色", "B. 黃色", "C. 紫色"],
            answer: "b", 
            hint: "另兩種原色是紅與藍。" 
        }
    ],
    '提問者三': [
        { 
            question: "文藝復興時期，哪位藝術家創作了著名壁畫《最後的晚餐》?", 
            options: ["A. 米開朗基羅", "B. 拉斐爾", "C. 達文西"],
            answer: "c", 
            hint: "他也是一位著名的科學家、發明家。" 
        },
        { 
            question: "在繪畫中，用於表現光線投射到物體上所產生的深淺變化叫做什麼?", 
            options: ["A. 色相", "B. 明度", "C. 對比"],
            answer: "b", 
            hint: "這與顏色的亮度有關。" 
        }
    ],
    '提問者一': [
        { 
            question: "哪一種雕塑媒材是法國雕塑家羅丹最常使用的，用於創作《沉思者》?", 
            options: ["A. 大理石", "B. 青銅", "C. 木頭"],
            answer: "b", 
            hint: "青綠色的金屬合金。" 
        },
        { 
            question: "在設計中，將物件安排在畫面上，使之平衡或產生動態感的行為稱為什麼?", 
            options: ["A. 構圖", "B. 紋理", "C. 筆觸"],
            answer: "a", 
            hint: "這是創作前的基本規劃。" 
        }
    ]
};

// 藥水問題 (數學題)
const POTION_QUESTION = {
    question: "請計算： $\\frac{10 \\times 2}{5} + 7 = ?$", 
    options: ["A. 11", "B. 4", "C. 9"],
    answer: "a",
    hint: "先乘除後加減，答案是 11。"
};


// --- 動畫管理類別 ---
class Animation {
    constructor(spritesheet, frameW, frameH, frameCount, speed) {
        this.spritesheet = spritesheet;
        this.frameW = frameW;
        this.frameH = frameH;
        this.frameCount = frameCount; 
        this.speed = speed;           
        this.frames = [];             
        this.currentFrame = 0;

        // 預先切割精靈圖
        for (let i = 0; i < this.frameCount; i++) {
            let img = this.spritesheet.get(i * this.frameW, 0, this.frameW, this.frameH);
            this.frames.push(img);
        }
    }

    display(x, y, displayW, displayH) {
        let index = floor(frameCount / this.speed) % this.frameCount;
        image(this.frames[index], x, y, displayW, displayH);
        this.currentFrame = index;
    }
}


// --- 遊戲物件類別定義 ---

// 基礎角色類別
class Character {
    constructor(x, y, name, health) {
        this.x = x;
        this.y = y;
        this.name = name;
        this.health = health;
        this.maxHealth = health;
        this.animations = {}; 
        this.currentState = 'idle'; 
        this.displayW = TILE_SIZE; 
        this.displayH = TILE_SIZE; 
    }
    
    // 初始化動畫（子類別中實現）
    initAnimations() {}

    // 通用的 display 函數
    display() {
        push();
        translate(this.x, this.y);
        
        let drawY = -this.displayH; // 所有角色以腳底為 y 基準

        // 播放當前狀態的動畫
        if (this.animations[this.currentState]) {
            this.animations[this.currentState].display(
                -this.displayW / 2, 
                drawY, 
                this.displayW, 
                this.displayH
            );
        } else if (this.health > 0) {
            // 佔位方塊
            fill(150, 0, 150); 
            rectMode(CENTER);
            rect(0, drawY + this.displayH / 2, TILE_SIZE, TILE_SIZE);
        }

        // 顯示名稱
        fill(255);
        textAlign(CENTER, BOTTOM);
        text(this.name, 0, drawY - 5);
        pop();
    }
}

// 玩家類別
class Player extends Character {
    constructor(x, y) {
        super(x, y, '玩家', MAX_PLAYER_HEALTH);
        this.speed = 3;
        this.displayW = PLAYER_DISPLAY_W;
        this.displayH = PLAYER_DISPLAY_H;
        this.direction = 1; // 1 = 向右，-1 = 向左
    }
    
    initAnimations() {
        this.animations.idle = new Animation(images.player_idle, 179.4, 184, 7, ANIMATION_SPEED);
        this.animations.walk = new Animation(images.player_walk, 182.8, 190, 7, ANIMATION_SPEED);
        this.animations.attack = new Animation(images.player_attack, 160, 193, 8, ANIMATION_SPEED);
        this.animations.hurt = new Animation(images.player_hurt, 182, 184, 4, ANIMATION_SPEED);
        this.animations.dead = new Animation(images.player_dead, 168, 176, 4, ANIMATION_SPEED * 2);
    }

    move() {
        if (this.health <= 0 || questionActive || playerAttacking) return; 

        let moving = false;
        if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) { // A 鍵或左箭頭
            this.x -= this.speed;
            this.direction = -1; // 向左
            moving = true;
        } 
        if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { // D 鍵或右箭頭
            this.x += this.speed;
            this.direction = 1; // 向右
            moving = true;
        }

        if (moving && this.currentState !== 'walk') {
            this.currentState = 'walk';
        } else if (!moving && this.currentState === 'walk') {
            this.currentState = 'idle';
        }
        
        this.x = constrain(this.x, this.displayW / 2, GAME_WIDTH - this.displayW / 2);
    }
    
    display() {
        if (this.health <= 0) {
            this.currentState = 'dead';
        }
        
        push();
        translate(this.x, this.y);
        
        // 根據方向進行水平翻轉
        if (this.direction === -1) {
            scale(-1, 1); // 水平翻轉
        }
        
        let drawY = -this.displayH; // 玩家通常以腳底為 y

        // 播放當前狀態的動畫
        if (this.animations[this.currentState]) {
            this.animations[this.currentState].display(
                -this.displayW / 2, 
                drawY, 
                this.displayW, 
                this.displayH
            );
        }

        // 顯示血量
        fill(255);
        textAlign(CENTER, BOTTOM);
        text(`HP: ${this.health}`, 0, drawY - 5);
        
        pop();
    }
}

// 提示角色類別 (邏輯不變)
class HintCharacter extends Character {
    constructor(x, y) {
        super(x, y, '提示角色', Infinity); 
        this.displayW = HINT_DISPLAY_W;
        this.displayH = HINT_DISPLAY_H;
    }

    initAnimations() {
        this.animations.idle = new Animation(images.hint_idle, 156, 104, 4, ANIMATION_SPEED);
        this.animations.walk = new Animation(images.hint_walk, 161.3, 112, 6, ANIMATION_SPEED);
        this.animations.jump = new Animation(images.hint_jump, 162.7, 120, 6, ANIMATION_SPEED);
        this.animations.run = new Animation(images.hint_run, 161.3, 104, 6, ANIMATION_SPEED);
    }
    
    display() {
        if (!hintCharacterVisible) return;
        
        push();
        translate(this.x, this.y);
        let drawY = -this.displayH; 

        if (this.animations[this.currentState]) {
            this.animations[this.currentState].display(
                -this.displayW / 2, 
                drawY, 
                this.displayW, 
                this.displayH
            );
        }
        pop();
    }
}

// 提問者類別 (邏輯不變)
class Questioner extends Character {
    constructor(x, y, name, questionKey) {
        super(x, y, name, 2); 
        this.questions = QUESTION_BANK[questionKey];
        this.currentQuestionIndex = 0; 
        
        if (this.name === '提問者一') {
            this.displayW = Q1_DISPLAY_W;
            this.displayH = Q1_DISPLAY_H;
        } else if (this.name === '提問者二') { 
            this.displayW = Q2_DISPLAY_W;
            this.displayH = Q2_DISPLAY_H;
        } else if (this.name === '提問者三') { 
            this.displayW = Q3_DISPLAY_W;
            this.displayH = Q3_DISPLAY_H;
        }
        this.initAnimations();
    }

    initAnimations() {
        if (this.name === '提問者一') {
            this.animations.idle = new Animation(images.q1_idle, 148.1, 176, 6, ANIMATION_SPEED);
            this.animations.walk = new Animation(images.q1_walk, 156.4, 184, 8, ANIMATION_SPEED);
            this.animations.attack = new Animation(images.q1_attack, 204.4, 184, 8, ANIMATION_SPEED); 
            this.animations.hurt = new Animation(images.q1_hurt, 123.3, 192, 3, ANIMATION_SPEED);
            this.animations.dead = new Animation(images.q1_dead, 171.3, 184, 3, ANIMATION_SPEED * 2);
        } else if (this.name === '提問者二') {
            this.animations.idle = new Animation(images.q2_idle, 174.7, 160, 6, ANIMATION_SPEED);
            this.animations.walk = new Animation(images.q2_walk, 155.6, 154, 8, ANIMATION_SPEED);
            this.animations.attack = new Animation(images.q2_attack, 160, 132, 8, ANIMATION_SPEED);
            this.animations.hurt = new Animation(images.q2_hurt, 148, 152, 2, ANIMATION_SPEED);
        } else if (this.name === '提問者三') {
            this.animations.idle = new Animation(images.q3_idle, 160, 102, 8, ANIMATION_SPEED);
            this.animations.walk = new Animation(images.q3_walk, 160, 134, 8, ANIMATION_SPEED);
            this.animations.attack = new Animation(images.q3_attack, 182.9, 141, 7, ANIMATION_SPEED);
            this.animations.hurt = new Animation(images.q3_hurt, 180, 112, 2, ANIMATION_SPEED);
            this.animations.dead = new Animation(images.q3_dead, 188, 120, 2, ANIMATION_SPEED * 2); 
        }
    }

    askQuestion() {
        if (this.health <= 0) return null; 
        if (this.currentQuestionIndex >= this.questions.length) return null; 
        return this.questions[this.currentQuestionIndex];
    }
    
    takeDamage() {
        this.health -= 1;
        this.currentState = 'hurt'; 
        setTimeout(() => {
            if (this.health > 0) this.currentState = 'idle';
        }, 300); 
    }
    
    display() {
        if (this.health <= 0) {
            if (this.name === '提問者二') return; 
            this.currentState = 'dead'; 
        }
        
        push();
        translate(this.x, this.y);
        
        let drawY = -this.displayH; 

        if (this.animations[this.currentState]) {
            this.animations[this.currentState].display(
                -this.displayW / 2, 
                drawY, 
                this.displayW, 
                this.displayH
            );
        }

        // 顯示名稱和血量 (死亡後不顯示)
        if (this.health > 0) {
            fill(255);
            textAlign(CENTER, BOTTOM);
            text(`${this.name} (${this.health})`, 0, drawY - 5);
        }
        pop();
    }
}

// 藥水類別 (新增動畫功能)
class Potion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.visible = true; 
        this.question = POTION_QUESTION;
        this.displayW = POTION_W;
        this.displayH = POTION_H;
        this.animation = new Animation(images.potion, 541 / 8, 73, 8, ANIMATION_SPEED);
    }

    display() {
        if (this.visible && this.animation) {
            push();
            translate(this.x, this.y);
            this.animation.display(-this.displayW / 2, -this.displayH / 2, this.displayW, this.displayH);
            pop();
        }
    }
    
    static generateRandom() {
        let randX = random(TILE_SIZE, GAME_WIDTH - TILE_SIZE);
        // 確保藥水出現在角色頭部以上，避免被遮擋
        let randY = random(GROUND_Y - 200, GROUND_Y - 100); 
        return new Potion(randX, randY);
    }
}


// --- p5.js 核心函數 ---

function preload() {
    // 載入背景圖
    images.background = loadImage('background.jpg');
    // 載入藥水精靈圖 (541x73, 8 影格)
    images.potion = loadImage('potion.png');
    
    // 載入玩家精靈圖
    images.player_attack = loadImage('玩家/attack.png');
    images.player_dead = loadImage('玩家/dead.png');
    images.player_hurt = loadImage('玩家/hurt.png');
    images.player_idle = loadImage('玩家/idle.png');
    images.player_walk = loadImage('玩家/walk.png');
    
    // 載入提示角色精靈圖
    images.hint_dead = loadImage('提示角色/dead.png');
    images.hint_walk = loadImage('提示角色/walk.png');
    images.hint_hurt = loadImage('提示角色/hurt.png');
    images.hint_idle = loadImage('提示角色/idle.png');
    images.hint_jump = loadImage('提示角色/jump.png');
    images.hint_run = loadImage('提示角色/run.png');
    
    // 載入提問者一精靈圖
    images.q1_dead = loadImage('提問者一/dead.png');
    images.q1_walk = loadImage('提問者一/walk.png');
    images.q1_attack = loadImage('提問者一/attack.png');
    images.q1_hurt = loadImage('提問者一/hurt.png');
    images.q1_idle = loadImage('提問者一/idle.png');
    
    // 載入提問者二精靈圖
    images.q2_walk = loadImage('提問者二/walk.png');
    images.q2_attack = loadImage('提問者二/attack.png');
    images.q2_hurt = loadImage('提問者二/hurt.png');
    images.q2_idle = loadImage('提問者二/idle.png');
    
    // 載入提問者三精靈圖
    images.q3_dead = loadImage('提問者三/dead.png');
    images.q3_walk = loadImage('提問者三/walk.png');
    images.q3_attack = loadImage('提問者三/attack.png');
    images.q3_hurt = loadImage('提問者三/hurt.png');
    images.q3_idle = loadImage('提問者三/idle.png');
}

function setup() {
    let canvas = createCanvas(GAME_WIDTH, GAME_HEIGHT);
    canvas.parent('game-container');
    
    // 初始化遊戲物件
    player = new Player(GAME_WIDTH / 2, GROUND_Y); 
    player.initAnimations(); 
    
    // 提問者們
    let q1 = new Questioner(GAME_WIDTH / 4, GROUND_Y, '提問者一', '提問者一');
    let q2 = new Questioner(GAME_WIDTH / 2, GROUND_Y, '提問者二', '提問者二');
    let q3 = new Questioner(GAME_WIDTH * 3 / 4, GROUND_Y, '提問者三', '提問者三');
    questioners.push(q1, q2, q3);
    
    // 提示角色
    hintCharacter = new HintCharacter(TILE_SIZE + HINT_DISPLAY_W / 2, GROUND_Y); 
    hintCharacter.initAnimations(); 

    // 隨機生成第一個藥水
    potion = Potion.generateRandom(); 

    // 綁定 HTML 按鈕事件
    select('#submit-answer').mousePressed(handleSubmitAnswer);
    
    // 將所有答案轉換為小寫，方便比較
    for (let key in QUESTION_BANK) {
        QUESTION_BANK[key].forEach(q => {
            q.answer = q.answer.toLowerCase().trim();
        });
    }
    POTION_QUESTION.answer = POTION_QUESTION.answer.toLowerCase().trim();
}

function draw() {
    // 繪製背景
    if (images.background) {
        image(images.background, 0, 0, GAME_WIDTH, GAME_HEIGHT);
    } else {
        background(50, 150, 200);
    }
    
    // 玩家移動
    player.move();

    // 繪製所有物件
    if (currentQuestionerIndex < questioners.length) {
        questioners[currentQuestionerIndex].display();
    }
    hintCharacter.display();
    potion.display();
    player.display(); 
    
    // 遊戲邏輯檢查
    checkCollisions();
    
    // 繪製玩家血量
    drawPlayerHealth();
    
    // 遊戲結束檢查
    if (player.health <= 0) {
        gameOver(false); 
    }
}

// --- 碰撞及互動邏輯 (主要為碰撞檢測，觸發問題改為按鍵) ---

function checkCollisions() {
    // 1. 玩家與藥水碰撞（用於檢測是否可以觸發藥水問答）
    if (potion.visible && dist(player.x, player.y - player.displayH/2, potion.x, potion.y) < TILE_SIZE/2) {
        // 如果玩家在藥水附近，可以按空白鍵觸發
        // 實際觸發邏輯在 keyPressed()
    }
}

// 顯示問題介面
function displayQuestion(qData, type) {
    questionActive = true;
    currentQuestion = qData;
    currentQuestionType = type; 
    
    let sourceText = (type === 'potion') ? "🧪 藥水問題" : `⚔️ 來自 ${currentQuestioner.name} 的挑戰`;
    select('#question-source').html(sourceText);
    
    // 顯示問題和選項
    let questionHtml = qData.question + '<br>';
    qData.options.forEach(option => {
        // 使用 radio button 實現選擇題
        questionHtml += `<input type="radio" name="user-choice" value="${option.charAt(0).toLowerCase()}">${option}<br>`;
    });
    
    select('#question-text').html(questionHtml);
    select('#answer-input').value(''); // 清空文字輸入框
    select('#answer-input').hide(); // 隱藏文字輸入框
    
    select('#hint-area').html(''); 
    select('#question-overlay').removeClass('hidden');
}

// 隱藏問題介面
function hideQuestion() {
    questionActive = false;
    currentQuestion = null;
    currentQuestionType = null;
    select('#question-overlay').addClass('hidden');
    select('#answer-input').show(); // 恢復文字輸入框
    
    // 提問者回到 idle 狀態
    if (currentQuestioner && currentQuestioner.health > 0) {
        currentQuestioner.currentState = 'idle';
    }
    
    // 隱藏提示角色
    hintCharacterVisible = false;
    hintCharacter.x = TILE_SIZE + HINT_DISPLAY_W / 2;
    hintCharacter.y = GROUND_Y;
    hintCharacter.currentState = 'idle';
    
    currentQuestioner = null; 
}

// 處理答案提交
function handleSubmitAnswer() {
    if (!currentQuestion) return;

    let userAnswer;
    
    if (currentQuestionType === 'potion' || currentQuestion.options) {
        // 選擇題邏輯：獲取選中的 radio button 值
        let selected = selectAll('input[name="user-choice"]:checked');
        userAnswer = selected.length > 0 ? selected[0].value() : '';
    } else {
        // 假設是文字輸入，保留這個邏輯以防未來需要
        userAnswer = select('#answer-input').value().toLowerCase().trim();
    }
    
    let correctAnswer = currentQuestion.answer;
    
    if (userAnswer === correctAnswer) {
        handleCorrectAnswer();
    } else {
        handleWrongAnswer();
    }
    
    hideQuestion();
}

function handleCorrectAnswer() {
    if (currentQuestionType === 'potion') {
        // 藥水：回血
        player.health = constrain(player.health + 1, 0, MAX_PLAYER_HEALTH);
        potion.visible = false; 
        setTimeout(() => {
            potion = Potion.generateRandom();
        }, 8000); // 8 秒後重新生成
        console.log("藥水問題正確！玩家回血！");
    } else if (currentQuestionType === 'questioner') {
        // 提問者：玩家攻擊提問者
        // 玩家攻擊動畫已在 keyPressed 觸發
        currentQuestioner.takeDamage();
        currentQuestioner.currentQuestionIndex++;
        
        // 檢查當前提問者是否被擊敗
        if (currentQuestioner.health <= 0) {
            currentQuestionerIndex++;
            if (currentQuestionerIndex >= questioners.length) {
                gameOver(true); 
            }
        }
    }
}

function handleWrongAnswer() {
    player.health = constrain(player.health - 1, 0, MAX_PLAYER_HEALTH);
    player.currentState = 'hurt';
    
    // 提問者播放攻擊動畫
    if (currentQuestioner && currentQuestioner.health > 0) {
         currentQuestioner.currentState = 'attack';
         setTimeout(() => {
            currentQuestioner.currentState = 'idle';
         }, 500);
    }
    
    setTimeout(() => {
        player.currentState = 'idle';
    }, 500); 
}

// 提示功能：按下 K 鍵 (keyCode 75)
function keyPressed() {
    // 禁止在問答進行中觸發其他互動
    if (questionActive) {
        if (keyCode === 75 && currentQuestion) { // K 鍵觸發提示
            hintCharacterVisible = true;
            hintCharacter.x = GAME_WIDTH - 100; 
            hintCharacter.y = GROUND_Y; 
            hintCharacter.currentState = 'jump'; 
            
            setTimeout(() => {
                hintCharacter.currentState = 'idle';
            }, 500);

            let hint = currentQuestion.hint || "沒有可用的提示。";
            select('#hint-area').html(`<br><strong>💡 提示角色說：</strong> ${hint}`);
        }
        return;
    }

    // --- 玩家攻擊和問題觸發 (空白鍵) ---
    if (keyCode === 32) { // 空白鍵
        playerAttacking = true;
        player.currentState = 'attack';
        
        // 檢查是否靠近藥水
        if (potion.visible && dist(player.x, player.y - player.displayH/2, potion.x, potion.y) < TILE_SIZE*1.5) {
            displayQuestion(potion.question, 'potion');
        } 
        
        // 檢查是否靠近當前提問者
        else if (currentQuestionerIndex < questioners.length) {
            let q = questioners[currentQuestionerIndex];
            if (q.health > 0 && dist(player.x, player.y, q.x, q.y) < TILE_SIZE * 1.5) { // 攻擊範圍擴大一點
                let qData = q.askQuestion();
                if (qData) {
                    currentQuestioner = q;
                    displayQuestion(qData, 'questioner');
                    q.currentState = 'attack'; // 提問者進入攻擊姿態
                }
            }
        }
        
        // 攻擊動畫結束後，無論是否觸發問題，都切回 idle
        setTimeout(() => {
            player.currentState = 'idle';
            playerAttacking = false;
        }, 500); // 攻擊動畫持續 0.5 秒
    }
}

// 繪製玩家血量條
function drawPlayerHealth() {
    let barWidth = 100;
    let barHeight = 15;
    let x = 10;
    let y = 10;
    
    // 背景
    fill(50);
    rect(x, y, barWidth, barHeight);
    
    // 血條
    let healthRatio = player.health / MAX_PLAYER_HEALTH;
    fill(255, 0, 0); 
    rect(x, y, barWidth * healthRatio, barHeight);
    
    // 文字
    fill(255);
    textSize(12);
    textAlign(CENTER, CENTER);
    text(`HP: ${player.health}/${MAX_PLAYER_HEALTH}`, x + barWidth/2, y + barHeight/2);
}

// 遊戲結束
function gameOver(win) {
    noLoop(); 
    let message = win ? "🏆 恭喜你！擊敗了所有提問者！遊戲勝利！" : "💀 很可惜，玩家血量歸零，遊戲失敗！";
    setTimeout(() => {
        alert(message);
    }, 500);
}