#!/usr/bin/env bash
# Cria a chave de assinatura do Dojo UMA VEZ (Linux/macOS/WSL; precisa do Java/keytool).
# Gera: dojo-release.jks (guarde com cuidado) e mostra os 4 valores para os segredos do GitHub.
# Nada é enviado para lugar nenhum por este script.
set -euo pipefail
OUT="${1:-dojo-release.jks}"
[ -e "$OUT" ] && { echo "Já existe $OUT — não sobrescrevo. Apague ou passe outro nome."; exit 1; }
command -v keytool >/dev/null || { echo "Instale um JDK (keytool) primeiro."; exit 1; }
PASS="$(openssl rand -base64 30 | tr -d '/+=' | cut -c1-32)"
umask 077
keytool -genkeypair -keystore "$OUT" -alias dojo -keyalg RSA -keysize 4096 -validity 10000 \
  -storepass "$PASS" -keypass "$PASS" -dname "CN=Dojo" >/dev/null
echo
echo "Chave criada: $OUT  (guarde num gerenciador de senhas/backup seguro; sem ela não dá para atualizar o app)"
echo
echo "Crie estes 4 segredos em GitHub → Settings → Secrets and variables → Actions → New repository secret:"
echo "  DOJO_KEYSTORE_BASE64 = (conteúdo do arquivo $OUT.b64, gerado agora)"
base64 < "$OUT" | tr -d '\n' > "$OUT.b64"
echo "  DOJO_KEYSTORE_PASSWORD = $PASS"
echo "  DOJO_KEY_ALIAS = dojo"
echo "  DOJO_KEY_PASSWORD = $PASS"
echo
echo "Depois de colar, apague $OUT.b64 e limpe o terminal (a senha aparece acima)."
