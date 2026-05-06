// 主入口文件
import { GameBoard } from './board.js';
import { GameRenderer } from './render.js';
import { GameUI } from './ui.js';

class WZQGame {
  constructor() {
    this.init();
  }

  // 初始化游戏
  init() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }

    // 初始化游戏组件
    this.board = new GameBoard(15);
    this.renderer = new GameRenderer(canvas, 15);
    this.renderer.board = this.board; // 让 renderer 能访问 board（用于背景加载后重绘）
    this.ui = new GameUI(this.board, this.renderer);

    // 初始渲染
    this.renderer.render(this.board);
    this.ui.updateUI();

    // 从 LocalStorage 恢复背景
    this.renderer.loadFromStorage();

    // 响应式处理：窗口大小变化时重新设置 canvas 分辨率
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);

    console.log('五子棋游戏初始化完成');
  }

  // 处理窗口大小变化
  handleResize() {
    this.renderer.resize();
    this.renderer.render(this.board);
  }

  // 重新开始游戏
  restart() {
    this.board.reset();
    this.renderer.render(this.board);
    this.ui.updateUI();
  }

  // 获取游戏状态
  getGameState() {
    return this.board.getBoardState();
  }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
  window.wzqGame = new WZQGame();
});

// 导出给其他模块使用
export { WZQGame };
