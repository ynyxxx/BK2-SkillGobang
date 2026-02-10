# MCP服务器设置总结

## ✅ 已创建的文件

```
backend/
├── src/
│   ├── mcp/
│   │   ├── gobangMCP.ts                    # MCP服务器主文件 ⭐
│   │   ├── test-mcp.ts                     # 测试脚本
│   │   ├── mcp-config.example.json         # 生产环境配置
│   │   ├── mcp-config-dev.example.json     # 开发环境配置
│   │   ├── README.md                       # 详细文档
│   │   └── MCP-SETUP-SUMMARY.md           # 本文件
│   └── ai/
│       ├── gobangAI.ts                     # AI核心引擎
│       └── testGobangAI.ts                 # AI测试
├── package.json                            # 已更新：添加MCP依赖
└── tsconfig.json                           # 已更新：支持ES模块

scripts/
└── setup-mcp.md                            # 快速配置指南

shared/
├── types/
│   └── game.types.ts                       # 类型定义
└── constants/
    └── gameConstants.ts                    # 常量配置
```

## 🎯 MCP服务器提供的工具

1. **`gobang_recommend_move`** - 推荐最佳落子位置
   - 输入：我的棋子、对手棋子、禁手位置
   - 输出：推荐的坐标 (x, y)

2. **`gobang_evaluate_position`** - 评估特定位置得分
   - 输入：位置坐标 + 棋局状态
   - 输出：该位置的评分

3. **`gobang_get_top_moves`** - 获取前N个最佳位置
   - 输入：棋局状态 + 需要的数量
   - 输出：Top N候选位置列表

## 📦 需要安装的依赖

```bash
cd backend
npm install
```

这会安装：
- `@modelcontextprotocol/sdk@^0.5.0` - MCP SDK
- `tsx@^4.7.0` - TypeScript执行器
- 其他现有依赖

## 🧪 测试步骤

### 1. 测试AI核心功能
```bash
npm run test:ai
```
验证五子棋AI逻辑是否正常。

### 2. 测试MCP工具
```bash
npm run test:mcp
```
验证MCP工具能否正确调用AI。

### 3. 启动MCP服务器
```bash
npm run mcp
```
应该看到："五子棋AI MCP服务器已启动"

### 4. 使用MCP Inspector（可选）
```bash
npm run mcp:inspect
```
在浏览器中打开交互式测试界面。

## ⚙️ 配置Claude Desktop

### Windows配置路径
```
%APPDATA%\Claude\claude_desktop_config.json
```

### 配置内容（开发模式）
```json
{
  "mcpServers": {
    "gobang-ai": {
      "command": "npx",
      "args": [
        "-y",
        "tsx",
        "C:/Users/25219/Downloads/BK2-SkillGobang/backend/src/mcp/gobangMCP.ts"
      ]
    }
  }
}
```

**重要提示：**
1. 将路径替换为你的实际项目路径
2. 使用正斜杠 `/` 而非反斜杠 `\`
3. 保存后重启Claude Desktop

## 🎮 使用示例

配置完成后，在Claude Desktop中可以这样使用：

### 示例1：简单对局
```
我在下五子棋，现在的情况是：
- 我的黑子：(9,9), (10,9)
- 对手白子：(9,10)
请推荐我下一步应该下哪里？
```

### 示例2：带技能禁手
```
棋盘状态：
我的棋子：(9,9), (10,9), (11,9)
对手棋子：(9,10), (10,10)
禁止位置：(12,9), (8,9) （被技能封锁）

请帮我分析并推荐落子位置。
```

### 示例3：分析多个候选
```
请给我分析前5个最佳落子位置：
我：(9,9), (10,10), (11,11)
对手：(9,10), (10,9), (11,8), (12,7)
```

## 🔍 验证安装

在Claude Desktop中输入：
```
列出所有可用的工具
```

应该看到：
- ✅ `gobang_recommend_move`
- ✅ `gobang_evaluate_position`
- ✅ `gobang_get_top_moves`

## 📊 技术栈

- **协议**: Model Context Protocol (MCP)
- **传输**: stdio
- **运行时**: Node.js + tsx
- **语言**: TypeScript
- **AI引擎**: 自研五子棋AI（启发式搜索）

## 🐛 故障排查

### 问题：Claude看不到工具

**检查清单：**
- [ ] 配置文件路径正确
- [ ] JSON格式正确
- [ ] 已重启Claude Desktop
- [ ] 查看日志：`%APPDATA%\Claude\logs\`

### 问题：工具调用失败

**解决方法：**
1. 运行 `npm install` 确保依赖完整
2. 运行 `npm run test:mcp` 测试本地功能
3. 查看Claude Desktop日志文件

### 问题：找不到tsx

**解决方法：**
使用npx（推荐）或全局安装：
```bash
npm install -g tsx
```

## 📚 详细文档

- **MCP使用文档**: `backend/src/mcp/README.md`
- **AI引擎文档**: `backend/src/ai/README.md`
- **快速配置指南**: `scripts/setup-mcp.md`

## 🚀 下一步

1. **安装依赖**: `cd backend && npm install`
2. **测试功能**: `npm run test:mcp`
3. **配置Claude**: 编辑 `claude_desktop_config.json`
4. **重启应用**: 完全重启Claude Desktop
5. **开始使用**: 在对话中尝试使用五子棋AI！

## 💡 提示

- 开发时使用tsx直接运行TypeScript（开发模式）
- 生产环境可以先编译再运行（性能更好）
- 使用MCP Inspector进行调试和测试
- 查看Claude Desktop日志了解详细错误

## 🎉 完成！

现在你的五子棋AI已经可以通过MCP协议被Claude Desktop调用了！

试着在Claude中下一盘技能五子棋吧！🎮
