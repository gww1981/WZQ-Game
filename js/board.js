// 棋盘管理模块
export class GameBoard {
  constructor(size = 15) {
    this.size = size;
    this.grid = this.createGrid();
    this.currentPlayer = 'black'; // 'black' 或 'white'
    this.gameOver = false;
    this.winner = null;
    this.moveHistory = [];
  }

  // 创建空棋盘
  createGrid() {
    return Array(this.size).fill().map(() => Array(this.size).fill(null));
  }

  // 重置棋盘
  reset() {
    this.grid = this.createGrid();
    this.currentPlayer = 'black';
    this.gameOver = false;
    this.winner = null;
    this.moveHistory = [];
  }

  // 落子
  placeStone(x, y) {
    if (this.gameOver || this.grid[y][x] !== null) {
      return false;
    }

    this.grid[y][x] = this.currentPlayer;
    this.moveHistory.push({ x, y, player: this.currentPlayer });

    // 检查胜负
    if (this.checkWin(x, y)) {
      this.gameOver = true;
      this.winner = this.currentPlayer;
      return true;
    }

    // 切换玩家
    this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
    return true;
  }

  // 悔棋
  undo() {
    if (this.moveHistory.length === 0 || this.gameOver) {
      return false;
    }

    const lastMove = this.moveHistory.pop();
    this.grid[lastMove.y][lastMove.x] = null;
    this.currentPlayer = lastMove.player;
    this.gameOver = false;
    this.winner = null;
    return true;
  }

  // 检查是否获胜
  checkWin(x, y) {
    const player = this.grid[y][x];
    const directions = [
      [1, 0],   // 水平
      [0, 1],   // 垂直
      [1, 1],   // 右下对角线
      [1, -1]   // 右上对角线
    ];

    for (const [dx, dy] of directions) {
      let count = 1;

      // 正向检查
      for (let i = 1; i <= 4; i++) {
        const nx = x + dx * i;
        const ny = y + dy * i;
        if (this.isValidPosition(nx, ny) && this.grid[ny][nx] === player) {
          count++;
        } else {
          break;
        }
      }

      // 反向检查
      for (let i = 1; i <= 4; i++) {
        const nx = x - dx * i;
        const ny = y - dy * i;
        if (this.isValidPosition(nx, ny) && this.grid[ny][nx] === player) {
          count++;
        } else {
          break;
        }
      }

      if (count >= 5) {
        return true;
      }
    }

    return false;
  }

  // 检查位置是否有效
  isValidPosition(x, y) {
    return x >= 0 && x < this.size && y >= 0 && y < this.size;
  }

  // 获取棋盘状态
  getBoardState() {
    return {
      grid: this.grid.map(row => [...row]),
      currentPlayer: this.currentPlayer,
      gameOver: this.gameOver,
      winner: this.winner,
      moveCount: this.moveHistory.length
    };
  }

  // 获取可用的落子位置
  getAvailableMoves() {
    const moves = [];
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.grid[y][x] === null) {
          moves.push({ x, y });
        }
      }
    }
    return moves;
  }
}