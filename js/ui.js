// 用户界面控制模块
export class GameUI {
  constructor(game, renderer) {
    this.game = game;
    this.renderer = renderer;
    this.canvas = renderer.canvas;
    this.hoverPosition = null;
    // 复用 AudioContext，避免被浏览器自动播放策略阻止
    this.audioContext = null;
    // 存储事件处理器引用，用于 destroy 时移除
    this.boundHandlers = {};
    this.initEventListeners();
  }

  // 获取或创建 AudioContext（延迟创建，确保在用户交互后）
  getAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    // 浏览器自动暂停后恢复
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  // 初始化事件监听器
  initEventListeners() {
    // Canvas 点击事件
    this.boundHandlers.handleCanvasClick = this.handleCanvasClick.bind(this);
    this.canvas.addEventListener('click', this.boundHandlers.handleCanvasClick);

    // Canvas 鼠标移动事件
    this.boundHandlers.handleCanvasMouseMove = this.handleCanvasMouseMove.bind(this);
    this.canvas.addEventListener('mousemove', this.boundHandlers.handleCanvasMouseMove);

    // Canvas 鼠标离开事件
    this.boundHandlers.handleCanvasMouseLeave = this.handleCanvasMouseLeave.bind(this);
    this.canvas.addEventListener('mouseleave', this.boundHandlers.handleCanvasMouseLeave);

    // 触摸事件（移动端支持）
    this.boundHandlers.handleCanvasTouchStart = this.handleCanvasTouchStart.bind(this);
    this.canvas.addEventListener('touchstart', this.boundHandlers.handleCanvasTouchStart, { passive: false });

    this.boundHandlers.handleCanvasTouchMove = this.handleCanvasTouchMove.bind(this);
    this.canvas.addEventListener('touchmove', this.boundHandlers.handleCanvasTouchMove, { passive: false });

    this.boundHandlers.handleCanvasTouchEnd = this.handleCanvasTouchEnd.bind(this);
    this.canvas.addEventListener('touchend', this.boundHandlers.handleCanvasTouchEnd);

    // 控制按钮事件
    const restartBtn = document.getElementById('restartBtn');
    const undoBtn = document.getElementById('undoBtn');

    if (restartBtn) {
      this.boundHandlers.handleRestart = this.handleRestart.bind(this);
      restartBtn.addEventListener('click', this.boundHandlers.handleRestart);
    }

    if (undoBtn) {
      this.boundHandlers.handleUndo = this.handleUndo.bind(this);
      undoBtn.addEventListener('click', this.boundHandlers.handleUndo);
    }

    // 键盘事件
    this.boundHandlers.handleKeyDown = this.handleKeyDown.bind(this);
    document.addEventListener('keydown', this.boundHandlers.handleKeyDown);
  }

  // 处理 Canvas 点击
  handleCanvasClick(event) {
    if (this.game.gameOver) return;

    const boardPos = this.renderer.getBoardPosition(event.clientX, event.clientY);
    if (boardPos) {
      this.tryPlaceStone(boardPos.x, boardPos.y);
    }
  }

  // 处理 Canvas 触摸开始
  handleCanvasTouchStart(event) {
    event.preventDefault();
    if (this.game.gameOver) return;

    const touch = event.touches[0];
    const boardPos = this.renderer.getBoardPosition(touch.clientX, touch.clientY);
    if (boardPos) {
      this.tryPlaceStone(boardPos.x, boardPos.y);
    }
  }

  // 处理 Canvas 触摸移动（显示悬停提示）
  handleCanvasTouchMove(event) {
    event.preventDefault();
    if (this.game.gameOver) return;

    const touch = event.touches[0];
    const boardPos = this.renderer.getBoardPosition(touch.clientX, touch.clientY);
    if (boardPos && this.game.grid[boardPos.y][boardPos.x] === null) {
      this.hoverPosition = boardPos;
      this.renderer.render(this.game);
      this.renderer.drawHoverEffect(boardPos.x, boardPos.y, this.game.currentPlayer);
    } else {
      this.hoverPosition = null;
      this.renderer.render(this.game);
    }
  }

  // 处理 Canvas 触摸结束
  handleCanvasTouchEnd(event) {
    this.hoverPosition = null;
    this.renderer.render(this.game);
  }

  // 尝试落子（合并点击和触摸的落子逻辑）
  tryPlaceStone(x, y) {
    const success = this.game.placeStone(x, y);
    if (success) {
      this.updateUI();
      this.renderer.render(this.game);
      this.playPlaceSound();

      if (this.game.gameOver) {
        this.playWinSound();
      }
    }
  }

  // 处理 Canvas 鼠标移动（仅更新悬停提示，不全量重绘）
  handleCanvasMouseMove(event) {
    if (this.game.gameOver) return;

    const boardPos = this.renderer.getBoardPosition(event.clientX, event.clientY);
    if (boardPos && this.game.grid[boardPos.y][boardPos.x] === null) {
      if (this.hoverPosition &&
          this.hoverPosition.x === boardPos.x &&
          this.hoverPosition.y === boardPos.y) {
        return; // 位置未变化，跳过重绘
      }
      this.hoverPosition = boardPos;
      // 只绘制悬停提示层，不全量重绘
      this.renderer.render(this.game);
      this.renderer.drawHoverEffect(boardPos.x, boardPos.y, this.game.currentPlayer);
    } else {
      if (this.hoverPosition === null) return; // 已无悬停位置
      this.hoverPosition = null;
      this.renderer.render(this.game);
    }
  }

