/* =========================================================
   script.js — o "cérebro" do site
   Cada bloco é marcado com um comentário em português.
   ========================================================= */

/* ---------- 0. PREPARAÇÃO ---------- */
// avisa o CSS que o JavaScript está funcionando (ativa o efeito reveal)
document.documentElement.classList.add("js");

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const reduzir = matchMedia("(prefers-reduced-motion: reduce)").matches;
const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));
const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ---------- 1. REALCE DE SINTAXE (feito à mão, sem biblioteca) ----------
   Cada linguagem tem uma lista de regras: [padrão, classe de cor].
   O primeiro padrão que combinar naquele ponto do texto vence. */
const REGRAS = {
  html: [
    ["<!--[\\s\\S]*?-->", "comment"],
    ["<\\/?[\\w!-]+", "tag"],
    ["\\s[\\w-]+(?==)", "attr"],
    ['"[^"]*"', "string"],
    ["\\/?>", "bracket"],
  ],
  css: [
    ["\\/\\*[\\s\\S]*?\\*\\/", "comment"],
    ["[^{}\\n;]+(?=\\s*\\{)", "selector"],
    ["[\\w-]+(?=\\s*:)", "prop"],
    ["#[0-9a-fA-F]{3,8}\\b|-?\\d+(?:\\.\\d+)?(?:px|rem|em|s|%|vh|deg)?", "value"],
  ],
  js: [
    ["\\/\\/[^\\n]*", "comment"],
    ["\"[^\"\\n]*\"|'[^'\\n]*'|`[^`]*`", "string"],
    ["\\b(?:const|let|var|function|return|if|else|for|while|new|true|false|null|class|of|in)\\b", "keyword"],
    ["\\b\\d+(?:\\.\\d+)?\\b", "number"],
    ["\\b[A-Za-z_$][\\w$]*(?=\\()", "func"],
  ],
  py: [
    ["#[^\\n]*", "comment"],
    ["\"[^\"\\n]*\"|'[^'\\n]*'", "string"],
    ["\\b(?:for|in|range|def|if|else|return|import|True|False)\\b", "keyword"],
    ["\\b\\d+\\b", "number"],
    ["\\b[A-Za-z_]\\w*(?=\\()", "func"],
  ],
  sh: [
    ["#[^\\n]*", "comment"],
    ["\"[^\"\\n]*\"", "string"],
    ["\\bgit\\b", "keyword"],
    ["\\b(?:add|commit|push|init|status|clone)\\b", "func"],
  ],
  sql: [
    ["\\b(?:SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|DELETE|AND|OR)\\b", "keyword"],
    ["'[^']*'", "string"],
    ["\\b\\d+\\b", "number"],
  ],
};
REGRAS.md = []; REGRAS.gitignore = [];

// transforma texto puro em HTML com <span class="tk-...">
function realcar(codigo, lang) {
  const regras = REGRAS[lang];
  if (!regras || !regras.length) return esc(codigo);
  const re = new RegExp(regras.map((r) => "(" + r[0] + ")").join("|"), "g");
  let saida = "", fim = 0, m;
  while ((m = re.exec(codigo))) {
    if (m[0] === "") { re.lastIndex++; continue; }
    saida += esc(codigo.slice(fim, m.index));
    const qual = m.slice(1).findIndex((g) => g !== undefined);
    saida += `<span class="tk-${regras[qual][1]}">${esc(m[0])}</span>`;
    fim = re.lastIndex;
  }
  return saida + esc(codigo.slice(fim));
}

/* ---------- 2. CONTADOR ANIMADO ----------
   Esta função aparece na aba "JS" do site: o código mostrado é ESTE! */
function animarContador(el, alvo, duracao = 1500) {
  // Anima o número de 0 até o alvo
  const inicio = performance.now();
  function passo(agora) {
    const t = Math.min((agora - inicio) / duracao, 1);
    el.textContent = Math.round(alvo * t);
    if (t < 1) requestAnimationFrame(passo);
  }
  requestAnimationFrame(passo);
}

