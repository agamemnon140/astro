# Astro — Sol & Lua

Posições do Sol e da Lua, resumo do dia e exploração anual. Aplicação estática,
instalável, com cálculos locais e uma simulação didática da influência lunar nas marés.

## Funcionalidades

- **Resumo** — Próximo nascer/pôr do sol, luz restante, próxima golden hour da tarde,
  fase/iluminação e nascer/pôr da lua na data selecionada.
- **Agora** — Acompanha a hora do fuso selecionado a cada 30 segundos e ao voltar à aba.
  Alterar horário, calendário ou ano pausa esse acompanhamento; Agora o retoma.
- **Sol e Lua** — Direção e altitude no dia ou no ano. Data e horário são compartilhados
  entre as abas. O calendário aceita 1900–2100 e ajusta corretamente anos bissextos.
- **Fusos** — Identificadores IANA, com horário de verão automático para a data escolhida.
  Uma hora repetida usa a primeira ocorrência; uma hora inexistente avança pela mudança.
- **Locais** — Valinhos, São Paulo, Utrecht, busca por cidade, localização do dispositivo,
  coordenadas manuais e até 12 favoritos. Coordenadas manuais mantêm o fuso selecionado;
  a geolocalização usa o fuso do dispositivo. Confira-o nas configurações.
- **Continuidade** — Preferências ficam no navegador. Compartilhar gera um link com
  local, fuso, data, horário e visualização; abrir esse link entra no modo de exploração.
- **Acessibilidade** — Zoom permitido, controles de toque maiores, foco visível,
  diálogo operável por teclado e valores textuais associados aos gráficos.
- **PWA** — Após a primeira carga completa, cálculos e gráficos funcionam offline,
  inclusive ao abrir links com parâmetros. A busca por cidade exige internet.

## Marés e limites dos cálculos

A aba Marés é uma **simulação didática em unidades relativas**, não uma previsão de
altura em metros nem de horários de maré de uma praia/porto. A curva sintética usa
o trânsito lunar e uma amplitude diária de referência calculada ao meio-dia local.
Ela não possui estação costeira, constituintes harmônicos locais ou dados observados.

O índice de alinhamento varia como `(1 + cos(4π × fase)) / 2`: máximos na lua nova
e cheia, mínimos nos dois quartos. É um índice ilustrativo, não uma força medida.
O contador anual conta cruzamentos de nova/cheia, não dias acima de um limiar.
Referência: [NOAA — variações das marés](https://oceanservice.noaa.gov/education/tutorial_tides/tides06_variations.html).

SunCalc 1.9.0 permanece fixado em `vendor/`, com sua licença. Os gráficos diários
amostram posições a cada cinco minutos; os valores selecionados acompanham essa
amostragem. O nascer/pôr da lua usa busca de cruzamento de horizonte em intervalos
de cinco minutos com refinamento. Relevo e obstáculos locais não são modelados.
As datas de equinócios/solstícios são aproximações fixas, identificadas na interface.
Ausência de nascer/pôr do sol em regiões polares não é apresentada como horário inválido.

## Desenvolvimento e testes

Não há etapa de build nem dependências de produção a instalar.

```bash
npm run dev          # http://127.0.0.1:4187
npm test             # funções de calendário, fusos e índice lunar; Node 24
npm ci               # dependência de desenvolvimento para o teste de navegador
npm run test:browser # Chrome instalado, ou CHROME_PATH apontando ao executável
```

O teste de navegador cobre as seis visualizações, fusos diferentes do dispositivo,
ano bissexto, polos, preferências, busca com resposta simulada, modo Agora,
teclado, tema, larguras de tela e navegação offline. Capturas ficam em `artifacts/`.
A disponibilidade real do serviço de busca não faz parte do teste determinístico.

O cache de cálculos usa localização, fuso, ano e parâmetros da consulta, limitado a
1.200 entradas. As amostras anuais são reutilizadas no cálculo de máximos e na busca
de horários de altitude, evitando refazer a varredura a cada movimento do controle.
O teste verifica a redução de chamadas ao SunCalc em redesenhos anuais.

| Arquivo | Responsabilidade |
| --- | --- |
| `core.js` | Calendário, conversão de fuso, validação e índice lunar, sem DOM |
| `astronomy.js` | Consultas ao SunCalc, séries e cache |
| `charts.js` | Desenho em Canvas |
| `ui.js` | Resumo, controles, favoritos, busca e compartilhamento |
| `app.js` | Estado e composição das visualizações |
| `styles.css` | Layout e temas |
| `sw.js` | Cache versionado dos arquivos estáticos |

## Deploy no GitHub Pages

O repositório pode ser publicado diretamente pela raiz: **Settings → Pages →
Deploy from branch → main → / (root)**. Todos os caminhos de recursos são relativos.
`astro.html` continua abrindo a aplicação para preservar links antigos.

Ao publicar alterações nos arquivos estáticos, incremente `CACHE_NAME` em `sw.js`.
O worker instala o conjunto completo antes de ativar a versão nova. A ativação
remove somente caches com o prefixo de versão do Astro. Recursos ausentes nunca
recebem HTML como substituto. A nova interface é carregada na próxima abertura/reload.

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
- Busca de cidades: [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api),
  com dados do [GeoNames](https://www.geonames.org/). A consulta envia o nome digitado
  ao serviço somente quando o usuário aciona Buscar.

## Licença

MIT