  // 处理 Canvas 鼠标离开
  handleCanvasMouseLeave() {
    this.hoverPosition = null;
    this.renderer.render(this.game);
  }

  // 处理重新开始
  handleRestart() {
    this.game.reset();
    this.updateUI();
    this.renderer.render(this.game);
    this.playRestartSound();
  }

  // 处理悔棋
  handleUndo() {
    if (this.game.moveHistory.length > 0 && !this.game.gameOver) {
      const success = this.game.undo();
      if (success) {
        this.updateUI();
        this.renderer.render(this.game);
        this.playUndoSound();
      }
    }
  }

  // 处理键盘事件
  handleKeyDown(event) {
    switch (event.key) {
      case 'r':
      case 'R':
        if (!this.isInputFocused()) {
          event.preventDefault();
          this.handleRestart();
        }
        break;
      case 'z':
      case 'Z':
        if (event.ctrlKey && !this.isInputFocused()) {
          event.preventDefault();
          this.handleUndo();
        }
        break;
      case 'Escape':
        if (!this.isInputFocused()) {
          this.handleRestart();
        }
        break;
    }
  }

  // 检查是否有输入框聚焦（避免快捷键与输入框冲突）
  isInputFocused() {
    const active = document.activeElement;
    return active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
  }

  // 更新用户界面
  updateUI() {
    this.updatePlayerInfo();
    this.updateGameStatus();
    this.updateControlButtons();
  }

  // 更新玩家信息
  updatePlayerInfo() {
    const currentPlayerEl = document.querySelector('.current-player');
    const playerPieceEl = document.querySelector('.player-piece');
    const playerNameEl = document.querySelector('.player-name');

    if (currentPlayerEl && playerPieceEl && playerNameEl) {
      playerPieceEl.className = `player-piece player-${this.game.currentPlayer}`;
      playerNameEl.textContent = this.game.currentPlayer === 'black' ? '黑棋' : '白棋';
    }
  }

  // 更新游戏状态
  updateGameStatus() {
    const gameStatusEl = document.querySelector('.game-status');
    if (!gameStatusEl) return;

    if (this.game.gameOver) {
      const winnerText = this.game.winner === 'black' ? '黑棋胜利！' : '白棋胜利！';
      gameStatusEl.textContent = winnerText;
      gameStatusEl.className = 'game-status game-status--win';
    } else {
      gameStatusEl.textContent = '游戏进行中';
      gameStatusEl.className = 'game-status';
    }
  }

  // 更新控制按钮状态
  updateControlButtons() {
    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) {
      undoBtn.disabled = this.game.moveHistory.length === 0 || this.game.gameOver;
    }
  }

  // 播放落子音效
  playPlaceSound() {
    try {
      const audioContext = this.getAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      // 音频不可用，静默忽略
    }
  }

  // 播放胜利音效
  playWinSound() {
    try {
      const audioContext = this.getAudioContext();
      const frequencies = [523, 659, 784, 1047]; // C5, E5, G5, C6
      const now = audioContext.currentTime;

      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(freq, now + index * 0.1);
        gainNode.gain.setValueAtTime(0.4, now + index * 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + index * 0.1 + 0.3);

        oscillator.start(now + index * 0.1);
        oscillator.stop(now + index * 0.1 + 0.3);
      });
    } catch (e) {
      // 音频不可用，静默忽略
    }
  }

  // 播放重新开始音效
  playRestartSound() {
    try {
      const audioContext = this.getAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
      // 音频不可用，静默忽略
    }
  }

  // 播放悔棋音效
  playUndoSound() {
    try {
      const audioContext = this.getAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      // 音频不可用，静默忽略
    }
  }

  // 销毁事件监听器，防止内存泄漏
  destroy() {
    // 移除 Canvas 事件
    this.canvas.removeEventListener('click', this.boundHandlers.handleCanvasClick);
    this.canvas.removeEventListener('mousemove', this.boundHandlers.handleCanvasMouseMove);
    this.canvas.removeEventListener('mouseleave', this.boundHandlers.handleCanvasMouseLeave);
    this.canvas.removeEventListener('touchstart', this.boundHandlers.handleCanvasTouchStart);
    this.canvas.removeEventListener('touchmove', this.boundHandlers.handleCanvasTouchMove);
    this.canvas.removeEventListener('touchend', this.boundHandlers.handleCanvasTouchEnd);

    // 移除按钮事件
    const restartBtn = document.getElementById('restartBtn');
    const undoBtn = document.getElementById('undoBtn');

    if (restartBtn && this.boundHandlers.handleRestart) {
      restartBtn.removeEventListener('click', this.boundHandlers.handleRestart);
    }
    if (undoBtn && this.boundHandlers.handleUndo) {
      undoBtn.removeEventListener('click', this.boundHandlers.handleUndo);
    }

    // 移除键盘事件
    document.removeEventListener('keydown', this.boundHandlers.handleKeyDown);

    // 关闭 AudioContext
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.boundHandlers = {};
  }
}