/* ---------- 3. TRECHOS REAIS NA ABA "COMO FOI FEITO" ---------- */
(function trechosReais() {
  // HTML: copia o primeiro cartão do curso, direto da página
  const cartao = $("#curso .cartao").cloneNode(true);
  cartao.classList.remove("visivel");
  const linhas = cartao.outerHTML.split("\n");
  const recuos = linhas.slice(1).filter((l) => l.trim()).map((l) => l.match(/^\s*/)[0].length);
  const menor = recuos.length ? Math.min(...recuos) : 0;
  $("#html-real").textContent = linhas.map((l, i) => (i ? l.slice(menor) : l)).join("\n");
  // JS: mostra o texto da função animarContador
  $("#js-real").textContent = animarContador.toString();
  // realça todos os blocos de código marcados com data-lang
  $$("code[data-lang]").forEach((c) => { c.innerHTML = realcar(c.textContent, c.dataset.lang); });
})();

/* ---------- 4. REVEAL AO ROLAR (IntersectionObserver) ---------- */
const obsReveal = new IntersectionObserver((entradas) => {
  entradas.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("visivel"); obsReveal.unobserve(e.target); }
  });
}, { threshold: 0.15 });
$$(".reveal").forEach((el) => obsReveal.observe(el));

/* ---------- 5. CONTADORES: começam quando aparecem na tela ---------- */
const obsContador = new IntersectionObserver((entradas) => {
  entradas.forEach((e) => {
    if (!e.isIntersecting) return;
    const alvo = +e.target.dataset.alvo;
    if (reduzir) e.target.textContent = alvo; else animarContador(e.target, alvo);
    obsContador.unobserve(e.target);
  });
}, { threshold: 0.6 });
$$(".contador strong").forEach((el) => obsContador.observe(el));

/* ---------- 6. DIGITAÇÃO NO HERO ---------- */
(function digitacao() {
  const alvo = $("#digitando");
  const palavras = ["sites", "aplicativos", "jogos", "o seu futuro"];
  if (reduzir) return; // sem movimento: deixa a primeira palavra parada
  let p = 0, c = 0, apagando = false;
  function ciclo() {
    const palavra = palavras[p];
    c += apagando ? -1 : 1;
    alvo.textContent = palavra.slice(0, c);
    let espera = apagando ? 45 : 90;
    if (!apagando && c === palavra.length) { apagando = true; espera = 1400; }
    else if (apagando && c === 0) { apagando = false; p = (p + 1) % palavras.length; espera = 400; }
    setTimeout(ciclo, espera);
  }
  alvo.textContent = ""; ciclo();
})();

/* ---------- 7. ROLAGEM: progresso, menu ativo e indicador "3/9" ---------- */
const secoes = $$("[data-secao]");
const links = $$("#menu a");
let atual = 0, ticking = false;
function aoRolar() {
  const max = document.documentElement.scrollHeight - innerHeight;
  $("#progresso").style.setProperty("--p", max > 0 ? scrollY / max : 0);
  let novo = 0;
  secoes.forEach((s, i) => { if (s.getBoundingClientRect().top <= innerHeight * 0.4) novo = i; });
  // chegou ao fim da página? marca a última seção
  if (max > 0 && scrollY >= max - 4) novo = secoes.length - 1;
  if (novo !== atual || !links.some((l) => l.classList.contains("ativo"))) {
    atual = novo;
    links.forEach((l, i) => {
      l.classList.toggle("ativo", i === atual);
      if (i === atual) l.setAttribute("aria-current", "true"); else l.removeAttribute("aria-current");
    });
    const menu = $("#menu");
    menu.scrollTo({ left: links[atual].offsetLeft - menu.clientWidth / 2, behavior: "auto" });
    $("#indicador").textContent = `${atual + 1}/${secoes.length}`;
  }
  ticking = false;
}
addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(aoRolar); } }, { passive: true });
addEventListener("resize", aoRolar);
aoRolar();

