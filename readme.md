# UIX Viewer

<div align="center">

![UIX Viewer](https://img.shields.io/badge/UIX-Viewer-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![Vite](https://img.shields.io/badge/Vite-5-646cff)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38bdf8)
![License](https://img.shields.io/badge/License-MIT-green)

一个现代化的 Android UI 层级结构在线解析预览工具，类似 UI Automator Viewer 的网页版本。

[在线体验](https://your-domain.pages.dev) | [问题反馈](https://github.com/your-username/uix-viewer/issues)

</div>

## ✨ 功能特性

### 🎯 核心功能

- **📂 多种加载方式**
  - 本地文件上传（UIX/XML + 截图）
  - URL 参数远程加载
  - 历史记录快速访问

- **🔍 强大的浏览功能**
  - 树形层级结构展示
  - 节点搜索与过滤
  - 截图可视化预览
  - 点击截图直接选择节点

- **📊 详细属性查看**
  - 完整的节点属性展示
  - 布尔属性可视化
  - 坐标和尺寸信息
  - 原始 XML 属性列表

- **🎨 用户体验优化**
  - 截图缩放控制
  - 节点高亮覆盖层
  - 历史记录管理
  - 响应式设计

## 🖼️ 界面预览

```
┌─────────────────────────────────────────────────────────┐
│  UIX 解析预览器         [历史] [上传UIX] [上传截图]      │
├──────────┬─────────────────────────┬────────────────────┤
│          │                         │                    │
│  树形    │      截图预览            │    节点属性        │
│  层级    │   (可点击选择节点)       │                    │
│  结构    │                         │  - 基本信息        │
│          │   [放大] [缩小] [重置]   │  - 状态属性        │
│  [搜索]  │                         │  - 所有属性        │
│          │                         │                    │
└──────────┴─────────────────────────┴────────────────────┘
```

## 🚀 快速开始

### 在线使用

访问 [https://your-domain.pages.dev](https://your-domain.pages.dev)

#### 方式 1: 本地上传
1. 点击"上传 UIX 文件"按钮，选择从设备导出的 XML 文件
2. 点击"上传截图"按钮，选择对应的截图
3. 在界面中浏览和分析 UI 层级

#### 方式 2: URL 参数加载
```
https://your-domain.pages.dev/?uix=<UIX文件地址>&img=<截图地址>
```

**示例：**
```
https://your-domain.pages.dev/?uix=https://example.com/ui.xml&img=https://example.com/screenshot.png
```

### 本地开发

#### 环境要求
- Node.js >= 16
- npm 或 yarn

#### 安装步骤

```bash
# 克隆项目
git clone https://github.com/your-username/uix-viewer.git
cd uix-viewer

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
```

#### 构建生产版本

```bash
# 构建
npm run build

# 预览构建结果
npm run preview
```

## 📱 获取 UIX 文件

### 使用 ADB 导出

```bash
# 1. 截取屏幕截图
adb shell screencap -p /sdcard/screenshot.png

# 2. 导出 UI 层级
adb shell uiautomator dump /sdcard/ui.xml

# 3. 拉取到本地
adb pull /sdcard/screenshot.png .
adb pull /sdcard/ui.xml .

# 4. 清理设备上的文件（可选）
adb shell rm /sdcard/screenshot.png
adb shell rm /sdcard/ui.xml
```

### 一键导出脚本

**Windows (save as `export-ui.bat`):**
```batch
@echo off
set timestamp=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set timestamp=%timestamp: =0%

echo Capturing screenshot...
adb shell screencap -p /sdcard/screenshot.png

echo Dumping UI hierarchy...
adb shell uiautomator dump /sdcard/ui.xml

echo Pulling files...
adb pull /sdcard/screenshot.png screenshot_%timestamp%.png
adb pull /sdcard/ui.xml ui_%timestamp%.xml

echo Cleaning up...
adb shell rm /sdcard/screenshot.png
adb shell rm /sdcard/ui.xml

echo Done! Files saved with timestamp: %timestamp%
pause
```

**Linux/Mac (save as `export-ui.sh`):**
```bash
#!/bin/bash

timestamp=$(date +%Y%m%d_%H%M%S)

echo "Capturing screenshot..."
adb shell screencap -p /sdcard/screenshot.png

echo "Dumping UI hierarchy..."
adb shell uiautomator dump /sdcard/ui.xml

echo "Pulling files..."
adb pull /sdcard/screenshot.png screenshot_${timestamp}.png
adb pull /sdcard/ui.xml ui_${timestamp}.xml

echo "Cleaning up..."
adb shell rm /sdcard/screenshot.png
adb shell rm /sdcard/ui.xml

echo "Done! Files saved with timestamp: ${timestamp}"
```

使用方法：
```bash
chmod +x export-ui.sh
./export-ui.sh
```

## 📝 使用技巧

### 1. 搜索节点
在左侧搜索框输入：
- 节点文本内容
- Resource ID
- Class 名称
- Content Description

### 2. 点击截图选择
直接点击截图中的任意位置，会自动选择该位置最小的包含节点

### 3. 缩放控制
- **放大**: 点击放大按钮或使用鼠标滚轮
- **缩小**: 点击缩小按钮
- **重置**: 点击重置按钮恢复 100% 缩放

### 4. 历史记录
- 自动保存最近 20 条访问记录
- 点击记录快速重新加载
- 支持删除单条或清空所有记录

### 5. 远程加载注意事项
- 确保远程文件支持 CORS 跨域访问
- 文件 URL 必须是可公开访问的
- 建议使用 HTTPS 协议

## ❓ 常见问题

<details>
<summary><b>Q: 为什么远程文件加载失败？</b></summary>

A: 可能的原因：
1. 文件 URL 不可访问
2. 服务器未配置 CORS 跨域
3. 网络连接问题

解决方案：
- 检查文件 URL 是否正确
- 在服务器上添加 CORS 响应头
- 尝试使用本地上传方式
</details>

<details>
<summary><b>Q: 如何配置 CORS？</b></summary>

A: 在你的文件服务器上添加响应头：
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET
```

对于常见服务器：
- **Nginx**: 在配置文件中添加 `add_header` 指令
- **Apache**: 在 `.htaccess` 中添加 `Header set` 指令
- **Cloudflare**: 使用 Transform Rules 添加响应头
</details>

<details>
<summary><b>Q: 支持哪些文件格式？</b></summary>

A: 
- **UIX 文件**: `.xml`, `.uix` (实际都是 XML 格式)
- **截图**: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`
</details>

<details>
<summary><b>Q: 历史记录存储在哪里？</b></summary>

A: 历史记录存储在浏览器的 localStorage 中，不会上传到服务器。清除浏览器数据会删除历史记录。
</details>

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！


## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [UI Automator](https://developer.android.com/training/testing/ui-automator) - Android 官方 UI 测试工具
- [React](https://reactjs.org/) - 用户界面框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [TailwindCSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [Lucide Icons](https://lucide.dev/) - 精美的图标库


---

<div align="center">
  Made with ❤️ by Your Name
  
  如果这个项目对你有帮助，请给一个 ⭐️
</div>
