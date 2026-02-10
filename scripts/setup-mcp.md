# MCP服务器快速配置指南

## 第一步：安装依赖

```bash
cd backend
npm install
```

## 第二步：测试MCP服务器

在终端运行：
```bash
npm run mcp
```

如果看到 "五子棋AI MCP服务器已启动"，说明服务器正常工作。
按 `Ctrl+C` 停止服务器。

## 第三步：配置Claude Desktop

### Windows用户：

1. 打开文件资源管理器，在地址栏输入：
   ```
   %APPDATA%\Claude
   ```

2. 如果没有 `claude_desktop_config.json` 文件，创建一个

3. 编辑文件，添加以下内容（**替换路径为你的实际路径**）：

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

### macOS/Linux用户：

1. 打开终端，编辑配置文件：
   ```bash
   nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

2. 添加以下内容（**替换路径为你的实际路径**）：

```json
{
  "mcpServers": {
    "gobang-ai": {
      "command": "npx",
      "args": [
        "-y",
        "tsx",
        "/path/to/BK2-SkillGobang/backend/src/mcp/gobangMCP.ts"
      ]
    }
  }
}
```

## 第四步：重启Claude Desktop

完全退出并重新启动Claude Desktop应用。

## 第五步：验证安装

在Claude Desktop中输入：

```
请列出所有可用的工具
```

你应该看到类似输出：
- `gobang_recommend_move` - 推荐五子棋落子位置
- `gobang_evaluate_position` - 评估位置得分
- `gobang_get_top_moves` - 获取前N个最佳位置

## 测试示例

尝试以下对话：

```
我在下五子棋，棋盘状态如下：
- 我的棋子：(9,9), (10,9)
- 对手的棋子：(9,10)
请推荐我下一步应该下哪里？
```

Claude会自动调用你的MCP工具并返回推荐！

## 故障排查

### 问题1：Claude Desktop看不到工具

**解决方法：**
1. 确认配置文件路径正确
2. 确认JSON格式正确（可以用JSON验证器检查）
3. 确认已完全重启Claude Desktop
4. 查看日志：`%APPDATA%\Claude\logs\` (Windows)

### 问题2：工具调用失败

**解决方法：**
1. 在项目目录运行 `npm install` 确保依赖已安装
2. 手动测试：`npm run mcp` 看是否有错误
3. 检查Claude Desktop日志文件

### 问题3：找不到tsx命令

**解决方法：**
先全局安装tsx：
```bash
npm install -g tsx
```

或者使用npx（推荐，不需要全局安装）

## 高级配置

### 使用编译后的JS文件（更快）

1. 先编译项目：
   ```bash
   cd backend
   npm run build
   ```

2. 修改配置使用编译后的文件：
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

## 完成！

现在你可以在Claude Desktop中直接使用五子棋AI了！

有任何问题，查看 `backend/src/mcp/README.md` 获取详细文档。