/* ---------- 8. CARTÕES 3D QUE VIRAM ---------- */
$$(".flip").forEach((card) => {
  const virar = () => {
    const virado = card.classList.toggle("virado");
    card.setAttribute("aria-pressed", virado);
  };
  card.addEventListener("click", virar);
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); virar(); }
  });
});

/* ---------- 9. LABORATÓRIO AO VIVO ---------- */
const EXEMPLOS = {
  botao: {
    html: '<button id="b">Clique em mim</button>',
    css: "button {\n  font-size: 1.4rem;\n  padding: .8rem 1.6rem;\n  border: 0;\n  border-radius: 12px;\n  background: #17803a;\n  color: white;\n  cursor: pointer;\n}",
    js: "const b = document.getElementById('b');\nconst cores = ['#17803a', '#1f4e9c', '#cf3a22', '#f9b812'];\nlet i = 0;\nb.addEventListener('click', () => {\n  i = (i + 1) % cores.length;\n  b.style.background = cores[i];\n});",
  },
  contador: {
    html: '<h1 id="n">0</h1>\n<button id="mais">+1</button>',
    css: "h1 { font-size: 4rem; margin: 0; color: #0f6b2e; }\nbutton { font-size: 1.2rem; padding: .6rem 1.4rem; border-radius: 10px; border: 0; background: #17803a; color: #fff; cursor: pointer; }",
    js: "let total = 0;\ndocument.getElementById('mais').onclick = () => {\n  total++;\n  document.getElementById('n').textContent = total;\n};",
  },
  cartao: {
    html: '<div class="cartao">Olá, 9º ano! 👋</div>',
    css: ".cartao {\n  padding: 2rem 3rem;\n  border-radius: 20px;\n  background: linear-gradient(135deg, #0f6b2e, #2e9b3f);\n  color: white;\n  font-size: 1.5rem;\n  animation: balancar 2s ease-in-out infinite;\n}\n@keyframes balancar {\n  0%, 100% { transform: rotate(-4deg); }\n  50% { transform: rotate(4deg) scale(1.08); }\n}",
    js: "// Este exemplo não precisa de JavaScript.\n// Tente mudar a duração (2s) no CSS!",
  },
};
const lab = { html: $("#lab-html"), css: $("#lab-css"), js: $("#lab-js"), iframe: $("#lab-iframe") };
let exemploAtual = "botao", tLab;
function renderLab() {
  // junta HTML + CSS + JS em um documento e entrega ao iframe
  lab.iframe.srcdoc = "<!doctype html><meta charset='utf-8'><style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:90vh;margin:0;text-align:center}</style>" +
    "<style>" + lab.css.value + "</style>" + lab.html.value + "<script>" + lab.js.value + "<\/script>";
}
function carregarExemplo(nome) {
  exemploAtual = nome;
  const ex = EXEMPLOS[nome];
  lab.html.value = ex.html; lab.css.value = ex.css; lab.js.value = ex.js;
  renderLab();
}
["html", "css", "js"].forEach((k) => lab[k].addEventListener("input", () => {
  clearTimeout(tLab); tLab = setTimeout(renderLab, 250); // espera 0,25s depois de digitar
}));
$$("[data-exemplo]").forEach((b) => b.addEventListener("click", () => carregarExemplo(b.dataset.exemplo)));
$("#lab-restaurar").addEventListener("click", () => carregarExemplo(exemploAtual));
carregarExemplo("botao");

