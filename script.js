const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const hiScoreElement = document.getElementById('hi-score');
const gameOverScreen = document.getElementById('game-over');

// Game settings
const gridSize = 10;
const tileCount = canvas.width / gridSize;
const baseSpeed = 250; // Starts very slow
let currentSpeed = baseSpeed;
const minSpeed = 50; // Max speed cap

// Tron Colors
const colorBg = '#050505';
const colorSnake = '#0ff'; // Neon Cyan
const colorSnakeHead = '#fff';
const colorFood = '#f0f'; // Neon Pink
const colorObstacle = '#80f'; // Neon Purple

// Game state
let snake = [];
let food = { x: 0, y: 0 };
let obstacles = [];
let dx = 0;
let dy = 0;
let score = 0;
let hiScore = localStorage.getItem('tronSnakeHiScore') || 0;
hiScoreElement.innerText = hiScore;
let gameLoopInterval;
let isGameOver = false;
let audioCtx;
let gameStarted = false;

// Buttons
const btnUp = document.getElementById('btn-up');
const btnDown = document.getElementById('btn-down');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnOk = document.getElementById('btn-ok');

// Initialize Web Audio API on first interaction
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playTone(frequency, type, duration, vol=0.1) {
    if (!audioCtx) return;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
}

function playEatSound() { playTone(880, 'square', 0.1); }
function playCrashSound() { playTone(150, 'sawtooth', 0.5, 0.2); }
function playMoveSound() { playTone(440, 'sine', 0.05, 0.02); }

function resetGame() {
    snake = [
        { x: 10, y: 15 },
        { x: 9, y: 15 },
        { x: 8, y: 15 }
    ];
    dx = 1;
    dy = 0;
    score = 0;
    currentSpeed = baseSpeed;
    scoreElement.innerText = score;
    isGameOver = false;
    gameStarted = true;
    gameOverScreen.classList.add('hidden');
    
    generateObstacles();
    spawnFood();
    startGameLoop();
}

function startGameLoop() {
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    gameLoopInterval = setInterval(gameLoop, currentSpeed);
}

function generateObstacles() {
    obstacles = [];
    // Obstacles removed as requested
}

function spawnFood() {
    let validSpawn = false;
    while (!validSpawn) {
        food.x = Math.floor(Math.random() * tileCount);
        food.y = Math.floor(Math.random() * (canvas.height / gridSize - 2)) + 2; // avoid top 20px
        
        validSpawn = true;
        for (let part of snake) {
            if (part.x === food.x && part.y === food.y) validSpawn = false;
        }
        for (let obs of obstacles) {
            if (obs.x === food.x && obs.y === food.y) validSpawn = false;
        }
    }
}

function gameLoop() {
    update();
    draw();
}

function update() {
    if (isGameOver) return;

    // Move snake
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    
    // Check wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 2 || head.y >= (canvas.height / gridSize)) {
        gameOver();
        return;
    }
    
    // Check self collision
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return;
        }
    }
    
    // Check obstacle collision
    for (let i = 0; i < obstacles.length; i++) {
        if (head.x === obstacles[i].x && head.y === obstacles[i].y) {
            gameOver();
            return;
        }
    }
    
    snake.unshift(head);
    
    // Check food collision
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.innerText = score;
        playEatSound();
        spawnFood();
        
        // Speed up
        if (currentSpeed > minSpeed) {
            currentSpeed -= 10; // Increases speed slightly
            startGameLoop();
        }
    } else {
        snake.pop();
    }
}

function draw() {
    // Clear canvas
    ctx.fillStyle = colorBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Apply Glow effect
    ctx.shadowBlur = 10;
    
    // Draw obstacles
    ctx.fillStyle = colorObstacle;
    ctx.shadowColor = colorObstacle;
    for (let obs of obstacles) {
        ctx.fillRect(obs.x * gridSize + 1, obs.y * gridSize + 1, gridSize - 2, gridSize - 2);
    }
    
    // Draw food
    ctx.fillStyle = colorFood;
    ctx.shadowColor = colorFood;
    ctx.fillRect(food.x * gridSize + 1, food.y * gridSize + 1, gridSize - 2, gridSize - 2);
    
    // Draw snake
    ctx.shadowColor = colorSnake;
    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = i === 0 ? colorSnakeHead : colorSnake;
        ctx.fillRect(snake[i].x * gridSize + 1, snake[i].y * gridSize + 1, gridSize - 2, gridSize - 2);
    }
    
    // Reset glow for performance
    ctx.shadowBlur = 0;
}

function gameOver() {
    if (!isGameOver) playCrashSound();
    isGameOver = true;
    clearInterval(gameLoopInterval);
    
    if (score > hiScore) {
        hiScore = score;
        localStorage.setItem('tronSnakeHiScore', hiScore);
        hiScoreElement.innerText = hiScore;
    }
    
    gameOverScreen.classList.remove('hidden');
}

// Input handling
function setDirection(newDx, newDy) {
    initAudio();
    if (isGameOver) return;
    
    // Prevent reversing
    if (newDx === -dx && newDx !== 0) return;
    if (newDy === -dy && newDy !== 0) return;
    
    // Only play move sound if actually changing direction
    if (dx !== newDx || dy !== newDy) {
        playMoveSound();
    }
    
    dx = newDx;
    dy = newDy;
}

window.addEventListener('keydown', e => {
    if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }

    if (!gameStarted && (e.code === 'Space' || e.code === 'Enter' || e.code.startsWith('Arrow'))) {
        initAudio();
        resetGame();
        return;
    }

    if (isGameOver && (e.code === 'Space' || e.code === 'Enter')) {
        initAudio();
        resetGame();
        return;
    }

    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            setDirection(0, -1);
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            setDirection(0, 1);
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            setDirection(-1, 0);
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            setDirection(1, 0);
            break;
    }
});

// On-screen buttons
const handleBtnPress = (newDx, newDy) => {
    return (e) => {
        e.preventDefault();
        initAudio();
        if (!gameStarted || isGameOver) resetGame();
        else setDirection(newDx, newDy);
    }
}

btnUp.addEventListener('touchstart', handleBtnPress(0, -1));
btnDown.addEventListener('touchstart', handleBtnPress(0, 1));
btnLeft.addEventListener('touchstart', handleBtnPress(-1, 0));
btnRight.addEventListener('touchstart', handleBtnPress(1, 0));

btnUp.addEventListener('mousedown', handleBtnPress(0, -1));
btnDown.addEventListener('mousedown', handleBtnPress(0, 1));
btnLeft.addEventListener('mousedown', handleBtnPress(-1, 0));
btnRight.addEventListener('mousedown', handleBtnPress(1, 0));

btnOk.addEventListener('touchstart', (e) => {
    e.preventDefault();
    initAudio();
    if (!gameStarted || isGameOver) resetGame();
});
btnOk.addEventListener('mousedown', () => {
    initAudio();
    if (!gameStarted || isGameOver) resetGame();
});

// Initial state
snake = [
    { x: 10, y: 15 },
    { x: 9, y: 15 },
    { x: 8, y: 15 }
];
food = { x: 5, y: 5 }; // Dummy food for visual
obstacles = [];
generateObstacles();
draw();
