# run-all-samsung-real.ps1
# macOS run-all-samsung-real.sh 의 Windows PowerShell 버전

$ErrorActionPreference = "Stop"

# 이 스크립트 기준으로 프로젝트 루트 결정
$ROOT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$BASE_DIR = "test-scripts\performance\samsung\real"

Set-Location $ROOT_DIR

Write-Host "=============================================="
Write-Host "[k6] Running all samsung/real scripts"
Write-Host "ROOT_DIR: $ROOT_DIR"
Write-Host "BASE_DIR: $BASE_DIR"
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "=============================================="

# samsung/real 하위의 모든 .js 파일을 정렬된 순서로 순차 실행 (login_helper.js 제외)
$scripts = Get-ChildItem -Path $BASE_DIR -Recurse -Filter "*.js" `
           | Where-Object { $_.Name -ne "login_helper.js" } `
           | Sort-Object FullName

foreach ($script in $scripts) {
    $relativePath = $script.FullName.Substring($ROOT_DIR.Length + 1)

    $resultDir = Join-Path (Split-Path $relativePath -Parent) "Result"
    if (-not [string]::IsNullOrEmpty($resultDir) -and -not (Test-Path $resultDir)) {
        New-Item -ItemType Directory -Path $resultDir | Out-Null
    }

    Write-Host "----------------------------------------------"
    Write-Host "Running k6 script: $relativePath"
    Write-Host "Start: $(Get-Date -AsUTC -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Host "----------------------------------------------"

    & "$ROOT_DIR\run.ps1" $relativePath

    Write-Host "Finished: $(Get-Date -AsUTC -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Host ""
}

Write-Host "=============================================="
Write-Host "[k6] All samsung/real scripts finished"
Write-Host "End Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "=============================================="