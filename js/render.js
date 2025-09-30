// 渲染模块
export class GameRenderer {
  constructor(canvas, boardSize = 15) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.boardSize = boardSize;
    this.cellSize = canvas.width / (boardSize + 1);
    this.pieceRadius = this.cellSize * 0.4;
    this.setupCanvas();
  }

  // 设置 Canvas
  setupCanvas() {
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  // 渲染整个棋盘
  render(board) {
    this.clearCanvas();
    this.drawBoard();
    this.drawPieces(board);
    if (board.gameOver) {
      this.drawWinEffect(board);
    }
  }

  // 清空画布
  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // 绘制棋盘
  drawBoard() {
    const { ctx, cellSize, boardSize } = this;
    const padding = cellSize;

    // 绘制棋盘背景
    ctx.fillStyle = '#deb887';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 绘制网格线
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 1;

    for (let i = 0; i < boardSize; i++) {
      const pos = padding + i * cellSize;

      // 横线
      ctx.beginPath();
      ctx.moveTo(padding, pos);
      ctx.lineTo(this.canvas.width - padding, pos);
      ctx.stroke();

      // 竖线
      ctx.beginPath();
      ctx.moveTo(pos, padding);
      ctx.lineTo(pos, this.canvas.height - padding);
      ctx.stroke();
    }

    // 绘制天元和星位
    this.drawStarPoints();
  }

  // 绘制星位
  drawStarPoints() {
    const { ctx, cellSize } = this;
    const padding = cellSize;
    const starPoints = [3, 7, 11]; // 15x15 棋盘的星位位置

    ctx.fillStyle = '#8b4513';

    starPoints.forEach(x => {
      starPoints.forEach(y => {
        const centerX = padding + x * cellSize;
        const centerY = padding + y * cellSize;

        ctx.beginPath();
        ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  }

  // 绘制棋子
  drawPieces(board) {
    const { ctx, cellSize } = this;
    const padding = cellSize;

    for (let y = 0; y < this.boardSize; y++) {
      for (let x = 0; x < this.boardSize; x++) {
        const player = board.grid[y][x];
        if (player) {
          const centerX = padding + x * cellSize;
          const centerY = padding + y * cellSize;

          this.drawPiece(centerX, centerY, player);
        }
      }
    }
  }

  // 绘制单个棋子
  drawPiece(x, y, player) {
    const { ctx, pieceRadius } = this;

    // 棋子阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // 棋子主体
    const gradient = ctx.createRadialGradient(
      x - pieceRadius * 0.3, y - pieceRadius * 0.3, 0,
      x, y, pieceRadius
    );

    if (player === 'black') {
      gradient.addColorStop(0, '#666');
      gradient.addColorStop(1, '#000');
    } else {
      gradient.addColorStop(0, '#fff');
      gradient.addColorStop(1, '#ddd');
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, pieceRadius, 0, Math.PI * 2);
    ctx.fill();

    // 棋子边框
    ctx.strokeStyle = player === 'black' ? '#333' : '#999';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 白棋高光效果
    if (player === 'white') {
      const highlightGradient = ctx.createRadialGradient(
        x - pieceRadius * 0.2, y - pieceRadius * 0.2, 0,
        x, y, pieceRadius * 0.8
      );
      highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = highlightGradient;
      ctx.beginPath();
      ctx.arc(x - pieceRadius * 0.15, y - pieceRadius * 0.15, pieceRadius * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 绘制胜利效果
  drawWinEffect(board) {
    const { ctx } = this;

    ctx.fillStyle = 'rgba(220, 53, 69, 0.1)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.font = 'bold 48px Microsoft YaHei';
    ctx.fillStyle = '#dc3545';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const winnerText = board.winner === 'black' ? '黑棋胜利！' : '白棋胜利！';
    ctx.fillText(winnerText, this.canvas.width / 2, this.canvas.height / 2);
  }

  // 获取点击的棋盘坐标
  getBoardPosition(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const padding = this.cellSize;

    const boardX = Math.round((x - padding) / this.cellSize);
    const boardY = Math.round((y - padding) / this.cellSize);

    if (boardX >= 0 && boardX < this.boardSize &&
        boardY >= 0 && boardY < this.boardSize) {
      return { x: boardX, y: boardY };
    }

    return null;
  }

  // 绘制落子提示
  drawHoverEffect(x, y, player) {
    const { ctx, cellSize } = this;
    const padding = cellSize;
    const centerX = padding + x * cellSize;
    const centerY = padding + y * cellSize;

    ctx.strokeStyle = player === 'black' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    ctx.beginPath();
    ctx.arc(centerX, centerY, this.pieceRadius * 0.8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([]);
  }
}