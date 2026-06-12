# 步步为营 Online

一个零依赖的 Quoridor / 步步为营网页联机原型。

## 运行

```powershell
& "C:\Users\zuo chenghua\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" .\server.js
```

然后打开：

```text
http://localhost:4173
```

复制页面右上角房间链接给另一位玩家。前两名进入房间的人自动成为玩家，后续进入者观战。

## 已实现

- 9x9 棋盘、双方各 10 面墙
- 房间链接联机同步
- 移动、跳跃、斜走
- 横墙 / 竖墙放置
- 防止重叠、交叉和完全封死路线
- 胜负判定与重开
