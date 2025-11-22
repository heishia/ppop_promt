# Git에서 이미 추적 중인 파일을 .gitignore에 맞춰 제거하는 스크립트
# 주의: 이 스크립트는 Git 캐시에서만 제거하며, 실제 파일은 삭제하지 않습니다.

Write-Host "Checking for tracked files that should be ignored..." -ForegroundColor Cyan
Write-Host ""

# .gitignore에 정의된 패턴들 중 이미 추적 중인 파일 찾기
$patterns = @(
    "*.log",
    "*.pfx",
    "*.p12",
    "*.cer",
    "*.crt",
    "*.key",
    "certificate.pfx",
    "certificate-thumbprint.txt",
    "dist/",
    "build/",
    "frontend/dist/",
    "frontend/build/",
    "backend/dist/",
    "backend/build/",
    "resources/",
    "node_modules/",
    "__pycache__/",
    "*.pyc",
    ".env",
    ".env.local",
    ".env.*.local"
)

$filesToRemove = @()

foreach ($pattern in $patterns) {
    $tracked = git ls-files $pattern 2>$null
    if ($tracked) {
        $filesToRemove += $tracked
    }
}

# 디렉토리 패턴 처리
$dirPatterns = @("dist", "build", "frontend/dist", "frontend/build", "backend/dist", "backend/build", "resources", "node_modules", "__pycache__")
foreach ($dir in $dirPatterns) {
    $tracked = git ls-files $dir 2>$null
    if ($tracked) {
        $filesToRemove += $tracked
    }
}

if ($filesToRemove.Count -eq 0) {
    Write-Host "No tracked files found that need to be removed." -ForegroundColor Green
    Write-Host "All files are already properly ignored." -ForegroundColor Green
    exit 0
}

Write-Host "Found $($filesToRemove.Count) tracked file(s) that should be ignored:" -ForegroundColor Yellow
foreach ($file in $filesToRemove) {
    Write-Host "  - $file" -ForegroundColor Gray
}
Write-Host ""

$confirm = Read-Host "Remove these files from Git tracking? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Removing files from Git cache (files will remain on disk)..." -ForegroundColor Green

foreach ($file in $filesToRemove) {
    git rm --cached -r $file 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Removed: $file" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Done! Files have been removed from Git tracking." -ForegroundColor Green
Write-Host "Next step: Commit the changes with 'git commit -m \"Remove ignored files from tracking\"'" -ForegroundColor Cyan

