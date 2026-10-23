// Jednoduchá "závora" heslem před vstupem do aplikace.
// Pozor: na statickém webu (GitHub Pages) jde jen o ochranu před náhodnými návštěvníky,
// ne o skutečné zabezpečení – kód stránky je veřejný.
(function () {
  // SHA-256 hesla (samotné heslo v kódu není).
  const HASH = '6a7d96c1d822367a30de9e6c41a227f6b69e2cc0123a9bf48c8f21e4e9a7e154';
  const KEY = 'titulky:unlocked';
  try { if (localStorage.getItem(KEY) === HASH) return; } catch {}

  const style = document.createElement('style');
  style.textContent = `
    body.locked > :not(#gate) { visibility: hidden; }
    #gate { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; background: #0f1115; padding: 16px; }
    #gate form { width: min(100%, 360px); background: #181b22; border: 1px solid #2c313c; border-radius: 16px; padding: 24px; display: flex; flex-direction: column; gap: 12px; color: #e8eaef; font: 16px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
    #gate h1 { font-size: 20px; margin: 0; }
    #gate p { margin: 0; color: #9aa1ae; font-size: 14px; }
    #gate input { font: inherit; font-size: 16px; color: #e8eaef; background: #20242d; border: 1px solid #2c313c; border-radius: 10px; padding: 12px; }
    #gate button { font: inherit; font-weight: 700; background: #ffd400; color: #111; border: none; border-radius: 10px; padding: 12px; cursor: pointer; }
    #gate .err { color: #ef4444; font-size: 14px; min-height: 1.2em; }
  `;
  document.head.appendChild(style);

  async function sha256(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  function show() {
    document.body.classList.add('locked');
    const gate = document.createElement('div');
    gate.id = 'gate';
    gate.innerHTML = `
      <form>
        <h1>Titulky na Reels</h1>
        <p>Pro vstup zadej heslo.</p>
        <input type="password" autocomplete="current-password" placeholder="Heslo" aria-label="Heslo" autofocus>
        <div class="err"></div>
        <button type="submit">Vstoupit</button>
      </form>`;
    document.body.appendChild(gate);
    const input = gate.querySelector('input');
    gate.querySelector('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const h = await sha256(input.value.trim().toLowerCase());
      if (h === HASH) {
        try { localStorage.setItem(KEY, HASH); } catch {}
        gate.remove();
        document.body.classList.remove('locked');
      } else {
        gate.querySelector('.err').textContent = 'Špatné heslo, zkus to znovu.';
        input.select();
      }
    });
    setTimeout(() => input.focus(), 50);
  }
  if (document.body) show(); else document.addEventListener('DOMContentLoaded', show);
})();
