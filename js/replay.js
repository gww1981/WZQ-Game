// 棋谱录像管理
export class ReplayManager {
  constructor(boardSize = 15) {
    this.boardSize = boardSize;
    this.storageKey = 'wzq-last-replay';
    this._saveTimer = null;
    this.reset();
  }

  reset() {
    this.recording = false;
    this.speed = 1;
    this.moves = [];
    this.meta = {
      version: 1,
      boardSize: this.boardSize,
      startedAt: null,
      endedAt: null,
      winner: null,
    };
    this.replayTimer = null;
    this.replayIndex = 0;
  }

  startRecording() {
    this.recording = true;
    this.moves = [];
    this.meta.startedAt = Date.now();
    this.meta.endedAt = null;
    this.meta.winner = null;
  }

  stopRecording(winner = null) {
    this.recording = false;
    this.meta.endedAt = Date.now();
    this.meta.winner = winner;
    this._flushSave();
  }

  recordMove(x, y, player) {
    if (!this.recording) return;
    const t = this.meta.startedAt ? Date.now() - this.meta.startedAt : 0;
    this.moves.push({ i: this.moves.length + 1, x, y, player, t });
    this._scheduleSave();
  }

  undoLastMove() {
    if (this.moves.length > 0) {
      this.moves.pop();
      this._scheduleSave();
    }
  }

  setSpeed(speed) {
    this.speed = Math.max(0.5, Math.min(4, Number(speed) || 1));
  }

  getReplayData() {
    return {
      meta: { ...this.meta },
      moves: [...this.moves],
    };
  }

  loadReplayData(data) {
    if (!data || !Array.isArray(data.moves) || !data.meta) {
      throw new Error('录像格式无效');
    }
    if (data.meta.boardSize !== this.boardSize) {
      throw new Error('棋盘尺寸不匹配');
    }
    this.meta = { ...data.meta };
    this.moves = [...data.moves];
  }

  // 节流写入：500ms 内最多写一次
  _scheduleSave() {
    if (this._saveTimer) return;
    this._saveTimer = setTimeout(() => {
      this._flushSave();
      this._saveTimer = null;
    }, 500);
  }

  _flushSave() {
    if (this._saveTimer) {
      clearTimeout(this._saveTimer);
      this._saveTimer = null;
    }
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.getReplayData()));
    } catch (e) {
      // storage 不可用或配额超限，静默忽略
    }
  }

  loadLastReplay() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      const data = JSON.parse(raw);
      this.loadReplayData(data);
      return data;
    } catch (e) {
      return null;
    }
  }

  stopReplayLoop() {
    if (this.replayTimer) {
      clearTimeout(this.replayTimer);
      this.replayTimer = null;
    }
  }
}
