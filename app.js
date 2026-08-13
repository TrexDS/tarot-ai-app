// ========== 导入模块 ==========
import { DECK, UI, MONTH_ABBR, imgUrl } from "./data.js";
import { requestAIReading, AI_STYLE } from "./api.js";

// ========== DOM 元素引用 ==========
const cardEl = document.getElementById("cardEl");
const cardImg = document.getElementById("cardImg");
const cardFallback = document.getElementById("cardFallback");
const hintText = document.getElementById("hintText");
const revealPanel = document.getElementById("revealPanel");
const sealEl = document.getElementById("sealEl");
const nameCn = document.getElementById("nameCn");
const nameEn = document.getElementById("nameEn");
const orientLabel = document.getElementById("orientLabel");
const meaningText = document.getElementById("meaningText");
const detailLabel = document.getElementById("detailLabel");
const detailText = document.getElementById("detailText");
const journalList = document.getElementById("journalList");
const eyebrowText = document.getElementById("eyebrowText");
const journalLabel = document.getElementById("journalLabel");
const footerNote = document.getElementById("footerNote");
const langToggle = document.getElementById("langToggle");
const dateLineEl = document.getElementById("dateLine");

// ========== 全局状态 ==========
let lang = "zh";
let currentEntry = null;
let journal = [];
let aiRequestSeq = 0;

// ========== 工具函数：生成日期字符串 ==========
function todayStr(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return y + "-" + m + "-" + day;
}

// ========== 工具函数：格式化日期显示 ==========
function fmtDateLine(){
  return UI[lang].dateFmt(new Date());
}

// ========== localStorage 读写：日志 ==========
async function loadJournal(){
  try{
    const res = localStorage.getItem("tarot_journal");
    if(res) return JSON.parse(res);
  }catch(e){ console.error("load failed", e); }
  return [];
}

async function saveJournal(journal){
  try{
    localStorage.setItem("tarot_journal", JSON.stringify(journal.slice(0,120)));
  }catch(e){ console.error("save failed", e); }
}

// ========== localStorage 读写：语言偏好 ==========
async function loadLangPref(){
  try{
    const res = localStorage.getItem("tarot_lang");
    if(res) return res;
  }catch(e){}
  return "zh";
}

async function saveLangPref(){
  try{
    localStorage.setItem("tarot_lang", lang);
  }catch(e){}
}

// ========== 渲染日志列表 ==========
function renderJournal(journal){
  const t = UI[lang];
  if(!journal.length){
    journalList.innerHTML = '<div class="empty-journal">' + t.emptyJournal + '</div>';
    return;
  }
  journalList.innerHTML = "";
  journal.slice(0,30).forEach(entry=>{
    const card = DECK[entry.idx];
    const row = document.createElement("div");
    row.className = "journal-row";
    const parts = entry.date.split("-");
    const dateLabel = parts[2] + "/" + MONTH_ABBR[parseInt(parts[1],10)-1] + "/" + parts[0];
    row.innerHTML =
      '<span class="jd">' + dateLabel + '</span>' +
      '<span class="jn">' + (lang === "zh" ? card.cn : card.en) + '</span>' +
      '<span class="jo ' + (entry.upright ? "up" : "rev") + '">' + (entry.upright ? t.orient.up : t.orient.rev) + '</span>';
    journalList.appendChild(row);
  });
}

// ========== 抽牌函数 ==========
function drawNewCard(){
  const idx = Math.floor(Math.random() * DECK.length);
  const upright = Math.random() > 0.35;
  return { date: todayStr(), idx, upright, ts: Date.now() };
}

// ========== 应用静态文本（UI 更新）==========
function applyStaticText(){
  const t = UI[lang];
  eyebrowText.textContent = t.eyebrow;
  dateLineEl.textContent = fmtDateLine();
  journalLabel.textContent = t.journalLabel;
  detailLabel.textContent = t.detailLabel;
  langToggle.textContent = lang === "zh" ? "EN" : "中";
  footerNote.innerHTML = t.footerPrefix;
  const btn = document.createElement("button");
  btn.id = "resetBtn";
  btn.textContent = t.resetBtn;
  footerNote.appendChild(btn);
  bindResetBtn(btn);
  if(!currentEntry){
    hintText.textContent = t.hint;
  }
  renderJournal(journal);
}

// ========== 绑定"重新抽取"按钮 ==========
function bindResetBtn(btn){
  btn.addEventListener("click", async (e)=>{
    e.stopPropagation();
    const today = todayStr();
    journal = journal.filter(x => x.date !== today);
    await saveJournal(journal);
    currentEntry = null;
    cardEl.classList.remove("flipped","settled");
    revealPanel.classList.remove("show");
    hintText.style.opacity = "1";
    hintText.textContent = UI[lang].hint;
    renderJournal(journal);
  });
}

