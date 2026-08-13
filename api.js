// ========== AI 请求配置 ==========
export const AI_TIMEOUT_MS = 15000;   // 单次请求最长等待
export const AI_RETRY_DELAY_MS = 1200; // 失败后重试前的等待
export const AI_MAX_ATTEMPTS = 2;      // 1 次正常 + 1 次重试

export const AI_PROXY_URL = (() => {
  if (typeof window !== "undefined" && window.location && window.location.protocol !== "file:") {
    return window.location.origin + "/api/reading";
  }
  return "http://localhost:8787/api/reading";
})();

// AI 风格配置
export const AI_STYLE = {
  toneZh: "温柔、有洞察力，像一位懂塔罗的朋友在聊天",
  toneEn: "warm, insightful, like a knowledgeable friend chatting with you",
  sentences: "2-4"
};

// 线上 / 本地都统一使用同域 API：
// - 本地开发：浏览器可直接访问 http://localhost:8787/api/reading
// - 线上部署：前端和后端同域，地址为 /api/reading
// 这样不会再把密钥暴露给前端，也不需要每次手动在 terminal 里 export ARK_API_KEY。

// ========== 工具函数：延迟 ==========
export function wait(ms){
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========== 工具函数：超时包装 ==========
// 这个环境的 fetch 是通过 postMessage 转发给父窗口的，AbortSignal 无法被结构化克隆
// （会报 DataCloneError），所以超时只能用 Promise.race，不能用 AbortController。
// 代价：race 判定超时后，原来的请求仍会在后台继续跑到自己结束（无法真正取消），
// 只是它的结果不会再被用到——如果它最终成功，只是白白多花了一次 token。
export function withTimeout(promise, ms){
  return Promise.race([
    promise,
    wait(ms).then(() => { throw new Error("timeout after " + ms + "ms"); })
  ]);
}

// ========== AI 提示词生成 ==========
function buildAISystemPrompt(lang){
  return lang === "zh"
    ? `你是一位${AI_STYLE.toneZh}的塔罗解读者。用中文写 ${AI_STYLE.sentences} 句话，不要分点、不要标题，只输出解读正文本身。`
    : `You are a tarot reader whose tone is ${AI_STYLE.toneEn}. Write ${AI_STYLE.sentences} sentences in English. No bullet points, no titles — output only the reading itself.`;
}

function buildAIUserPrompt(card, upright, lang){
  const name = lang === "zh" ? card.cn : card.en;
  const orientation = upright
    ? (lang === "zh" ? "正位" : "upright")
    : (lang === "zh" ? "逆位" : "reversed");
  const baseHint = lang === "zh"
    ? (upright ? card.up : card.rev)
    : (upright ? card.up_en : card.rev_en);
  return lang === "zh"
    ? `今天抽到的牌是「${name}」（${orientation}）。已有的一句话提示是："${baseHint}"。请在这个基础上给出更展开的解读。`
    : `Today's card is "${name}" (${orientation}). The existing one-line hint is: "${baseHint}". Please expand on this with a fuller reading.`;
}

// ========== AI 阅读请求函数 ==========
// 返回值永远是 {ok:true, text} 或 {ok:false, error} —— 不会抛出，调用方不需要 try/catch
export async function requestAIReading(card, upright, lang){
  const system = buildAISystemPrompt(lang);
  const user = buildAIUserPrompt(card, upright, lang);
  let lastError = null;

  for (let attempt = 1; attempt <= AI_MAX_ATTEMPTS; attempt++){
    try{
      const res = await withTimeout(
        fetch(AI_PROXY_URL, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ system, message: user })
        }),
        AI_TIMEOUT_MS
      );

      if (!res || !res.ok){
        throw new Error("http " + (res && res.status));
      }
      const data = await res.json();
      const text = data && data.text ? data.text.trim() : "";
      if (!text) throw new Error("empty response");
      return { ok: true, text };
    }catch(err){
      lastError = err;
      console.warn("[AI reading] attempt " + attempt + " failed:", err && err.message);
      if (attempt < AI_MAX_ATTEMPTS){
        await wait(AI_RETRY_DELAY_MS);
      }
    }
  }
  return { ok: false, error: lastError };
}
