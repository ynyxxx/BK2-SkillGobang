# 五子棋AI - MCP服务器

将五子棋AI决策引擎打包为MCP（Model Context Protocol）服务器，可供Claude Desktop等AI助手直接调用。

## 📋 功能列表

MCP服务器提供以下工具：

### 1. `gobang_recommend_move`
推荐最佳落子位置

**输入参数：**
```json
{
  "myPieces": [{"x": 9, "y": 9}, {"x": 10, "y": 9}],
  "opponentPieces": [{"x": 9, "y": 10}],
  "blockedPositions": [{"x": 11, "y": 9}],
  "boardSize": 19
}
```

**输出：**
```json
{
  "success": true,
  "recommendedMove": {"x": 8, "y": 9},
  "message": "推荐落子位置: (8, 9)"
}
```

### 2. `gobang_evaluate_position`
评估特定位置的得分

### 3. `gobang_get_top_moves`
获取前N个最佳落子位置

## 🚀 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

这会安装：
- `@modelcontextprotocol/sdk`: MCP SDK
- `tsx`: TypeScript执行器
- 其他依赖

### 2. 测试MCP服务器

```bash
npm run mcp
```

服务器会通过stdio与客户端通信。

### 3. 配置Claude Desktop

#### Windows配置路径：
```
%APPDATA%\Claude\claude_desktop_config.json
```

#### macOS/Linux配置路径：
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

#### 开发模式配置（推荐）：

编辑配置文件，添加以下内容：

```json
{
  "mcpServers": {
    "gobang-ai": {
      "command": "npx",
      "args": [
        "-y",
        "tsx",
        "C:/Users/25219/Downloads/BK2-SkillGobang/backend/src/mcp/gobangMCP.ts"
      ],
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

**注意：**
- 将路径替换为你的实际项目路径
- Windows路径使用正斜杠 `/` 而非反斜杠 `\`

#### 生产模式配置：

先编译项目：
```bash
npm run build
```

然后使用编译后的配置：
```json
{
  "mcpServers": {
    "gobang-ai": {
      "command": "node",
      "args": [
        "C:/Users/25219/Downloads/BK2-SkillGobang/backend/dist/mcp/gobangMCP.js"
      ]
    }
  }
}
```

### 4. 重启Claude Desktop

保存配置后，重启Claude Desktop应用。

### 5. 验证安装

在Claude Desktop中输入：

```
请列出可用的工具
```

你应该看到 `gobang_recommend_move` 等工具出现。

## 💡 使用示例

在Claude Desktop中，你可以这样使用：

### 示例1：基本落子推荐

```
我正在下五子棋，我的棋子在 (9,9) 和 (10,9)，
对手的棋子在 (9,10)，请推荐下一步落子位置。
```

Claude会自动调用 `gobang_recommend_move` 工具。

### 示例2：带禁手的场景

```
棋盘状态：
- 我的棋子：(9,9), (10,9), (11,9)
- 对手的棋子：(9,10), (10,10)
- 禁止位置：(12,9)（被技能封锁）

请推荐最佳落子。
```

### 示例3：获取多个候选位置

```
请分析当前棋局，给出前5个最佳落子位置：
我的棋子：(9,9), (10,10), (11,11)
对手的棋子：(9,10), (10,9), (11,8)
```

## 🔧 开发与调试

### 查看日志

MCP服务器通过stderr输出日志。在Claude Desktop中，可以查看日志：

**Windows:**
```
%APPDATA%\Claude\logs\
```

**macOS:**
```
~/Library/Logs/Claude/
```

### 手动测试MCP服务器

使用MCP Inspector工具：

```bash
npx @modelcontextprotocol/inspector npx tsx backend/src/mcp/gobangMCP.ts
```

这会打开一个Web界面，可以直接测试工具调用。

### 调试技巧

在 `gobangMCP.ts` 中添加日志：

```typescript
console.error('收到请求:', request.params);
console.error('返回结果:', result);
```

这些日志会输出到Claude Desktop的日志文件中。

## 📁 文件结构

```
backend/src/mcp/
├── gobangMCP.ts                    # MCP服务器主文件
├── mcp-config.example.json         # 生产环境配置示例
├── mcp-config-dev.example.json     # 开发环境配置示例
└── README.md                       # 本文档
```

## 🐛 常见问题

### Q: Claude Desktop找不到工具？

**A:** 检查：
1. 配置文件路径是否正确
2. 路径中使用正斜杠 `/`
3. 已重启Claude Desktop
4. 查看Claude Desktop日志是否有错误

### Q: 工具调用失败？

**A:** 检查：
1. 是否已安装依赖 (`npm install`)
2. TypeScript文件是否有语法错误
3. 查看日志文件了解详细错误信息

### Q: 如何更新工具？

**A:**
1. 修改 `gobangMCP.ts` 文件
2. 重启Claude Desktop
3. 开发模式会自动使用最新代码

### Q: Windows路径问题？

**A:** 在JSON配置中使用正斜杠：
- ✅ `C:/Users/...`
- ❌ `C:\Users\...`

## 🔗 相关资源

- [MCP官方文档](https://modelcontextprotocol.io/)
- [MCP SDK GitHub](https://github.com/modelcontextprotocol/typescript-sdk)
- [Claude Desktop](https://claude.ai/download)

## 📝 协议说明

### MCP工作原理

```
Claude Desktop <--stdio--> MCP Server <--> 五子棋AI
```

1. Claude Desktop通过stdio启动MCP服务器
2. 用户在Claude中提问时，Claude识别需要使用工具
3. Claude通过JSON-RPC调用MCP工具
4. MCP服务器执行AI逻辑并返回结果
5. Claude将结果整合到回复中

### 数据流示例

```
用户: "我的棋子在(9,9)，对手在(9,10)，推荐落子"
  ↓
Claude识别需要使用 gobang_recommend_move
  ↓
调用MCP工具，传入参数
  ↓
MCP服务器执行 GobangAI.recommendMove()
  ↓
返回结果 {"x": 8, "y": 9}
  ↓
Claude: "建议你在(8,9)落子，因为..."
```

## 🎯 后续改进

- [ ] 添加棋谱可视化
- [ ] 支持多步预测
- [ ] 集成LLM进行策略解释
- [ ] 添加难度级别参数
- [ ] 支持不同棋盘大小

## 👥 维护者

BK2 Team - Skill Gobang Project

有问题？欢迎提Issue！
