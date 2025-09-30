# H5 项目代码规范

## 代码风格规范

### HTML 规范
- 使用 HTML5 语义化标签
- 标签属性使用双引号
- 保持代码缩进（2个空格）
- 标签必须正确闭合
- 使用 UTF-8 编码

### CSS 规范
- 使用 BEM 命名规范
- 选择器命名采用小写字母和连字符
- 属性按功能分组排列
- 使用 flex/grid 布局
- 优先使用 CSS 变量

### JavaScript 规范
- 使用 ES6+ 语法
- 变量使用 const/let，避免 var
- 函数使用箭头函数
- 使用模板字符串
- 模块化组织代码

## 文件组织规范

### 目录结构
```
项目根目录/
├── index.html          # 主入口文件
├── css/
│   ├── reset.css       # 样式重置
│   ├── base.css        # 基础样式
│   └── components/     # 组件样式
├── js/
│   ├── utils/          # 工具函数
│   ├── modules/        # 功能模块
│   └── main.js         # 主入口文件
├── assets/
│   ├── images/         # 图片资源
│   ├── fonts/          # 字体文件
│   └── sounds/         # 音效文件
└── README.md           # 项目说明
```

### 命名规范
- 文件命名：小写字母，连字符分隔
- 类名：BEM 规范（block__element--modifier）
- 变量：camelCase
- 常量：UPPER_CASE

## 开发规范

### 性能优化
- 图片资源压缩
- CSS/JS 文件压缩
- 使用事件委托
- 避免频繁 DOM 操作
- 合理使用 Canvas

### 兼容性要求
- 支持现代浏览器（Chrome, Firefox, Safari, Edge）
- 移动端响应式适配
- 触摸事件支持
- 键盘导航支持

### 代码质量
- 函数单一职责原则
- 避免全局变量污染
- 错误处理机制
- 代码注释规范

## 五子棋项目特定规范

### 游戏状态管理
- 使用状态机管理游戏流程
- 棋盘状态使用二维数组
- 玩家状态使用枚举

### 事件处理
- 使用事件委托优化性能
- 合理使用节流防抖
- 事件监听器及时清理

### 渲染优化
- Canvas 分层渲染
- 避免全量重绘
- 使用 requestAnimationFrame

### 模块接口规范
```javascript
// 模块导出规范
class GameBoard {
  constructor(config) {}
  init() {}
  reset() {}
  placeStone(x, y, player) {}
  checkWin(x, y) {}
}

export default GameBoard;
```

## 测试规范
- 功能测试覆盖核心逻辑
- 边界条件测试
- 用户交互测试
- 性能测试

## 部署规范
- 静态资源压缩
- 缓存策略配置
- CDN 部署（可选）
- HTTPS 支持