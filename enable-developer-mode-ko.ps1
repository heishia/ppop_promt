# Windows 개발자 모드 활성화 스크립트 (한글 버전)
# 관리자 권한 필요
# 
# 참고: PowerShell 5.1에서 한글 인코딩 문제가 발생할 수 있습니다.
#       이 경우 enable-developer-mode.ps1 (영어 버전)을 사용하세요.

# UTF-8 인코딩 강제 설정
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# PowerShell 5.1 호환성
if ($PSVersionTable.PSVersion.Major -lt 6) {
    try {
        $originalEncoding = [Console]::OutputEncoding
        chcp 65001 | Out-Null
        [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    } catch {
        Write-Warning "Failed to set UTF-8 encoding. Korean text may not display correctly."
        Write-Warning "Please use enable-developer-mode.ps1 (English version) instead."
    }
}

Write-Host "Windows 개발자 모드 활성화 중..." -ForegroundColor Cyan

# 개발자 모드 레지스트리 경로
$regPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock"
$regName = "AllowDevelopmentWithoutDevLicense"

try {
    # 레지스트리 키가 없으면 생성
    if (-not (Test-Path $regPath)) {
        New-Item -Path $regPath -Force | Out-Null
        Write-Host "레지스트리 키 생성 완료" -ForegroundColor Green
    }
    
    # 개발자 모드 활성화
    Set-ItemProperty -Path $regPath -Name $regName -Value 1 -Type DWord -Force
    
    Write-Host "[SUCCESS] 개발자 모드가 활성화되었습니다!" -ForegroundColor Green
    Write-Host ""
    Write-Host "참고: 변경사항 적용을 위해 컴퓨터를 재시작하는 것을 권장합니다." -ForegroundColor Yellow
    Write-Host "      또는 PowerShell을 다시 시작한 후 빌드를 시도해보세요." -ForegroundColor Yellow
    
} catch {
    Write-Host "[ERROR] 오류 발생: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "수동 활성화 방법:" -ForegroundColor Cyan
    Write-Host "1. 설정 > 업데이트 및 보안 > 개발자용" -ForegroundColor White
    Write-Host "2. '개발자 모드' 토글을 켜기" -ForegroundColor White
    exit 1
}

