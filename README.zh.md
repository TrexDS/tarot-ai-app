# 塔罗 AI 代理

这是一个轻量的本地网页应用，用于抽牌并通过 Volcano Engine Ark / DeepSeek API 生成塔罗解读。它的核心思路是：API Key 留在后端服务端，浏览器只访问同域接口，不直接拿到密钥。

这个项目适合本地开发，也适合部署到 Render 后公开分享给朋友使用。

## 功能特点

- 塔罗抽牌界面
- 同域 AI 接口：`/api/reading`
- 服务端处理 API Key
- 本地开发可用
- Render 部署可用
- 适合公开分享

## 项目结构

```bash
.
├── api.js
├── app.js
├── data.js
├── index.html
├── package.json
├── server.js
├── styles.css
├── .env.example
├── .gitignore
├── README.md
├── README.zh.md
└── .env
```

## 本地运行

1. 复制本地环境文件：

```bash
cp .env.example .env
```

2. 在 `.env` 中填入真实密钥：

```bash
ARK_API_KEY=your_volcengine_ark_key_here
PORT=8787
```

3. 安装依赖：

```bash
npm install
```

4. 启动应用：

```bash
npm start
```

5. 打开浏览器：

```text
http://localhost:8787
```

## 环境变量说明

程序会读取这些环境变量：

```bash
ARK_API_KEY=your_volcengine_ark_key_here
PORT=8787
```

请把密钥保存在服务器环境变量中，不要写进前端 JavaScript 或公开配置。

## 部署到 Render

### 1. 推送到 GitHub

```bash
git init
git add .
git commit -m "Deploy-ready tarot app"
git branch -M main
git remote add origin git@github.com:YOUR_GITHUB_USER/tarot-ai-proxy.git
git push -u origin main
```

如果你已经有仓库，就直接用现有远程地址即可。

### 2. 创建 Render Web Service

1. 打开 https://dashboard.render.com
2. 点击 New → Web Service
3. 连接你的 GitHub 仓库
4. 设置如下：

构建命令：

```bash
npm install
```

启动命令：

```bash
npm start
```

### 3. 在 Render 中添加环境变量

添加：

```bash
ARK_API_KEY=your_volcengine_ark_key_here
NODE_ENV=production
PORT=10000
```

### 4. 部署

点击 Deploy，服务启动成功后 Render 会给出一个公开 HTTPS 链接，例如：

```text
https://tarot-ai-proxy.onrender.com
```

## 安全说明

- API Key 只能保存在服务端环境变量中
- 不要提交 `.env` 到 Git
- 不要在前端代码里写密钥
- 这里采用后端 API 路由设计，因此浏览器不会看到密钥

## 适合公开分享的说明

这个应用已经适合做成公开网页。朋友打开 Render 生成的链接后，就能直接使用塔罗解读功能，而不需要你在本地打开终端手动输入 API Key。

## 许可证

这个项目适合个人使用和演示用途。如果你要更大范围发布，请补充你自己的许可证。

## 常见问题

### AI 接口请求失败

- 检查 `.env` 是否写入正确的 `ARK_API_KEY`
- 确认本地/云端服务已启动
- 检查 Render 环境变量是否正确

### 本地服务启动失败

- 先执行 `npm install`
- 确认 Node 版本为 18+（建议）
- 检查端口 `8787` 是否被占用

---

English version: [README.md](README.md)
