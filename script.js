const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const hiScoreElement = document.getElementById('hi-score');
const gameOverScreen = document.getElementById('game-over');

// Game settings
const gridSize = 10;
const tileCount = canvas.width / gridSize;
const gameSpeed = 100; // ms per frame

// Colors
const colorBg = '#879b76';
const colorSnake = '#1e2618'; // Dark retro pixel color
const colorFood = '#cc0000'; // Bright red food

// Game state
let snake = [];
let food = { x: 0, y: 0 };
let dx = 0;
let dy = 0;
let score = 0;
let hiScore = localStorage.getItem('snakeHiScore') || 0;
hiScoreElement.innerText = hiScore;
let gameLoopInterval;
let isGameOver = false;

// Buttons
const btnUp = document.getElementById('btn-up');
const btnDown = document.getElementById('btn-down');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnOk = document.getElementById('btn-ok');

function initGame() {
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    dx = 1;
    dy = 0;
    score = 0;
    scoreElement.innerText = score;
    isGameOver = false;
    gameOverScreen.classList.add('hidden');
    spawnFood();
    
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    gameLoopInterval = setInterval(gameLoop, gameSpeed);
}

function spawnFood() {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * (canvas.height / gridSize - 2)) + 2; // avoid top 20px (scoreboard)
    
    // Make sure food doesn't spawn on snake
    for (let part of snake) {
        if (part.x === food.x && part.y === food.y) {
            spawnFood();
            return;
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
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= (canvas.height / gridSize)) {
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
    
    snake.unshift(head);
    
    // Check food collision
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.innerText = score;
        spawnFood();
    } else {
        snake.pop();
    }
}

function draw() {
    // Clear canvas
    ctx.fillStyle = colorBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw food
    ctx.fillStyle = colorFood;
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 1, gridSize - 1);
    
    // Draw snake
    ctx.fillStyle = colorSnake;
    for (let i = 0; i < snake.length; i++) {
        // Draw slightly smaller to create grid effect
        ctx.fillRect(snake[i].x * gridSize, snake[i].y * gridSize, gridSize - 1, gridSize - 1);
    }
}

function gameOver() {
    isGameOver = true;
    clearInterval(gameLoopInterval);
    
    if (score > hiScore) {
        hiScore = score;
        localStorage.setItem('snakeHiScore', hiScore);
        hiScoreElement.innerText = hiScore;
    }
    
    gameOverScreen.classList.remove('hidden');
}

// Input handling
function setDirection(newDx, newDy) {
    if (isGameOver) return;
    
    // Prevent reversing
    if (newDx === -dx && newDx !== 0) return;
    if (newDy === -dy && newDy !== 0) return;
    
    dx = newDx;
    dy = newDy;
}

window.addEventListener('keydown', e => {
    // Prevent default scrolling for arrow keys
    if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }

    if (isGameOver && (e.code === 'Space' || e.code === 'Enter')) {
        initGame();
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
btnUp.addEventListener('touchstart', (e) => { e.preventDefault(); setDirection(0, -1); });
btnDown.addEventListener('touchstart', (e) => { e.preventDefault(); setDirection(0, 1); });
btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); setDirection(-1, 0); });
btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); setDirection(1, 0); });

btnUp.addEventListener('mousedown', () => setDirection(0, -1));
btnDown.addEventListener('mousedown', () => setDirection(0, 1));
btnLeft.addEventListener('mousedown', () => setDirection(-1, 0));
btnRight.addEventListener('mousedown', () => setDirection(1, 0));

btnOk.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (isGameOver) initGame();
});
btnOk.addEventListener('mousedown', () => {
    if (isGameOver) initGame();
});

// Start game initially
initGame();
