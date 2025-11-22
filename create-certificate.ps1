# Self-signed code signing certificate creation script
# Requires administrator privileges

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Creating self-signed code signing certificate..." -ForegroundColor Cyan

# Certificate information
$certSubject = "CN=ppop_promt Code Signing"
$certPath = "certificate.pfx"
$certPassword = "ppop_promt_cert_password_2025"  # Change to a strong password for production use

# Remove existing certificate if present
if (Test-Path $certPath) {
    Write-Host "Existing certificate file found. Removing..." -ForegroundColor Yellow
    Remove-Item $certPath -Force
}

try {
    # Create self-signed certificate
    Write-Host "Creating certificate..." -ForegroundColor Green
    
    $cert = New-SelfSignedCertificate `
        -Type CodeSigningCert `
        -Subject $certSubject `
        -KeyUsage DigitalSignature `
        -FriendlyName "ppop_promt Code Signing Certificate" `
        -CertStoreLocation "Cert:\CurrentUser\My" `
        -KeyExportPolicy Exportable `
        -KeySpec Signature `
        -KeyLength 2048 `
        -HashAlgorithm SHA256 `
        -NotAfter (Get-Date).AddYears(5)
    
    Write-Host "Certificate created successfully!" -ForegroundColor Green
    Write-Host "   Thumbprint: $($cert.Thumbprint)" -ForegroundColor Gray
    
    # Export certificate to PFX file
    Write-Host "Exporting certificate to PFX file..." -ForegroundColor Green
    
    $securePassword = ConvertTo-SecureString -String $certPassword -Force -AsPlainText
    
    Export-PfxCertificate `
        -Cert $cert `
        -FilePath $certPath `
        -Password $securePassword | Out-Null
    
    Write-Host "Certificate file created: $certPath" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Set win.certificateFile to 'certificate.pfx' in package.json" -ForegroundColor White
    Write-Host "   2. Set win.certificatePassword or use environment variable" -ForegroundColor White
    Write-Host "   3. Certificate password: $certPassword" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Security notes:" -ForegroundColor Red
    Write-Host "   - Add certificate.pfx to .gitignore" -ForegroundColor Yellow
    Write-Host "   - Keep certificate password secure" -ForegroundColor Yellow
    Write-Host "   - Use commercial certificate for production deployment" -ForegroundColor Yellow
    
} catch {
    Write-Host "Error occurred: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Solutions:" -ForegroundColor Cyan
    Write-Host "   1. Make sure PowerShell is running as administrator" -ForegroundColor White
    Write-Host "   2. Check if Windows Developer Mode is enabled" -ForegroundColor White
    exit 1
}