/* ---------- 10. VS CODE SIMULADO ---------- */
const ARQUIVOS = {
  "index.html": { lang: "html", code: '<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n  <meta charset="UTF-8">\n  <title>Meu site</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1 id="titulo">Olá, mundo!</h1>\n  <button id="botao">Mudar cor</button>\n  <script src="script.js"><\/script>\n</body>\n</html>' },
  "style.css": { lang: "css", code: ":root {\n  --cor: #17803a;\n}\nbody {\n  font-family: system-ui;\n  text-align: center;\n  padding: 2rem;\n}\nh1 {\n  color: var(--cor);\n}\nbutton {\n  padding: 10px 18px;\n  border: 0;\n  border-radius: 10px;\n  background: var(--cor);\n  color: white;\n  cursor: pointer;\n}" },
  "script.js": { lang: "js", code: '// Troca a cor do título ao clicar\nconst titulo = document.getElementById("titulo");\nconst botao = document.getElementById("botao");\nbotao.addEventListener("click", () => {\n  titulo.style.color = "#cf3a22";\n});' },
  "README.md": { lang: "md", code: "# Meu site\n\nProjeto do curso de Desenvolvimento de Sistemas.\nAbra o index.html no navegador." },
  ".gitignore": { lang: "gitignore", code: "node_modules/\n.env\n.DS_Store" },
};
Object.values(ARQUIVOS).forEach((a) => { a.salvo = a.code; });
const vsc = { abertas: [], ativo: null };
const edVsc = $("#vsc-editor");
// alguns navegadores não aceitam "plaintext-only": usa "true" como plano B
if (edVsc.contentEditable !== "plaintext-only") edVsc.contentEditable = "true";

function desenharAbas() {
  const barra = $("#vsc-abas");
  barra.innerHTML = "";
  vsc.abertas.forEach((nome) => {
    const b = document.createElement("button");
    b.className = "aba" + (nome === vsc.ativo ? " ativo" : "") + (ARQUIVOS[nome].code !== ARQUIVOS[nome].salvo ? " sujo" : "");
    b.setAttribute("role", "tab"); b.setAttribute("aria-selected", nome === vsc.ativo);
    b.textContent = nome;
    b.addEventListener("click", () => abrirArquivo(nome));
    barra.append(b);
  });
  $$(".arq[data-arq]").forEach((a) => a.classList.toggle("ativo", a.dataset.arq === vsc.ativo));
}
function abrirArquivo(nome) {
  if (vsc.ativo) ARQUIVOS[vsc.ativo].code = edVsc.textContent; // guarda o que foi digitado
  if (!vsc.abertas.includes(nome)) vsc.abertas.push(nome);
  vsc.ativo = nome;
  edVsc.innerHTML = realcar(ARQUIVOS[nome].code, ARQUIVOS[nome].lang);
  desenharAbas();
}
// monta a prévia: troca <link> e <script src> pelo conteúdo dos outros arquivos
function previaVsc() {
  const html = ARQUIVOS["index.html"].salvo
    .replace(/<link[^>]*style\.css[^>]*>/, () => "<style>" + ARQUIVOS["style.css"].salvo + "</style>")
    .replace(/<script[^>]*script\.js[^>]*><\/script>/, () => "<script>" + ARQUIVOS["script.js"].salvo + "<\/script>");
  $("#vsc-iframe").srcdoc = html;
}
function salvarVsc() {
  ARQUIVOS[vsc.ativo].code = edVsc.textContent;
  Object.values(ARQUIVOS).forEach((a) => { a.salvo = a.code; });
  edVsc.innerHTML = realcar(ARQUIVOS[vsc.ativo].code, ARQUIVOS[vsc.ativo].lang);
  desenharAbas(); previaVsc();
}
edVsc.addEventListener("input", () => { // marca a aba com "●" enquanto não salvou
  ARQUIVOS[vsc.ativo].code = edVsc.textContent; desenharAbas();
});
edVsc.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); salvarVsc(); }
});
$("#vsc-salvar").addEventListener("click", salvarVsc);
$$(".arq[data-arq]").forEach((b) => b.addEventListener("click", () => {
  if (b.dataset.arq === "assets") { // pasta: abre/fecha
    const pasta = $("#pasta-assets");
    pasta.hidden = !pasta.hidden;
    b.textContent = (pasta.hidden ? "▸" : "▾") + " 📁 assets";
  } else abrirArquivo(b.dataset.arq);
}));

