# Dojo 🥋

App Android de treino, offline, com o plano **“Anime Physique Files #005 – Toji Fushiguro”**.

- **Treinos do Dia 1 ao Dia 5** com séries, repetições, carga e descanso de cada exercício
- **Timer de descanso automático**: começa quando você marca a série, com bipe e vibração no fim (−15 s / +15 s / pular)
- **Cronômetro, regressivo e intervalos** (ex.: tiro na esteira 20 s forte / 40 s leve × 6), prancha com contagem
- **Progressão automática**: fechou todas as séries no topo da faixa? O app sugere +2,5–5% de carga e já preenche
- **Circuito** (Dia 5) organizado por voltas
- **GIF animado de cada exercício** + dicas de execução e segurança
- **Progresso**: gráfico por exercício (1RM estimado, reps, tempo), recordes e histórico
- **Desafio do personagem**: barra fixa com carga, com lembrete de reteste a cada 4 semanas
- Plano editável, backup em arquivo (exportar/importar)

## Instalar o APK

1. Abra a aba **Actions** do repositório → workflow **Android APK** → última execução verde.
2. Baixe o artefato **dojo-apk** (zip) e extraia `dojo.apk` (ou `dojo-debug.apk` se ainda não configurou a chave).
3. No celular, permita “instalar apps desconhecidos” para o app que vai abrir o arquivo e instale.
4. Confira o hash: `sha256sum dojo.apk` deve bater com o `SHA256SUMS.txt`.

Ao criar uma tag `v*` (ex.: `v1.0.0`), o workflow publica o APK em **Releases**.

### Assinatura de release (recomendado)

Sem uma chave fixa, cada build de debug é assinado com uma chave diferente e o Android
recusa atualizar por cima — seria preciso desinstalar (perdendo os dados, então exporte o backup antes).
Crie a sua chave **uma vez**, localmente, e guarde-a com segurança:

```bash
keytool -genkeypair -v -keystore dojo-release.jks -alias dojo \
  -keyalg RSA -keysize 4096 -validity 10000
base64 -w0 dojo-release.jks > dojo-release.jks.b64
```

Em *Settings → Secrets and variables → Actions*, crie os segredos:

| Segredo | Valor |
| --- | --- |
| `DOJO_KEYSTORE_BASE64` | conteúdo de `dojo-release.jks.b64` |
| `DOJO_KEYSTORE_PASSWORD` | senha do keystore |
| `DOJO_KEY_ALIAS` | `dojo` |
| `DOJO_KEY_PASSWORD` | senha da chave |

Apague o `.b64` depois e **nunca** versione o `.jks` (o `.gitignore` já bloqueia).

## Segurança e privacidade

- **Sem permissão de internet.** Única permissão: vibração.
- Dados só no aparelho (`localStorage` do WebView); backup em nuvem desativado — o backup é o arquivo que você exporta.
- UI servida por `WebViewAssetLoader` (origem `https://appassets.androidplatform.net`), sem `file://`,
  com **Content-Security-Policy** restritiva; qualquer navegação/requisição externa é bloqueada.
- Ponte JS↔nativo via `addWebMessageListener` restrita à origem do app (não usa `addJavascriptInterface`).
- UI montada só com `textContent`/`createElement` (sem `innerHTML`) → sem XSS por dados importados.
- Backups importados são validados (estrutura, tipos, tamanhos) antes de serem aceitos.
- CI com permissões mínimas, validação do Gradle wrapper, chave de assinatura só em segredo e apagada após o build.

## Estrutura

```
app/src/main/java/.../MainActivity.java   casca nativa (WebView seguro, backup, vibração, tela ligada)
app/src/main/assets/www/                  app (HTML/CSS/JS puro) + gifs/
  js/data.js                              plano e biblioteca de exercícios
  js/logic.js                             progressão, estatísticas, validação (testado)
  js/app.js                               interface
tools/gifgen/                             gerador dos GIFs (Python + Pillow)
tests/                                    testes unitários, E2E (Playwright) e smoke no emulador
```

## Desenvolvimento

```bash
npm test                                  # lógica (node --test)
npm run test:e2e                          # UI no Chromium
python3 tools/gifgen/generate.py          # regenera os GIFs
./gradlew assembleDebug                   # APK (precisa do Android SDK)
```

Para testar a UI no navegador: `python3 -m http.server -d app/src/main/assets/www` e abra `http://localhost:8000`.

> Séries, repetições e descansos são sugestões num esquema de força + hipertrofia. Ajuste ao seu nível e
> procure orientação profissional se tiver lesões ou condições de saúde.
