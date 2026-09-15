// Myanmar Grade 12 — Mini App (static, GitHub Pages)
// Result data is served by the bot backend (CORS enabled).

const API_BASES = [
  "https://myanmar-exam-finder.lovable.app",
  "https://project--42619713-311d-4e79-bfaf-63b864bf09b4.lovable.app",
  "https://project--42619713-311d-4e79-bfaf-63b864bf09b4-dev.lovable.app",
];

const tg = window.Telegram?.WebApp;
try {
  tg?.ready();
  tg?.expand();
  tg?.setHeaderColor?.("#060d1c");
  tg?.setBackgroundColor?.("#060d1c");
} catch (_) {}

const $ = (id) => document.getElementById(id);
const screens = {
  home: $("screen-home"),
  form: $("screen-form"),
  load: $("screen-load"),
  result: $("screen-result"),
};

let exam = "matric";

function show(name) {
  Object.entries(screens).forEach(([k, el]) => el.classList.toggle("hidden", k !== name));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function haptic(type) {
  try { tg?.HapticFeedback?.notificationOccurred(type); } catch (_) {}
}

// --- links (kept out of the DOM so long-press never reveals a URL) ---------
const LINKS = {
  support: "https://t.me/Myanmar_Grade12",
  bot: "https://t.me/MyanmarGrade_12Bot",
  owner: "https://t.me/debby_yoixx",
  help: "https://t.me/Myanmar_Grade12",
};

function openLink(key) {
  const url = LINKS[key];
  if (!url) return;
  try {
    if (tg?.openTelegramLink) return tg.openTelegramLink(url);
    if (tg?.openLink) return tg.openLink(url);
  } catch (_) {}
  window.open(url, "_blank", "noopener,noreferrer");
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest?.("[data-link]");
  if (btn) openLink(btn.dataset.link);
});

async function apiGet(params) {
  let lastErr;
  for (const base of API_BASES) {
    try {
      const res = await fetch(`${base}/api/public/exam/lookup?${new URLSearchParams(params)}`);
      const data = await res.json();
      if (res.ok || data) return data;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("network");
}

// --- alpha suggestions -----------------------------------------------------
async function loadAlphas() {
  try {
    const data = await apiGet({ exam, list: "1" });
    if (!data?.alphas) return;
    $("alpha-list").innerHTML = data.alphas.map((a) => `<option value="${a}"></option>`).join("");
  } catch (_) {}
}

// --- flow ------------------------------------------------------------------
document.querySelectorAll(".card").forEach((btn) => {
  btn.addEventListener("click", () => {
    exam = btn.dataset.exam;
    $("form-title").textContent =
      exam === "matric" ? "တက္ကသိုလ်ဝင်စာမေးပွဲ" : "စက်မှု၊ စိုက်ပျိုးရေး၊ မွေးမြူရေး";
    $("in-alpha").placeholder = exam === "matric" ? "ဥပမာ - မနတ" : "ဥပမာ - မကတ(B)";
    $("in-alpha").value = "";
    $("in-roll").value = "";
    $("form-hint").textContent = "";
    show("form");
    loadAlphas();
  });
});

$("btn-back").addEventListener("click", () => show("home"));
$("btn-again").addEventListener("click", () => show("form"));

const FRAMES = ["🪄", "💫", "✨"];
async function suspense() {
  show("load");
  const fill = $("bar-fill");
  const magic = $("magic");
  for (let i = 1; i <= 9; i++) {
    magic.textContent = FRAMES[i % FRAMES.length];
    fill.style.width = `${Math.round((i / 9) * 100)}%`;
    await new Promise((r) => setTimeout(r, 220));
  }
}

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function rowHtml(label, value) {
  return `<div class="row"><span>${esc(label)}</span><strong data-selectable>${esc(value)}</strong></div>`;
}

function renderResult(data) {
  const img = $("result-img");
  if (data.found) {
    img.src = "assets/success.png";
    $("result-title").innerHTML = '<span class="ok">✅ အောင်မြင်ပါသည်။</span>';
    let html = rowHtml("ခုံအမှတ်", data.rollDisplay) + rowHtml("အမည်", data.name) + rowHtml("ဂုဏ်ထူး", data.distinction);
    if (data.exam === "betal") {
      html += rowHtml("အဆင့်", data.grade || "မရှိပါ။");
      html += rowHtml("သတ်မှတ်ချက်", data.designation || "မရှိပါ။");
    }
    $("result-rows").innerHTML = html;
    haptic("success");
  } else {
    img.src = "assets/notfound.png";
    $("result-title").innerHTML = '<span class="bad">❌ အောင်စာရင်းတွင်ရှာမတွေ့ပါ။</span>';
    $("result-rows").innerHTML = rowHtml("ခုံအမှတ်", data.rollDisplay);
    haptic("error");
  }
  show("result");
}

$("btn-check").addEventListener("click", async () => {
  const alpha = $("in-alpha").value.trim();
  const roll = $("in-roll").value.trim();
  const hint = $("form-hint");

  if (!alpha) return (hint.textContent = "ခုံအမှတ် (အက္ခရာ) ရိုက်ထည့်ပါ။");
  if (!roll) return (hint.textContent = "ခုံအမှတ် (ကိန်းဂဏန်း) ရိုက်ထည့်ပါ။");
  hint.textContent = "";

  const btn = $("btn-check");
  btn.disabled = true;
  try {
    const [data] = await Promise.all([apiGet({ exam, alpha, roll }), suspense()]);
    if (data?.error === "unknown_alpha") {
      show("form");
      hint.textContent = `ဖြည့်သွင်းသည့် အက္ခရာ (${alpha}) နှင့် စာစစ်ဌာနမရှိပါ။`;
      return;
    }
    if (!data?.ok) {
      show("form");
      hint.textContent = "စနစ်ချို့ယွင်းမှုဖြစ်ပေါ်နေပါသည်။ ခဏအကြာတွင် ပြန်ကြိုးစားပါ။";
      return;
    }
    renderResult(data);
  } catch (_) {
    show("form");
    hint.textContent = "အင်တာနက်ချိတ်ဆက်မှု စစ်ဆေးပြီး ပြန်ကြိုးစားပါ။";
  } finally {
    btn.disabled = false;
  }
});

$("in-roll").addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("btn-check").click();
});
