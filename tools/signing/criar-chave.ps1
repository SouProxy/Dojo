# Cria a chave de assinatura do Dojo UMA VEZ (Windows PowerShell; precisa do Java/keytool no PATH).
# Gera dojo-release.jks e mostra os 4 valores para os segredos do GitHub. Nada é enviado para lugar nenhum.
param([string]$Out = "dojo-release.jks")
if (Test-Path $Out) { Write-Error "Já existe $Out — não sobrescrevo."; exit 1 }
if (-not (Get-Command keytool -ErrorAction SilentlyContinue)) { Write-Error "Instale um JDK (keytool) primeiro."; exit 1 }
$bytes = New-Object byte[] 24; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$pass = ([Convert]::ToBase64String($bytes) -replace '[/+=]', '').Substring(0, 28)
keytool -genkeypair -keystore $Out -alias dojo -keyalg RSA -keysize 4096 -validity 10000 -storepass $pass -keypass $pass -dname "CN=Dojo" | Out-Null
[Convert]::ToBase64String([IO.File]::ReadAllBytes((Resolve-Path $Out))) | Set-Content -NoNewline "$Out.b64"
Write-Host ""
Write-Host "Chave criada: $Out (guarde com cuidado; sem ela não dá para atualizar o app)"
Write-Host "Crie em GitHub > Settings > Secrets and variables > Actions:"
Write-Host "  DOJO_KEYSTORE_BASE64   = conteúdo do arquivo $Out.b64"
Write-Host "  DOJO_KEYSTORE_PASSWORD = $pass"
Write-Host "  DOJO_KEY_ALIAS         = dojo"
Write-Host "  DOJO_KEY_PASSWORD      = $pass"
Write-Host "Depois apague $Out.b64 e feche o terminal."
