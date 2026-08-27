@echo off
chcp 65001 >nul
title 推送更新到 GitHub
cd /d %~dp0

rem 检查远程仓库是否已配置
git remote | findstr . >nul 2>&1
if errorlevel 1 (
  echo [错误] 尚未配置远程仓库！
  echo 请先执行：git remote add origin https://github.com/COMBOM233/my-cloudmusic.git
  pause
  exit /b 1
)

rem 检查是否有改动
git status --short | findstr . >nul 2>&1
if errorlevel 1 (
  echo 本地没有需要提交的改动。
  pause
  exit /b 0
)

set /p MSG=请输入本次提交说明： 
if "%MSG%"=="" set MSG=更新

git add -A
git commit -m "%MSG%"
echo.
echo 正在推送...
git push origin main
if errorlevel 1 (
  echo.
  echo [提示] 推送失败，可能原因：
  echo   1. 未登录 GitHub（HTTPS 需 Personal Access Token 作为密码）
  echo   2. 远程有更新，可先执行 git pull --rebase 再重试
) else (
  echo.
  echo 推送成功！GitHub Actions 会自动重新构建前端。
)
pause
