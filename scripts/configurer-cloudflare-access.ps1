# Chroniques V0.8 - Cloudflare Access : preview + consentement avant changement.
$ErrorActionPreference='Stop'
Set-Location (Join-Path $PSScriptRoot '..')
Write-Host "=== CHRONIQUES : PROTECTION CLOUDFLARE ACCESS ===" -ForegroundColor Cyan
Write-Host "Ce script n'installe rien ; il cree une regle d'autorisation sur votre compte Cloudflare."
Write-Host "Le domaine doit deja etre configure dans CONFIGURER_URL_HTTPS.bat."
Write-Host "Access: Apps and Policies Write est requis pour le jeton API, limite a votre compte."
Write-Host "Acces aux jetons : https://dash.cloudflare.com/profile/api-tokens"
Write-Host "Ne saisissez jamais le jeton du TUNNEL : il faut un jeton API DISTINCT."
$env:CF_ACCOUNT_ID = (Read-Host 'Cloudflare Account ID (32 caracteres)').Trim()
$env:CF_ALLOWED_EMAILS = (Read-Host 'E-mails autorises (vous compris), separes par des virgules').Trim()
try {
  node scripts/cloudflare-access.js --preview
  if($LASTEXITCODE -ne 0){throw 'Verification locale echouee.'}
  Write-Host ""
  $confirm = Read-Host 'Tapez PROTEGER pour appliquer la regle sur Cloudflare'
  if($confirm -cne 'PROTEGER'){Write-Host 'Annule : aucune modification.';exit 0}
  $secret = Read-Host 'Jeton API Cloudflare (saisie masquee)' -AsSecureString
  $p=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
  try {$env:CF_API_TOKEN=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($p)}
  finally {[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($p)}
  node scripts/cloudflare-access.js --apply
  if($LASTEXITCODE -ne 0){throw 'Application Access non confirmee : verifier dans Cloudflare.'}
} catch {Write-Host "ERREUR : $_" -ForegroundColor Red; exit 1}
finally {
  Remove-Item Env:CF_API_TOKEN -ErrorAction SilentlyContinue
  Remove-Item Env:CF_ACCOUNT_ID -ErrorAction SilentlyContinue
  Remove-Item Env:CF_ALLOWED_EMAILS -ErrorAction SilentlyContinue
}
