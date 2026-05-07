// 用户界面控制模块
export class GameUI {
  constructor(game, renderer, replayManager = null) {
    this.game = game;
    this.renderer = renderer;
    this.replayManager = replayManager;
    this.canvas = renderer.canvas;
    this.hoverPosition = null;
    // 复用 AudioContext，避免被浏览器自动播放策略阻止
    this.audioContext = null;
    // 背景音乐相关
    this.backgroundAudio = null;
    this.currentMusicSrc = null;
    this.currentMusicType = 'none'; // 'none' | 'preset' | 'custom'
    this.volume = 0.5;
    // 回放状态
    this.isReplayMode = false;
    this.isRecording = false;
    this.replayPaused = false;
    this.replaySnapshot = null;
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
    const bgBtn = document.getElementById('bgBtn');

    if (restartBtn) {
      this.boundHandlers.handleRestart = this.handleRestart.bind(this);
      restartBtn.addEventListener('click', this.boundHandlers.handleRestart);
    }

    if (undoBtn) {
      this.boundHandlers.handleUndo = this.handleUndo.bind(this);
      undoBtn.addEventListener('click', this.boundHandlers.handleUndo);
    }

    if (bgBtn) {
      this.boundHandlers.handleBgBtn = this.showBackgroundSelector.bind(this);
      bgBtn.addEventListener('click', this.boundHandlers.handleBgBtn);
    }

    const musicBtn = document.getElementById('musicBtn');
    if (musicBtn) {
      this.boundHandlers.handleMusicBtn = this.showMusicSelector.bind(this);
      musicBtn.addEventListener('click', this.boundHandlers.handleMusicBtn);
    }

    const recordBtn = document.getElementById('recordBtn');
    const replayBtn = document.getElementById('replayBtn');
    const pauseReplayBtn = document.getElementById('pauseReplayBtn');
    const restartReplayBtn = document.getElementById('restartReplayBtn');
    const exportReplayBtn = document.getElementById('exportReplayBtn');
    const importReplayBtn = document.getElementById('importReplayBtn');
    const replaySpeed = document.getElementById('replaySpeed');
    const replayFileInput = document.getElementById('replayFileInput');

    if (recordBtn) {
      this.boundHandlers.handleRecordBtn = this.toggleRecording.bind(this);
      recordBtn.addEventListener('click', this.boundHandlers.handleRecordBtn);
    }
    if (replayBtn) {
      this.boundHandlers.handleReplayBtn = this.startReplay.bind(this);
      replayBtn.addEventListener('click', this.boundHandlers.handleReplayBtn);
    }
    if (pauseReplayBtn) {
      this.boundHandlers.handlePauseReplayBtn = this.toggleReplayPause.bind(this);
      pauseReplayBtn.addEventListener('click', this.boundHandlers.handlePauseReplayBtn);
    }
    if (restartReplayBtn) {
      this.boundHandlers.handleRestartReplayBtn = this.restartReplay.bind(this);
      restartReplayBtn.addEventListener('click', this.boundHandlers.handleRestartReplayBtn);
    }
    if (exportReplayBtn) {
      this.boundHandlers.handleExportReplayBtn = this.exportReplay.bind(this);
      exportReplayBtn.addEventListener('click', this.boundHandlers.handleExportReplayBtn);
    }
    if (importReplayBtn && replayFileInput) {
      this.boundHandlers.handleImportReplayBtn = () => replayFileInput.click();
      importReplayBtn.addEventListener('click', this.boundHandlers.handleImportReplayBtn);
      this.boundHandlers.handleReplayFileInput = this.importReplay.bind(this);
      replayFileInput.addEventListener('change', this.boundHandlers.handleReplayFileInput);
    }
    if (replaySpeed) {
      this.boundHandlers.handleReplaySpeed = (e) => {
        if (this.replayManager) this.replayManager.setSpeed(e.target.value);
      };
      replaySpeed.addEventListener('change', this.boundHandlers.handleReplaySpeed);
    }

    // 键盘事件
    this.boundHandlers.handleKeyDown = this.handleKeyDown.bind(this);
    document.addEventListener('keydown', this.boundHandlers.handleKeyDown);
  }

