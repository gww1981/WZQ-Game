// 渲染模块
export class GameRenderer {
  constructor(canvas, boardSize = 15) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.boardSize = boardSize;
    // 背景相关属性
    this.backgroundImage = null;
    this.backgroundLoaded = false;
    this.backgroundType = 'default'; // 'default' | 'preset' | 'custom'
    this.setupCanvas();
  }

  // 设置 Canvas（支持高 DPI 屏幕）
  // 关键原则：canvas 内部分辨率 = CSS尺寸 × DPR，这样 ctx 坐标始终等于 CSS 像素
  // getBoardPosition 也用 CSS 像素，两者完全一致
  setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = this.canvas.clientWidth;
    const displayHeight = this.canvas.clientHeight;

    // 设置内部分辨率为 CSS 尺寸 × DPR（物理像素）
    this.canvas.width = displayWidth * dpr;
    this.canvas.height = displayHeight * dpr;

    // 缩放 ctx，这样 ctx 坐标 = CSS 像素，与 getBoardPosition 一致
    this.ctx.scale(dpr, dpr);

    // cellSize 用 CSS 像素，与绘制坐标和点击坐标完全对齐
    this.cellSize = displayWidth / (this.boardSize + 1);
    this.pieceRadius = this.cellSize * 0.4;

    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  // 响应式重置：当 canvas CSS 尺寸变化时，重新设置分辨率
  resize() {
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = this.canvas.clientWidth;
    const displayHeight = this.canvas.clientHeight;

    // 重置变换（避免 ctx.scale 累积）
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);

    this.canvas.width = displayWidth * dpr;
    this.canvas.height = displayHeight * dpr;

    this.cellSize = displayWidth / (this.boardSize + 1);
    this.pieceRadius = this.cellSize * 0.4;
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
    this.ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
  }

  // 绘制棋盘
  drawBoard() {
    const { ctx, cellSize, boardSize } = this;
    const padding = cellSize;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    // 绘制棋盘背景
    if (this.backgroundLoaded && this.backgroundImage) {
      this.drawBackground();
    } else {
      ctx.fillStyle = '#deb887';
      ctx.fillRect(0, 0, w, h);
    }

    // 绘制网格线
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 1;

    for (let i = 0; i < boardSize; i++) {
      const pos = padding + i * cellSize;

      // 横线
      ctx.beginPath();
      ctx.moveTo(padding, pos);
      ctx.lineTo(w - padding, pos);
      ctx.stroke();

      // 竖线
      ctx.beginPath();
      ctx.moveTo(pos, padding);
      ctx.lineTo(pos, h - padding);
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
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    ctx.fillStyle = 'rgba(220, 53, 69, 0.1)';
    ctx.fillRect(0, 0, w, h);

    ctx.font = 'bold 48px Microsoft YaHei';
    ctx.fillStyle = '#dc3545';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const winnerText = board.winner === 'black' ? '黑棋胜利！' : '白棋胜利！';
    ctx.fillText(winnerText, w / 2, h / 2);
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

  // 设置背景图片
  // source: URL 字符串（本地或网络路径）或 File 对象
  // type: 'preset' | 'custom'
  setBackground(source, type = 'preset') {
    this.backgroundSrc = source; // 保存用于 LocalStorage
    const img = new Image();
    img.onload = () => {
      this.backgroundImage = img;
      this.backgroundLoaded = true;
      this.backgroundType = type;
      this.saveToStorage();
      if (this.board) {
        this.render(this.board);
      }
    };
    img.onerror = () => {
      console.error('背景图片加载失败:', source);
    };
    img.src = source;
  }

  // 清除背景，恢复默认木色
  clearBackground() {
    this.backgroundImage = null;
    this.backgroundLoaded = false;
    this.backgroundType = 'default';
    this.clearFromStorage();
    if (this.board) {
      this.render(this.board);
    }
  }

  // 绘制背景图（保持比例裁剪，object-fit: cover 逻辑）
  drawBackground() {
    const { ctx } = this;
    const img = this.backgroundImage;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    if (!img) return;

    const imgRatio = img.width / img.height;
    const canvasRatio = w / h;

    let sx, sy, sw, sh;

    if (imgRatio > canvasRatio) {
      // 图片更宽，裁剪左右
      sh = img.height;
      sw = sh * canvasRatio;
      sx = (img.width - sw) / 2;
      sy = 0;
    } else {
      // 图片更高，裁剪上下
      sw = img.width;
      sh = sw / canvasRatio;
      sx = 0;
      sy = (img.height - sh) / 2;
    }

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
  }

  // LocalStorage 持久化
  saveToStorage() {
    if (this.backgroundType === 'default') return;
    const data = {
      type: this.backgroundType,
      src: this.backgroundSrc
    };
    try {
      localStorage.setItem('wzq-background', JSON.stringify(data));
    } catch (e) {
      // storage 可能不可用
    }
  }

  // 从 LocalStorage 恢复背景
  loadFromStorage() {
    try {
      const raw = localStorage.getItem('wzq-background');
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.type && data.src) {
        this.backgroundSrc = data.src;
        this.setBackground(data.src, data.type);
      }
    } catch (e) {
      // storage 不可用或数据损坏
    }
  }

  // 清除 LocalStorage 中的背景
  clearFromStorage() {
    try {
      localStorage.removeItem('wzq-background');
    } catch (e) {
      // ignore
    }
  }
}