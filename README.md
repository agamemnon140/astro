# Astro — Sol & Lua

Rastreador de posição solar e lunar em tempo real, com bússola, altitude, fases da lua e influência nas marés.

## Funcionalidades

- **Sol · Hoje** — Azimute (bússola) e altitude ao longo do dia, com golden hour e crepúsculos
- **Sol · No ano** — Variação da posição solar ao longo do ano para um horário fixo
- **Lua · Hoje** — Posição lunar, fase visual e influência nas marés
- **Lua · No ano** — Variação lunar anual com gráfico de força de maré
- **3 localizações** — Valinhos, São Paulo e Utrecht
- **Sliders interativos** — Horário e dia do ano para explorar livremente
- **PWA** — Funciona offline, pode ser instalado como app no iOS e Android

## Deploy no GitHub Pages

```bash
# 1. Criar repositório no GitHub
gh repo create astro-tracker --public --source=. --remote=origin

# 2. Subir código
git init
git add .
git commit -m "initial commit"
git branch -M main
git push -u origin main
```

Depois no GitHub:

**Settings → Pages → Source: Deploy from branch → Branch: main → Folder: / (root) → Save**

O app fica disponível em:

```
https://SEU_USUARIO.github.io/astro-tracker/
```

## Instalar como app no iPhone

1. Abrir o link do GitHub Pages no **Safari**
2. Tocar no botão **Compartilhar** (quadrado com seta pra cima)
3. Selecionar **"Adicionar à Tela de Início"**
4. O app aparece como ícone na home, abre em tela cheia e funciona offline

## Stack

- HTML/CSS/JS puro — zero build steps
- [SunCalc](https://github.com/mourner/suncalc) para cálculos astronômicos
- Canvas 2D para gráficos
- Service Worker para cache offline
- Web App Manifest para instalação PWA

## Licença

MIT