// ========== AI 解读应用函数 ==========
// 静默降级：失败时什么都不做，让 renderCard 已经写好的固定 up_detail/rev_detail 文案留在屏幕上
async function applyAIReading(entry){
  const card = DECK[entry.idx];
  const targetLang = lang;

  if (entry.aiReading && entry.aiReading[targetLang]){
    if (currentEntry === entry && lang === targetLang){
      detailLabel.textContent = UI[targetLang].detailLabel;
      detailText.textContent = entry.aiReading[targetLang];
    }
    return;
  }

  const myToken = ++aiRequestSeq;
  const isStillRelevant = () => myToken === aiRequestSeq && currentEntry === entry && lang === targetLang;

  if (isStillRelevant()){
    detailLabel.textContent = UI[targetLang].aiLoading;
  }

  const result = await requestAIReading(card, entry.upright, targetLang);

  if (result.ok){
    entry.aiReading = entry.aiReading || {};
    entry.aiReading[targetLang] = result.text;
    if (isStillRelevant()){
      detailLabel.textContent = UI[targetLang].detailLabel;
      detailText.textContent = result.text;
    }
    await saveJournal(journal);
  } else if (isStillRelevant()){
    detailLabel.textContent = UI[targetLang].aiFailed;
  }
  // result.ok === false：保留固定文案并显示失败提示，不再覆盖成默认“详细解读”
}

// ========== 渲染卡牌详情 ==========
function renderCard(entry, animate){
  currentEntry = entry;
  const card = DECK[entry.idx];
  const t = UI[lang];
  cardImg.src = imgUrl(card.file);
  cardImg.style.display = "block";
  cardImg.classList.toggle("reversed", !entry.upright);
  cardFallback.style.display = "none";
  cardImg.onerror = function(){
    cardImg.style.display = "none";
    cardFallback.style.display = "flex";
    cardFallback.textContent = lang === "zh" ? card.cn : card.en;
  };

  nameCn.textContent = lang === "zh" ? card.cn : card.en;
  nameEn.textContent = lang === "zh"
    ? card.en + (entry.upright ? "" : " · Reversed")
    : card.cn + (entry.upright ? "" : " · 逆位");
  sealEl.textContent = entry.upright ? t.seal.up : t.seal.rev;
  sealEl.style.borderColor = entry.upright ? "var(--gold)" : "var(--seal)";
  sealEl.style.color = entry.upright ? "var(--gold-soft)" : "var(--seal-soft)";
  orientLabel.textContent = (entry.upright ? t.orient.up : t.orient.rev) + t.insight;
  meaningText.textContent = entry.upright
    ? (lang === "zh" ? card.up : card.up_en)
    : (lang === "zh" ? card.rev : card.rev_en);
  detailText.textContent = entry.upright
    ? (lang === "zh" ? card.up_detail : card.up_detail_en)
    : (lang === "zh" ? card.rev_detail : card.rev_detail_en);

  cardEl.classList.add("flipped");
  cardEl.classList.add("settled");
  if(animate){
    revealPanel.classList.remove("show");
    requestAnimationFrame(()=>revealPanel.classList.add("show"));
  } else {
    revealPanel.classList.add("show");
  }
  hintText.style.opacity = "0";

  applyAIReading(entry); // fire-and-forget：命中缓存直接换字，没命中就后台请求+静默降级
}

// ========== 语言切换监听 ==========
langToggle.addEventListener("click", async ()=>{
  lang = lang === "zh" ? "en" : "zh";
  applyStaticText();
  if(currentEntry){
    renderCard(currentEntry, false);
  }
  await saveLangPref();
});

// ========== 卡牌点击事件 ==========
cardEl.addEventListener("click", async ()=>{
  if(cardEl.classList.contains("settled")) return;
  const today = todayStr();
  if(journal.find(e => e.date === today)) return;

  const entry = drawNewCard();
  journal = journal.filter(e => e.date !== today);
  journal.unshift(entry);
  renderCard(entry, true);
  renderJournal(journal);
  await saveJournal(journal);
});

// ========== 页面初始化 ==========
async function init(){
  lang = await loadLangPref();
  journal = await loadJournal();
  applyStaticText();
  const today = todayStr();
  const todays = journal.find(e => e.date === today);
  if(todays){
    renderCard(todays, false);
  }
}

// ========== 启动应用 ==========
init();