// terminal: digita os comandos do git um por um
let fichaTerm = 0;
const PASSOS_GIT = [
  { cmd: "git add .", saida: "" },
  { cmd: 'git commit -m "primeiro commit"', saida: "[main 3f2a1c9] primeiro commit\n 5 files changed, 420 insertions(+)" },
  { cmd: "git push origin main", saida: "Enumerating objects: 9, done.\nWriting objects: 100% (9/9), done.\nTo github.com:escola/meu-site.git\n * [new branch]      main -> main" },
];
async function rodarGit() {
  const minha = ++fichaTerm, term = $("#vsc-terminal");
  term.innerHTML = "";
  for (const passo of PASSOS_GIT) {
    const linha = document.createElement("div");
    linha.innerHTML = '<span class="t-cmd">$ </span>';
    const txt = document.createElement("span");
    linha.append(txt); term.append(linha);
    for (const letra of passo.cmd) {
      txt.textContent += letra; await esperar(reduzir ? 0 : 35);
      if (minha !== fichaTerm) return;
    }
    await esperar(reduzir ? 0 : 350);
    if (passo.saida) { const s = document.createElement("div"); s.textContent = passo.saida; term.append(s); }
    await esperar(reduzir ? 0 : 500);
    if (minha !== fichaTerm) return;
  }
  const fim = document.createElement("div");
  fim.innerHTML = '<span class="t-cmd">$ </span><span class="t-cursor"></span>';
  term.append(fim);
}
$("#vsc-git").addEventListener("click", rodarGit);
abrirArquivo("index.html"); previaVsc();

/* ---------- 11. QUIZ ---------- */
const PERGUNTAS = [
  { p: "Qual linguagem monta o “esqueleto” de uma página web?", o: ["HTML", "CSS", "SQL", "Git"], c: 0, d: "HTML define títulos, textos e botões." },
  { p: "Para que serve o CSS?", o: ["Guardar dados", "Deixar a página bonita", "Enviar e-mails", "Consertar o computador"], c: 1, d: "CSS cuida de cores, tamanhos e animações." },
  { p: "Em let idade = 14; o que é “idade”?", o: ["Uma variável", "Um erro", "Uma imagem", "Um site"], c: 0, d: "Variável é uma caixinha com nome que guarda um valor." },
  { p: "Para que serve o Git?", o: ["Fazer desenhos", "Guardar o histórico do código", "Aumentar a internet", "Abrir sites"], c: 1, d: "Git é uma máquina do tempo para o código." },
];
const caixaQuiz = $("#quiz-caixa");
let qi = 0, pontos = 0;
function mostrarPergunta() {
  const q = PERGUNTAS[qi];
  caixaQuiz.innerHTML = `
    <div class="quiz-topo"><span>Pergunta ${qi + 1} de ${PERGUNTAS.length}</span><span>Pontos: ${pontos}</span></div>
    <div class="quiz-barra" aria-hidden="true"><div style="width:${(qi / PERGUNTAS.length) * 100}%"></div></div>
    <h3>${esc(q.p)}</h3>
    <div class="opcoes">${q.o.map((t, i) => `<button class="opcao" data-i="${i}">${esc(t)}</button>`).join("")}</div>
    <p class="feedback" role="status"></p>
    <button class="btn" id="quiz-prox" hidden></button>`;
  $$(".opcao", caixaQuiz).forEach((b) => b.addEventListener("click", () => responder(+b.dataset.i)));
}
function responder(i) {
  const q = PERGUNTAS[qi], ok = i === q.c;
  const botoes = $$(".opcao", caixaQuiz);
  botoes.forEach((b) => (b.disabled = true));
  botoes[i].classList.add(ok ? "certa" : "errada");
  botoes[q.c].classList.add("certa");
  if (ok) pontos++;
  const fb = $(".feedback", caixaQuiz);
  fb.className = "feedback " + (ok ? "ok" : "erro");
  fb.textContent = (ok ? "✅ Isso aí! " : "❌ Quase! ") + q.d;
  const prox = $("#quiz-prox");
  prox.hidden = false;
  prox.textContent = qi === PERGUNTAS.length - 1 ? "Ver resultado" : "Próxima →";
  prox.addEventListener("click", () => { qi++; qi < PERGUNTAS.length ? mostrarPergunta() : fimQuiz(); });
  prox.focus();
}
function fimQuiz() {
  const msg = pontos === PERGUNTAS.length ? "Você já pensa como programador! 🏆" : pontos >= 2 ? "Muito bem! Falta pouco para virar craque. 💪" : "Sem problema: no curso você aprende tudo isso. 🌱";
  caixaQuiz.innerHTML = `<div class="quiz-fim"><div class="nota">${pontos}/${PERGUNTAS.length}</div><h3>${msg}</h3><button class="btn" id="quiz-again">↺ Jogar de novo</button></div>`;
  $("#quiz-again").addEventListener("click", () => { qi = 0; pontos = 0; mostrarPergunta(); });
}
mostrarPergunta();

