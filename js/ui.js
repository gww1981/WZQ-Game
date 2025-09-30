// 用户界面控制模块
export class GameUI {
  constructor(game, renderer) {
    this.game = game;
    this.renderer = renderer;
    this.canvas = renderer.canvas;
    this.hoverPosition = null;
    this.initEventListeners();
  }

  // 初始化事件监听器
  initEventListeners() {
    // Canvas 点击事件
    this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));

    // Canvas 鼠标移动事件
    this.canvas.addEventListener('mousemove', this.handleCanvasMouseMove.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleCanvasMouseLeave.bind(this));

    // 控制按钮事件
    const restartBtn = document.getElementById('restartBtn');
    const undoBtn = document.getElementById('undoBtn');

    if (restartBtn) {
      restartBtn.addEventListener('click', this.handleRestart.bind(this));
    }

    if (undoBtn) {
      undoBtn.addEventListener('click', this.handleUndo.bind(this));
    }

    // 键盘事件
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  // 处理 Canvas 点击
  handleCanvasClick(event) {
    if (this.game.gameOver) return;

    const boardPos = this.renderer.getBoardPosition(event.clientX, event.clientY);
    if (boardPos) {
      const success = this.game.placeStone(boardPos.x, boardPos.y);
      if (success) {
        this.updateUI();
        this.renderer.render(this.game);

        // 播放落子音效
        this.playPlaceSound();

        // 如果游戏结束，播放胜利音效
        if (this.game.gameOver) {
          this.playWinSound();
        }
      }
    }
  }

  // 处理 Canvas 鼠标移动
  handleCanvasMouseMove(event) {
    if (this.game.gameOver) return;

    const boardPos = this.renderer.getBoardPosition(event.clientX, event.clientY);
    if (boardPos && this.game.grid[boardPos.y][boardPos.x] === null) {
      this.hoverPosition = boardPos;
      this.renderer.render(this.game);
      this.renderer.drawHoverEffect(boardPos.x, boardPos.y, this.game.currentPlayer);
    } else {
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
        event.preventDefault();
        this.handleRestart();
        break;
      case 'z':
      case 'Z':
        if (event.ctrlKey) {
          event.preventDefault();
          this.handleUndo();
        }
        break;
      case 'Escape':
        this.handleRestart();
        break;
    }
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
    // 简单的音效实现
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
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
  }

  // 播放胜利音效
  playWinSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // 胜利音效序列
    const frequencies = [523, 659, 784, 1047]; // C5, E5, G5, C6
    const now = audioContext.currentTime;

    oscillator.frequency.setValueAtTime(frequencies[0], now);
    oscillator.frequency.setValueAtTime(frequencies[1], now + 0.1);
    oscillator.frequency.setValueAtTime(frequencies[2], now + 0.2);
    oscillator.frequency.setValueAtTime(frequencies[3], now + 0.3);

    gainNode.gain.setValueAtTime(0.5, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    oscillator.start(now);
    oscillator.stop(now + 0.4);
  }

  // 播放重新开始音效
  playRestartSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
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
  }

  // 播放悔棋音效
  playUndoSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
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
  }

  // 销毁事件监听器
  destroy() {
    // 在实际应用中应该移除所有事件监听器
    // 这里简化处理
  }
}