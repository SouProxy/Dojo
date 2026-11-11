# Dojo 🥋

App Android de treino, offline, para qualquer nível — do primeiro dia na academia ao avançado, em casa ou com halteres.

### Programas prontos (9)
| Programa | Dias | Nível | Onde |
| --- | --- | --- | --- |
| Full Body 3x | 3 | Iniciante | Academia |
| ABC | 3 (ou 6) | Iniciante/intermediário | Academia |
| Upper/Lower | 4 | Intermediário | Academia |
| ABCD | 4 | Intermediário | Academia |
| Push/Pull/Legs | 6 | Avançado | Academia |
| Toji Fushiguro (Anime Physique Files #005) | 5 | Intermediário | Academia |
| Em casa – peso corporal | 3 | Iniciante | Casa |
| Só halteres | 3 | Iniciante | Casa/academia |
| Condicionamento em circuito | 3 | Iniciante | Casa |

Um **questionário** (dias por semana, experiência, local e objetivo) recomenda o programa no primeiro uso.

### Recursos
- **23 vídeos reais em loop** (banco aberto wger, CC BY-SA 4.0, créditos no app e em [CREDITS.md](CREDITS.md)); demais exercícios com animação
- **Biblioteca com 65 exercícios** e **64 GIFs animados** com o músculo-alvo destacado, dicas de execução e segurança; busca e filtros por grupo muscular (13) e equipamento (13)
- **Monte seu treino**: edite qualquer programa ou crie do zero — adicione, remova e reordene exercícios, dias e formato (séries ou circuito)
- **Volume semanal por músculo**: o app soma as séries do seu plano e compara com a faixa de 10–20 séries/semana
- **Guia de treino** baseado em evidências: volume, frequência, divisões, reps/descanso, progressão, deload, aquecimento e segurança, com fontes
- **Timer de descanso automático** (bipe + vibração, −15 s / +15 s / pular), **cronômetro, regressivo e intervalos**
- **Progressão dupla automática**: fechou todas as séries no topo da faixa → sugere +2,5–5% de carga e já preenche
- **Progresso**: gráfico por exercício (1RM estimado, reps, tempo), recordes e histórico
- **Desafio do personagem**: barra fixa com carga, reteste a cada 4 semanas
- Backup em arquivo (exportar/importar), dados só no aparelho

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
  js/library.js                           biblioteca expandida, programas, guia e recomendação
tools/gifgen/                             gerador dos GIFs (Python + Pillow): rig lateral + frontal
tests/                                    testes unitários, E2E (Playwright) e smoke no emulador
```

## Desenvolvimento

```bash
npm test                                  # lógica (node --test)
npm run test:e2e                          # UI no Chromium
python3 tools/gifgen/generate.py          # regenera os GIFs
python3 tools/video/build.py              # baixa e converte os vídeos de tools/video/sources.json
./gradlew assembleDebug                   # APK (precisa do Android SDK)
```

Para testar a UI no navegador: `python3 -m http.server -d app/src/main/assets/www` e abra `http://localhost:8000`.

> Séries, repetições e descansos são sugestões num esquema de força + hipertrofia. Ajuste ao seu nível e
> procure orientação profissional se tiver lesões ou condições de saúde.
