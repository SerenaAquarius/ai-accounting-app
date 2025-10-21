// Tetris Game Implementation
class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('tetrisCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.linesElement = document.getElementById('lines');
        this.overlay = document.getElementById('gameOverlay');
        this.overlayTitle = document.getElementById('overlayTitle');
        this.overlayMessage = document.getElementById('overlayMessage');
        this.startButton = document.getElementById('startButton');

        // Game constants
        this.COLS = 10;
        this.ROWS = 20;
        this.BLOCK_SIZE = 24;
        this.COLORS = [
            null,
            '#FF0D72', // I
            '#0DC2FF', // O
            '#0DFF72', // T
            '#F538FF', // J
            '#FF8E0D', // L
            '#FFE138', // S
            '#3877FF'  // Z
        ];

        // Tetromino shapes
        this.SHAPES = [
            [], // Empty
            [[1, 1, 1, 1]], // I
            [[1, 1], [1, 1]], // O
            [[0, 1, 0], [1, 1, 1]], // T
            [[1, 0, 0], [1, 1, 1]], // J
            [[0, 0, 1], [1, 1, 1]], // L
            [[0, 1, 1], [1, 1, 0]], // S
            [[1, 1, 0], [0, 1, 1]]  // Z
        ];

        // Game state
        this.board = this.createBoard();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.isPaused = false;
        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;

        this.currentPiece = null;
        this.currentX = 0;
        this.currentY = 0;

        this.setupControls();
        this.setupKeyboard();
    }

    createBoard() {
        return Array.from({ length: this.ROWS }, () => Array(this.COLS).fill(0));
    }

    setupControls() {
        this.startButton.addEventListener('click', () => this.start());
        document.getElementById('leftBtn').addEventListener('click', () => this.move(-1));
        document.getElementById('rightBtn').addEventListener('click', () => this.move(1));
        document.getElementById('downBtn').addEventListener('click', () => this.moveDown());
        document.getElementById('rotateBtn').addEventListener('click', () => this.rotate());
        document.getElementById('dropBtn').addEventListener('click', () => this.drop());
    }

    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver || this.isPaused) return;

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.move(-1);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.move(1);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.moveDown();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.rotate();
                    break;
                case ' ':
                    e.preventDefault();
                    this.drop();
                    break;
            }
        });
    }

    start() {
        this.board = this.createBoard();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.isPaused = false;
        this.dropInterval = 1000;
        this.updateStats();
        this.hideOverlay();
        this.spawnPiece();
        this.lastTime = performance.now();
        this.gameLoop();
    }

    spawnPiece() {
        const typeId = Math.floor(Math.random() * 7) + 1;
        this.currentPiece = this.SHAPES[typeId];
        this.currentType = typeId;
        this.currentX = Math.floor(this.COLS / 2) - Math.floor(this.currentPiece[0].length / 2);
        this.currentY = 0;

        if (this.checkCollision()) {
            this.endGame();
        }
    }

    checkCollision(piece = this.currentPiece, x = this.currentX, y = this.currentY) {
        for (let row = 0; row < piece.length; row++) {
            for (let col = 0; col < piece[row].length; col++) {
                if (piece[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    
                    if (newX < 0 || newX >= this.COLS || newY >= this.ROWS) {
                        return true;
                    }
                    
                    if (newY >= 0 && this.board[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    move(dir) {
        this.currentX += dir;
        if (this.checkCollision()) {
            this.currentX -= dir;
        }
    }

    moveDown() {
        this.currentY++;
        if (this.checkCollision()) {
            this.currentY--;
            this.merge();
            this.clearLines();
            this.spawnPiece();
        }
        this.dropCounter = 0;
    }

    rotate() {
        const rotated = this.currentPiece[0].map((_, i) =>
            this.currentPiece.map(row => row[i]).reverse()
        );

        const prevPiece = this.currentPiece;
        this.currentPiece = rotated;

        if (this.checkCollision()) {
            this.currentPiece = prevPiece;
        }
    }

    drop() {
        while (!this.checkCollision(this.currentPiece, this.currentX, this.currentY + 1)) {
            this.currentY++;
        }
        this.merge();
        this.clearLines();
        this.spawnPiece();
        this.dropCounter = 0;
    }

    merge() {
        for (let row = 0; row < this.currentPiece.length; row++) {
            for (let col = 0; col < this.currentPiece[row].length; col++) {
                if (this.currentPiece[row][col]) {
                    const y = this.currentY + row;
                    const x = this.currentX + col;
                    if (y >= 0 && y < this.ROWS && x >= 0 && x < this.COLS) {
                        this.board[y][x] = this.currentType;
                    }
                }
            }
        }
    }

    clearLines() {
        let linesCleared = 0;
        
        for (let row = this.ROWS - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell !== 0)) {
                this.board.splice(row, 1);
                this.board.unshift(Array(this.COLS).fill(0));
                linesCleared++;
                row++; // Check the same row again
            }
        }

        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += [40, 100, 300, 1200][linesCleared - 1] * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            this.updateStats();
        }
    }

    updateStats() {
        this.scoreElement.textContent = this.score;
        this.levelElement.textContent = this.level;
        this.linesElement.textContent = this.lines;
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        for (let row = 0; row <= this.ROWS; row++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, row * this.BLOCK_SIZE);
            this.ctx.lineTo(this.canvas.width, row * this.BLOCK_SIZE);
            this.ctx.stroke();
        }
        for (let col = 0; col <= this.COLS; col++) {
            this.ctx.beginPath();
            this.ctx.moveTo(col * this.BLOCK_SIZE, 0);
            this.ctx.lineTo(col * this.BLOCK_SIZE, this.canvas.height);
            this.ctx.stroke();
        }

        // Draw board
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (this.board[row][col]) {
                    this.drawBlock(col, row, this.board[row][col]);
                }
            }
        }

        // Draw current piece
        if (this.currentPiece) {
            for (let row = 0; row < this.currentPiece.length; row++) {
                for (let col = 0; col < this.currentPiece[row].length; col++) {
                    if (this.currentPiece[row][col]) {
                        this.drawBlock(
                            this.currentX + col,
                            this.currentY + row,
                            this.currentType
                        );
                    }
                }
            }
        }
    }

    drawBlock(x, y, type) {
        const color = this.COLORS[type];
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            x * this.BLOCK_SIZE + 1,
            y * this.BLOCK_SIZE + 1,
            this.BLOCK_SIZE - 2,
            this.BLOCK_SIZE - 2
        );

        // Add highlight effect
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(
            x * this.BLOCK_SIZE + 1,
            y * this.BLOCK_SIZE + 1,
            this.BLOCK_SIZE - 2,
            this.BLOCK_SIZE / 2
        );
    }

    gameLoop(time = 0) {
        if (this.gameOver) return;

        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        this.dropCounter += deltaTime;

        if (this.dropCounter > this.dropInterval) {
            this.moveDown();
        }

        this.draw();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    endGame() {
        this.gameOver = true;
        this.overlayTitle.textContent = '游戏结束';
        this.overlayMessage.textContent = `得分: ${this.score} | 等级: ${this.level} | 消除: ${this.lines}行`;
        this.startButton.textContent = '再玩一次';
        this.showOverlay();
    }

    showOverlay() {
        this.overlay.classList.remove('hidden');
    }

    hideOverlay() {
        this.overlay.classList.add('hidden');
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const game = new TetrisGame();
});