/* ---------- 12. ABAS "COMO FOI FEITO" ---------- */
const abasSite = $$("#abas-site [role=tab]");
function mostrarAba(aba, foco) {
  abasSite.forEach((a) => {
    const ativa = a === aba;
    a.setAttribute("aria-selected", ativa);
    a.tabIndex = ativa ? 0 : -1;
    $("#" + a.getAttribute("aria-controls")).hidden = !ativa;
  });
  if (foco) aba.focus();
  if (aba.id === "tab-ar") rodarFluxo();
}
abasSite.forEach((a, i) => {
  a.addEventListener("click", () => mostrarAba(a));
  a.addEventListener("keydown", (e) => { // setas, Home e End navegam entre as abas
    const n = abasSite.length;
    const alvo = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
    if (alvo !== undefined) { e.preventDefault(); mostrarAba(abasSite[alvo], true); }
  });
});
// CSS: o controle deslizante muda a variável --dur da bolinha
$("#dur-range").addEventListener("input", (e) => {
  $("#bolinha").style.setProperty("--dur", e.target.value + "s");
  $("#dur-valor").textContent = Number(e.target.value).toFixed(1) + "s";
});
// JS: botão que executa o código mostrado
$("#btn-exec").addEventListener("click", () => animarContador($("#demo-contador"), 100));
// No ar: reinicia a animação do fluxo
function rodarFluxo() {
  const f = $("#fluxo");
  f.classList.remove("rodando"); void f.offsetWidth; // força o navegador a "reiniciar"
  f.classList.add("rodando");
}
$("#btn-fluxo").addEventListener("click", rodarFluxo);

/* ---------- 13. MODO APRESENTAÇÃO ---------- */
const btnAp = $("#btn-apresentacao");
function alternarApresentacao(ligar) {
  const on = ligar ?? !document.documentElement.classList.contains("apresentacao");
  document.documentElement.classList.toggle("apresentacao", on);
  btnAp.setAttribute("aria-pressed", on);
  btnAp.textContent = on ? "✖ Sair" : "🎤 Apresentar";
  setTimeout(() => secoes[atual].scrollIntoView(), 50); // mantém a seção atual na tela
}
btnAp.addEventListener("click", () => alternarApresentacao());
function irPara(i) {
  const alvo = Math.max(0, Math.min(secoes.length - 1, i));
  secoes[alvo].scrollIntoView({ behavior: reduzir ? "auto" : "smooth" });
}
addEventListener("keydown", (e) => {
  const ap = document.documentElement.classList.contains("apresentacao");
  if (e.key === "Escape" && ap) return alternarApresentacao(false);
  if (!ap || e.altKey || e.ctrlKey || e.metaKey) return;
  // não rouba as setas de quem está digitando ou ajustando um controle
  if (e.target.closest("textarea, input, select, [contenteditable]")) return;
  if (e.key === "ArrowRight") { e.preventDefault(); irPara(atual + 1); }
  if (e.key === "ArrowLeft") { e.preventDefault(); irPara(atual - 1); }
});
