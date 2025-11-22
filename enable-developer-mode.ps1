# Windows Developer Mode Activation Script
# Requires administrator privileges

# Force UTF-8 encoding (for PowerShell 5.1 compatibility)
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
if ($PSVersionTable.PSVersion.Major -lt 6) {
    # PowerShell 5.1: Set console code page to UTF-8
    $null = [Console]::OutputEncoding
    try {
        chcp 65001 | Out-Null
    } catch {}
}

Write-Host "Activating Windows Developer Mode..." -ForegroundColor Cyan

# 개발자 모드 레지스트리 경로
$regPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock"
$regName = "AllowDevelopmentWithoutDevLicense"

try {
    # Create registry key if it doesn't exist
    if (-not (Test-Path $regPath)) {
        New-Item -Path $regPath -Force | Out-Null
        Write-Host "Registry key created successfully" -ForegroundColor Green
    }
    
    # Activate Developer Mode
    Set-ItemProperty -Path $regPath -Name $regName -Value 1 -Type DWord -Force
    
    Write-Host "[SUCCESS] Developer Mode has been activated!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Note: It is recommended to restart your computer for changes to take effect." -ForegroundColor Yellow
    Write-Host "      Or restart PowerShell and try building again." -ForegroundColor Yellow
    
} catch {
    Write-Host "[ERROR] An error occurred: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual activation method:" -ForegroundColor Cyan
    Write-Host "1. Settings > Update & Security > For developers" -ForegroundColor White
    Write-Host "2. Turn on 'Developer Mode' toggle" -ForegroundColor White
    exit 1
}