  // 处理 Canvas 点击
  handleCanvasClick(event) {
    if (this.game.gameOver) return;
    if (this.isReplayMode) {
      // 点击棋盘退出回放
      this._exitReplay();
      return;
    }

    const boardPos = this.renderer.getBoardPosition(event.clientX, event.clientY);
    if (boardPos) {
      this.tryPlaceStone(boardPos.x, boardPos.y);
    }
  }

  // 处理 Canvas 触摸开始
  handleCanvasTouchStart(event) {
    event.preventDefault();
    if (this.game.gameOver || this.isReplayMode) return;

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
    const playerBeforeMove = this.game.currentPlayer;
    const success = this.game.placeStone(x, y);
    if (success) {
      if (this.replayManager && this.isRecording && !this.isReplayMode) {
        this.replayManager.recordMove(x, y, playerBeforeMove);
      }
      this.updateUI();
      this.renderer.render(this.game);
      this.playPlaceSound();

      if (this.game.gameOver) {
        if (this.replayManager && this.isRecording) {
          this.replayManager.stopRecording(this.game.winner);
          this.isRecording = false;
          this.updateReplayButtons();
        }
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
    if (this.replayManager && this.isRecording) {
      this.replayManager.stopRecording(null);
      this.replayManager.startRecording();
    }
    this.updateUI();
    this.renderer.render(this.game);
    this.playRestartSound();
  }

  // 处理悔棋
  handleUndo() {
    if (this.game.moveHistory.length > 0 && !this.game.gameOver && !this.isReplayMode) {
      const success = this.game.undo();
      if (success) {
        if (this.replayManager && this.isRecording) {
          this.replayManager.undoLastMove();
        }
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
    this.updateReplayButtons();
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

  updateReplayButtons() {
    const recordBtn = document.getElementById('recordBtn');
    const replayBtn = document.getElementById('replayBtn');
    const pauseReplayBtn = document.getElementById('pauseReplayBtn');

    if (recordBtn) {
      recordBtn.textContent = this.isRecording ? '⏹' : '⏺';
      recordBtn.title = this.isRecording ? '停止录像' : '开始录像';
    }
    if (replayBtn) replayBtn.disabled = this.isReplayMode;
    if (pauseReplayBtn) pauseReplayBtn.disabled = !this.isReplayMode;
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
    const bgBtn = document.getElementById('bgBtn');

    if (restartBtn && this.boundHandlers.handleRestart) {
      restartBtn.removeEventListener('click', this.boundHandlers.handleRestart);
    }
    if (undoBtn && this.boundHandlers.handleUndo) {
      undoBtn.removeEventListener('click', this.boundHandlers.handleUndo);
    }
    if (bgBtn && this.boundHandlers.handleBgBtn) {
      bgBtn.removeEventListener('click', this.boundHandlers.handleBgBtn);
    }

    const musicBtn = document.getElementById('musicBtn');
    if (musicBtn && this.boundHandlers.handleMusicBtn) {
      musicBtn.removeEventListener('click', this.boundHandlers.handleMusicBtn);
    }

    // 停止并清理背景音乐
    if (this.backgroundAudio) {
      this.backgroundAudio.pause();
      this.backgroundAudio.src = '';
      this.backgroundAudio = null;
    }

    // 停止回放
    if (this.replayManager) {
      this.replayManager.stopReplayLoop();
    }
    this.isReplayMode = false;
    this.isRecording = false;

    // 移除键盘事件
    document.removeEventListener('keydown', this.boundHandlers.handleKeyDown);

    // 关闭 AudioContext
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.boundHandlers = {};
  }

  // 预设背景列表
  getPresetBackgrounds() {
    return [
      { id: 'default', name: '默认木色', file: null },
      { id: 'wood', name: '木纹', file: 'assets/backgrounds/preset-wood.jpg' },
      { id: 'green', name: '绿色毛毡', file: 'assets/backgrounds/preset-green.jpg' },
      { id: 'stone', name: '石头纹理', file: 'assets/backgrounds/preset-stone.jpg' },
    ];
  }

  // 显示背景选择器
  showBackgroundSelector() {
    // 避免重复打开
    const existing = document.getElementById('bgSelectorOverlay');
    if (existing) existing.remove();

    const presets = this.getPresetBackgrounds();
    const currentType = this.renderer.backgroundType;
    const currentSrc = this.renderer.backgroundSrc;

    const overlay = document.createElement('div');
    overlay.id = 'bgSelectorOverlay';
    overlay.className = 'bg-selector-overlay';

    let optionsHtml = presets.map(p => {
      const isActive = (p.id === 'default' && currentType === 'default') ||
        (p.file && currentSrc && currentSrc.endsWith(p.file.split('/').pop()));
      return `
        <div class="bg-option ${isActive ? 'active' : ''}" data-id="${p.id}" data-file="${p.file || ''}">
          ${p.id === 'default'
            ? '<div class="bg-option-preview" style="background:#deb887"></div>'
            : `<img class="bg-option-preview" src="${p.file}" alt="${p.name}">`}
          <span class="bg-option-name">${p.name}</span>
        </div>
      `;
    }).join('');

    overlay.innerHTML = `
      <div class="bg-selector">
        <div class="bg-selector-header">
          <span>选择背景</span>
          <button class="bg-close" id="bgCloseBtn">×</button>
        </div>
        <div class="bg-options">${optionsHtml}</div>
        <div class="bg-upload-area">
          <label class="btn btn-secondary">
            上传图片
            <input type="file" id="bgFileInput" accept=".jpg,.jpeg,.png" hidden>
          </label>
          <span class="bg-upload-hint">支持 JPG、PNG</span>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // 关闭按钮
    document.getElementById('bgCloseBtn').addEventListener('click', () => overlay.remove());

    // 点击遮罩关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    // 预设背景选择
    overlay.querySelectorAll('.bg-option').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.id;
        const file = el.dataset.file;
        if (id === 'default') {
          this.renderer.clearBackground();
        } else {
          this.renderer.setBackground(file, 'preset');
        }
        overlay.remove();
      });
    });

    // 自定义上传
    const fileInput = document.getElementById('bgFileInput');
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        this.renderer.setBackground(ev.target.result, 'custom');
        overlay.remove();
      };
      reader.readAsDataURL(file);
    });
  }

  // ===================== 背景音乐相关 =====================

  // 预设音乐列表
  getPresetMusics() {
    return [
      { id: 'none', name: '关闭音乐', icon: '🔇', file: null },
      { id: 'peaceful', name: '宁静', icon: '🌿', file: 'assets/music/preset-peaceful.mp3' },
      { id: 'classical', name: '古典', icon: '🎻', file: 'assets/music/preset-classical.mp3' },
      { id: 'nature', name: '自然', icon: '🌊', file: 'assets/music/preset-nature.mp3' },
    ];
  }

  // 播放背景音乐
  playMusic(src) {
    // 停止当前音乐
    if (this.backgroundAudio) {
      this.backgroundAudio.pause();
      this.backgroundAudio.src = '';
    }

    if (!src) {
      this.backgroundAudio = null;
      this.currentMusicSrc = null;
      this.currentMusicType = 'none';
      return;
    }

    this.backgroundAudio = new Audio();
    this.backgroundAudio.loop = true;
    this.backgroundAudio.volume = this.volume;
    this.backgroundAudio.src = src;

    // 用户交互后才能播放
    this.backgroundAudio.play().catch(err => {
      console.warn('音乐播放失败:', err);
    });

    this.currentMusicSrc = src;
  }

  // 停止背景音乐
  stopMusic() {
    if (this.backgroundAudio) {
      this.backgroundAudio.pause();
      this.backgroundAudio.src = '';
      this.backgroundAudio = null;
    }
    this.currentMusicSrc = null;
    this.currentMusicType = 'none';
  }

  // 设置音量
  setMusicVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.backgroundAudio) {
      this.backgroundAudio.volume = this.volume;
    }
    this.saveMusicToStorage();
  }

  // 显示音乐选择器
  showMusicSelector() {
    const existing = document.getElementById('musicSelectorOverlay');
    if (existing) existing.remove();

    const presets = this.getPresetMusics();
    const currentSrc = this.currentMusicSrc;

    const overlay = document.createElement('div');
    overlay.id = 'musicSelectorOverlay';
    overlay.className = 'music-selector-overlay';

    const selector = document.createElement('div');
    selector.className = 'music-selector';

    // Header
    const header = document.createElement('div');
    header.className = 'music-selector-header';
    const headerTitle = document.createElement('span');
    headerTitle.textContent = '选择音乐';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'music-close';
    closeBtn.textContent = '×';
    header.appendChild(headerTitle);
    header.appendChild(closeBtn);
    selector.appendChild(header);

    // Options
    const options = document.createElement('div');
    options.className = 'music-options';
    presets.forEach(p => {
      const isActive = (p.id === 'none' && this.currentMusicType === 'none') ||
        (p.file && currentSrc && currentSrc.endsWith(p.file.split('/').pop()));

      const option = document.createElement('div');
      option.className = 'music-option' + (isActive ? ' active' : '');
      option.dataset.id = p.id;
      option.dataset.file = p.file || '';

      const icon = document.createElement('div');
      icon.className = 'music-option-icon';
      icon.textContent = p.icon;
      option.appendChild(icon);

      const info = document.createElement('div');
      info.className = 'music-option-info';
      const name = document.createElement('div');
      name.className = 'music-option-name';
      name.textContent = p.name;
      info.appendChild(name);
      option.appendChild(info);

      options.appendChild(option);
    });
    selector.appendChild(options);

    // Volume control
    const volumeDiv = document.createElement('div');
    volumeDiv.className = 'music-volume';
    const volumeLabel = document.createElement('label');
    volumeLabel.textContent = '音量';
    const volumeSlider = document.createElement('input');
    volumeSlider.type = 'range';
    volumeSlider.min = '0';
    volumeSlider.max = '1';
    volumeSlider.step = '0.05';
    volumeSlider.value = String(this.volume);
    volumeSlider.addEventListener('input', (e) => {
      this.setMusicVolume(parseFloat(e.target.value));
    });
    volumeDiv.appendChild(volumeLabel);
    volumeDiv.appendChild(volumeSlider);
    selector.appendChild(volumeDiv);

    // Upload area
    const uploadArea = document.createElement('div');
    uploadArea.className = 'music-upload-area';
    const label = document.createElement('label');
    label.className = 'btn btn-secondary';
    label.textContent = '上传音乐';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.mp3,.wav,.ogg,audio/*';
    fileInput.hidden = true;
    label.appendChild(fileInput);
    const uploadHint = document.createElement('span');
    uploadHint.className = 'music-upload-hint';
    uploadHint.textContent = '支持 MP3、WAV、OGG';
    uploadArea.appendChild(label);
    uploadArea.appendChild(uploadHint);
    selector.appendChild(uploadArea);

    overlay.appendChild(selector);
    document.body.appendChild(overlay);

    // Events
    closeBtn.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    options.querySelectorAll('.music-option').forEach(el => {
      el.addEventListener('click', () => {
        const file = el.dataset.file;
        if (!file) {
          this.stopMusic();
        } else {
          this.playMusic(file);
          this.currentMusicType = 'preset';
        }
        this.saveMusicToStorage();
        overlay.remove();
      });
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_SIZE) {
        alert('音乐文件不能超过 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        this.playMusic(ev.target.result);
        this.currentMusicType = 'custom';
        this.saveMusicToStorage();
        overlay.remove();
      };
      reader.readAsDataURL(file);
    });
  }

  // LocalStorage 持久化
  saveMusicToStorage() {
    try {
      const data = {
        type: this.currentMusicType,
        src: this.currentMusicSrc,
        volume: this.volume
      };
      localStorage.setItem('wzq-music', JSON.stringify(data));
    } catch (e) {
      // storage 不可用
    }
  }

  // 从 LocalStorage 恢复音乐
  loadMusicFromStorage() {
    try {
      const raw = localStorage.getItem('wzq-music');
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.volume !== undefined) {
        this.volume = data.volume;
      }
      if (data.src && data.type) {
        this.currentMusicSrc = data.src;
        this.currentMusicType = data.type;
        this.playMusic(data.src);
      }
    } catch (e) {
      // storage 不可用或数据损坏
    }
  }

  // ===================== 录像回放相关 =====================

  // 切换录像状态
  toggleRecording() {
    if (!this.replayManager) return;
    if (this.isReplayMode) return;

    if (this.isRecording) {
      this.replayManager.stopRecording(null);
      this.isRecording = false;
    } else {
      this.game.reset();
      this.renderer.render(this.game);
      this.replayManager.startRecording();
      this.isRecording = true;
    }
    this.updateReplayButtons();
  }

  // 开始回放
  startReplay() {
    if (!this.replayManager) return;
    if (this.isReplayMode) return;

    const data = this.replayManager.loadLastReplay();
    if (!data || data.moves.length === 0) {
      alert('没有可回放的录像');
      return;
    }

    this.replaySnapshot = {
      grid: this.game.grid.map(row => [...row]),
      currentPlayer: this.game.currentPlayer,
      gameOver: this.game.gameOver,
      winner: this.game.winner,
      moveHistory: [...this.game.moveHistory],
    };

    this.game.reset();
    this.replayManager.replayIndex = 0;
    this.isReplayMode = true;
    this.replayPaused = false;
    this.updateReplayButtons();
    this.renderer.render(this.game);
    this._runReplayLoop();
  }

  _runReplayLoop() {
    if (!this.isReplayMode || this.replayPaused) return;

    const moves = this.replayManager.moves;
    const idx = this.replayManager.replayIndex;

    if (idx >= moves.length) {
      if (this.replayManager.meta.winner) {
        const winText = this.replayManager.meta.winner === 'black' ? '黑棋胜利！' : '白棋胜利！';
        const statusEl = document.querySelector('.game-status');
        if (statusEl) {
          statusEl.textContent = winText;
          statusEl.className = 'game-status game-status--win';
        }
      }
      this._exitReplay();
      return;
    }

    const move = moves[idx];
    this.game.placeStone(move.x, move.y);
    this.playPlaceSound();
    this.renderer.render(this.game);
    this.replayManager.replayIndex++;

    if (idx === 0 && this.currentMusicSrc && this.currentMusicType !== 'none') {
      this.playMusic(this.currentMusicSrc);
    }

    const nextMove = moves[idx + 1];
    let delay = 600;
    if (nextMove && move.t && nextMove.t) {
      delay = Math.min(3000, Math.max(200, (nextMove.t - move.t) / this.replayManager.speed));
    }
    delay = delay / this.replayManager.speed;

    this.replayManager.replayTimer = setTimeout(() => {
      this._runReplayLoop();
    }, delay);
  }

  _exitReplay() {
    this.replayManager.stopReplayLoop();
    // 恢复原始游戏状态
    if (this.replaySnapshot) {
      this.game.grid = this.replaySnapshot.grid.map(row => [...row]);
      this.game.currentPlayer = this.replaySnapshot.currentPlayer;
      this.game.gameOver = this.replaySnapshot.gameOver;
      this.game.winner = this.replaySnapshot.winner;
      this.game.moveHistory = [...this.replaySnapshot.moveHistory];
      this.renderer.render(this.game);
      this.updateUI();
      this.replaySnapshot = null;
    }
    this.isReplayMode = false;
    this.updateReplayButtons();
  }

  toggleReplayPause() {
    if (!this.isReplayMode) return;
    this.replayPaused = !this.replayPaused;
    if (!this.replayPaused) {
      this._runReplayLoop();
    } else {
      this.replayManager.stopReplayLoop();
    }
    const pauseBtn = document.getElementById('pauseReplayBtn');
    if (pauseBtn) pauseBtn.textContent = this.replayPaused ? '▶' : '⏸';
  }

  restartReplay() {
    if (!this.replayManager) return;
    this.replayManager.stopReplayLoop();
    this.game.reset();
    this.replayManager.replayIndex = 0;
    this.replayPaused = false;
    this.isReplayMode = true;
    this.updateReplayButtons();
    this.renderer.render(this.game);
    this._runReplayLoop();
  }

  exportReplay() {
    if (!this.replayManager) return;
    const data = this.replayManager.getReplayData();
    if (data.moves.length === 0) {
      alert('没有可导出的录像');
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.href = url;
    a.download = `wzq-replay-${ts}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importReplay(e) {
    if (!this.replayManager) return;
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        this.replayManager.loadReplayData(data);
        this.replayManager.saveLastReplay();
        e.target.value = '';
        this.startReplay();
      } catch (err) {
        alert('录像文件格式无效: ' + err.message);
      }
    };
    reader.readAsText(file);
  }
}
