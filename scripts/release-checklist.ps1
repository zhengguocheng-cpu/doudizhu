param(
  [string]$Version
)

$ErrorActionPreference = "Stop"

Write-Host "=== 斗地主 发布 Checklist ===" -ForegroundColor Cyan
Write-Host "当前目录: $(Get-Location)" -ForegroundColor DarkGray

# 读取后端和前端版本号
$backendPkg = Get-Content "package.json" | ConvertFrom-Json
$frontendPkg = Get-Content "frontend-spa\package.json" | ConvertFrom-Json

$backendVersion = $backendPkg.version
$frontendVersion = $frontendPkg.version

if (-not $Version) {
  $Version = $backendVersion
}

Write-Host "后端版本 (package.json): $backendVersion" -ForegroundColor Yellow
Write-Host "前端版本 (frontend-spa/package.json): $frontendVersion" -ForegroundColor Yellow
Write-Host "本次目标发布版本: v$Version" -ForegroundColor Yellow

Write-Host ""
Write-Host "注意：每一步都会提示你按回车执行，输入 s 跳过，输入 q 中止流程。" -ForegroundColor DarkYellow

function Run-Step {
  param(
    [string]$Title
  )

  Write-Host ""
  Write-Host "==== $Title ==== " -ForegroundColor Cyan
  $input = Read-Host "按回车执行，输入 s 跳过，输入 q 中止整个流程"

  if ($input -eq 'q') {
    Write-Host "已中止发布流程。" -ForegroundColor Red
    exit 1
  }

  if ($input -eq 's') {
    Write-Host "已跳过: $Title" -ForegroundColor DarkYellow
    return $false
  }

  return $true
}

# 步骤 1：后端 TS 构建
if (Run-Step "步骤 1: 后端构建 (npm run build)") {
  npm run build
  if ($LASTEXITCODE -ne 0) {
    Write-Host "步骤 1 执行失败，退出码 $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
  }
}

# 步骤 2：前端构建
if (Run-Step "步骤 2: 前端构建 (cd frontend-spa && npm run build)") {
  Push-Location "frontend-spa"
  npm run build
  $code = $LASTEXITCODE
  Pop-Location
  if ($code -ne 0) {
    Write-Host "步骤 2 执行失败，退出码 $code" -ForegroundColor Red
    exit $code
  }
}

# 步骤 3：部署前端到服务器
if (Run-Step "步骤 3: 部署前端到服务器 (npm run deploy:frontend)") {
  npm run deploy:frontend
  if ($LASTEXITCODE -ne 0) {
    Write-Host "步骤 3 执行失败，退出码 $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
  }
}

# Git 相关步骤（根仓库）
$currentBranch = (git rev-parse --abbrev-ref HEAD).Trim()

if (Run-Step "步骤 4: 查看根仓库 Git 状态 (git status)") {
  git status
}

if (Run-Step "步骤 5: 提交当前更改 (git add . && git commit)") {
  $msg = Read-Host "请输入提交信息 (默认: chore(release): v$Version)"
  if (-not $msg) {
    $msg = "chore(release): v$Version"
  }
  git add .
  git commit -m $msg
}

if (Run-Step "步骤 6: 将当前分支合并到 main 并推送") {
  if (-not $currentBranch) {
    $currentBranch = (git rev-parse --abbrev-ref HEAD).Trim()
  }

  git checkout main
  git pull origin main
  if ($currentBranch -ne 'main') {
    git merge $currentBranch
  }
  git push origin main
}

if (Run-Step "步骤 7: 创建 release/v$Version 分支并推送") {
  $releaseBranch = "release/v$Version"
  git checkout -b $releaseBranch
  git push -u origin $releaseBranch
}

Write-Host "" 
Write-Host "✅ 发布 checklist 执行完毕。" -ForegroundColor Green
Write-Host "如需在 frontend-spa 子仓库中单独管理分支 (main / release/v$Version)，请进入 frontend-spa 目录后按需执行相应 Git 操作。" -ForegroundColor DarkGray
