const GRID_SIZE = 40;
const NORMAL_MINE_COUNT = 250;
const TOURNAMENT_MINE_COUNT = 500;
const TOURNAMENT_TIME_LIMIT = 20 * 60; // 20 minutes in seconds

class Minesweeper {
    constructor() {
        this.grid = [];
        this.mineLocations = new Set();
        this.gameOver = false;
        this.timer = 0;
        this.timerInterval = null;
        this.firstClick = true;
        this.tournamentMode = false;
        this.mineCount = NORMAL_MINE_COUNT;

        this.initializeGrid();
        this.setupEventListeners();
        this.updateMineCount();
    }

    initializeGrid() {
        const gridElement = document.getElementById('grid');
        gridElement.innerHTML = '';

        // Initialize empty grid
        for (let i = 0; i < GRID_SIZE; i++) {
            this.grid[i] = [];
            for (let j = 0; j < GRID_SIZE; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                gridElement.appendChild(cell);
                this.grid[i][j] = {
                    element: cell,
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborMines: 0
                };
            }
        }
    }

    placeMines(firstClickRow, firstClickCol) {
        let minesPlaced = 0;
        while (minesPlaced < this.mineCount) {
            const row = Math.floor(Math.random() * GRID_SIZE);
            const col = Math.floor(Math.random() * GRID_SIZE);
            
            // Avoid placing mine on first click or where a mine already exists
            if (!this.grid[row][col].isMine && 
                !(Math.abs(row - firstClickRow) <= 1 && Math.abs(col - firstClickCol) <= 1)) {
                this.grid[row][col].isMine = true;
                this.mineLocations.add(`${row},${col}`);
                minesPlaced++;
            }
        }

        // Calculate neighbor mines
        for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
                if (!this.grid[i][j].isMine) {
                    this.grid[i][j].neighborMines = this.countNeighborMines(i, j);
                }
            }
        }
    }

    countNeighborMines(row, col) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                if (newRow >= 0 && newRow < GRID_SIZE && 
                    newCol >= 0 && newCol < GRID_SIZE && 
                    this.grid[newRow][newCol].isMine) {
                    count++;
                }
            }
        }
        return count;
    }

    revealCell(row, col) {
        if (this.gameOver || this.grid[row][col].isRevealed || this.grid[row][col].isFlagged) {
            return;
        }

        if (this.firstClick) {
            this.firstClick = false;
            this.placeMines(row, col);
            this.startTimer();
        }

        const cell = this.grid[row][col];
        cell.isRevealed = true;
        cell.element.classList.add('revealed');

        if (cell.isMine) {
            this.gameOver = true;
            this.revealAllMines();
            alert('Game Over!');
            this.stopTimer();
            return;
        }

        if (cell.neighborMines === 0) {
            cell.element.textContent = '';
            this.revealNeighbors(row, col);
        } else {
            cell.element.textContent = cell.neighborMines;
        }

        if (this.checkWin()) {
            this.gameOver = true;
            alert('Congratulations! You won!');
            this.stopTimer();
        }
    }

    revealNeighbors(row, col) {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                if (newRow >= 0 && newRow < GRID_SIZE && 
                    newCol >= 0 && newCol < GRID_SIZE && 
                    !this.grid[newRow][newCol].isRevealed) {
                    this.revealCell(newRow, newCol);
                }
            }
        }
    }

    toggleFlag(row, col) {
        if (this.gameOver || this.grid[row][col].isRevealed) {
            return;
        }

        const cell = this.grid[row][col];
        cell.isFlagged = !cell.isFlagged;
        cell.element.classList.toggle('flagged');
        this.updateMineCount();
    }

    revealAllMines() {
        this.mineLocations.forEach(loc => {
            const [row, col] = loc.split(',').map(Number);
            this.grid[row][col].element.classList.add('mine');
        });
    }

    checkWin() {
        for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
                const cell = this.grid[i][j];
                // Check if all non-mine cells are revealed
                if (!cell.isMine && !cell.isRevealed) {
                    return false;
                }
                // Check if all mines are correctly flagged
                if (cell.isMine && !cell.isFlagged) {
                    return false;
                }
                // Check if any non-mine cells are flagged
                if (!cell.isMine && cell.isFlagged) {
                    return false;
                }
            }
        }
        return true;
    }

    updateMineCount() {
        let flagCount = 0;
        for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
                if (this.grid[i][j].isFlagged) {
                    flagCount++;
                }
            }
        }
        document.getElementById('mine-count').textContent = `Mines: ${this.mineCount - flagCount}`;
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.tournamentMode) {
                this.timer--;
                if (this.timer <= 0) {
                    this.gameOver = true;
                    this.revealAllMines();
                    alert('Time\'s up! Tournament failed!');
                    this.stopTimer();
                    return;
                }
            } else {
                this.timer++;
            }
            const minutes = Math.floor(this.timer / 60);
            const seconds = this.timer % 60;
            document.getElementById('timer').textContent = 
                `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }

    setupEventListeners() {
        const gridElement = document.getElementById('grid');
        gridElement.addEventListener('click', (e) => {
            if (e.target.classList.contains('cell')) {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                this.revealCell(row, col);
            }
        });

        gridElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (e.target.classList.contains('cell')) {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                this.toggleFlag(row, col);
            }
        });

        document.getElementById('new-game').addEventListener('click', () => {
            this.stopTimer();
            this.timer = this.tournamentMode ? TOURNAMENT_TIME_LIMIT : 0;
            const minutes = Math.floor(this.timer / 60);
            const seconds = this.timer % 60;
            document.getElementById('timer').textContent = 
                `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            this.gameOver = false;
            this.firstClick = true;
            this.mineLocations.clear();
            this.mineCount = this.tournamentMode ? TOURNAMENT_MINE_COUNT : NORMAL_MINE_COUNT;
            this.initializeGrid();
            this.updateMineCount();
        });

        document.getElementById('toggle-mode').addEventListener('click', (e) => {
            this.tournamentMode = !this.tournamentMode;
            e.target.classList.toggle('active');
            this.stopTimer();
            this.timer = this.tournamentMode ? TOURNAMENT_TIME_LIMIT : 0;
            const minutes = Math.floor(this.timer / 60);
            const seconds = this.timer % 60;
            document.getElementById('timer').textContent = 
                `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            this.mineCount = this.tournamentMode ? TOURNAMENT_MINE_COUNT : NORMAL_MINE_COUNT;
            this.initializeGrid();
            this.updateMineCount();
        });
    }
}

// Start the game
new Minesweeper();