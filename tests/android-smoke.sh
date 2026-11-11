#!/usr/bin/env bash
# Instala o APK no emulador, abre o app e confere no logcat que a UI carregou
# a partir dos assets locais (sem permissão de INTERNET) e que a ponte nativa existe.
set -euo pipefail
APK="$1"
PKG=io.github.souproxy.dojo
OUT="${2:-.}"
adb install -r "$APK"
adb shell dumpsys package "$PKG" | grep -q "android.permission.INTERNET" && { echo "INTERNET não deveria existir"; exit 1; } || true
adb logcat -c
adb shell am start -W -n "$PKG/.MainActivity"
for i in $(seq 1 30); do
  if adb logcat -d -s Dojo:I | grep -q "DOJO_READY"; then break; fi
  sleep 2
done
adb logcat -d -s Dojo:* | tee "$OUT/logcat-dojo.txt"
adb exec-out screencap -p > "$OUT/screenshot.png" || true
grep -q "DOJO_READY bridge=true days=5" "$OUT/logcat-dojo.txt" || { echo "UI não carregou ou ponte nativa ausente"; exit 1; }
if grep -q "DOJO_ERROR" "$OUT/logcat-dojo.txt"; then echo "Erro de JS no app"; exit 1; fi
# Botão voltar na tela inicial deve fechar o app sem crash
adb shell input keyevent KEYCODE_BACK
sleep 2
adb logcat -d -b crash | tee "$OUT/logcat-crash.txt"
if grep -q "$PKG" "$OUT/logcat-crash.txt"; then echo "Crash detectado"; exit 1; fi
echo "Smoke test Android OK"
