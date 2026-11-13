/* Next Level Gaming & Esports Arena - site scripts */
document.addEventListener('DOMContentLoaded', () => {
  try {
    initNav();
    document.querySelectorAll('[data-year]').forEach(e => e.textContent = new Date().getFullYear());
    const init = { home: initHome, packages: initPackages, detail: initDetail, calculator: initCalculator, contact: initContact }[document.body.dataset.page];
    if (init) {
      if (typeof PACKAGES === 'undefined') throw new Error('Package data failed to load');
      init();
    }
  } catch (err) { showAppError(err); }
});

function showAppError(err) {
  console.error(err);
  const box = document.createElement('div');
  box.className = 'app-error'; box.setAttribute('role', 'alert');
  box.textContent = 'Sorry, something went wrong while loading this page. Please refresh, or contact us if it keeps happening.';
  const main = document.querySelector('main'); if (main) main.prepend(box);
}

/* ---------- navigation + drop-down menu ---------- */
function initNav() {
  const btn = document.querySelector('.menu-btn'), list = document.querySelector('nav > ul');
  if (btn && list) btn.addEventListener('click', () => list.classList.toggle('open'));
  document.querySelectorAll('.has-dropdown').forEach(dd => {
    const t = dd.querySelector('.dd-toggle');
    const setOpen = o => { dd.classList.toggle('open', o); t.setAttribute('aria-expanded', String(o)); };
    t.addEventListener('click', e => { e.stopPropagation(); setOpen(!dd.classList.contains('open')); });
    dd.addEventListener('keydown', e => { if (e.key === 'Escape') { setOpen(false); t.focus(); } });
    document.addEventListener('click', e => { if (!dd.contains(e.target)) setOpen(false); });
  });
}

/* ---------- shared ---------- */
function packageCard(p) {
  return `<article class="card"><div class="icon-box">${p.icon}</div>
    <h3>${p.name}</h3><p class="muted">${p.short}</p>
    <div class="row"><span class="price">${formatRand(p.price)}</span>
    <a class="btn outline small" href="package-detail.html?id=${p.id}">View Details</a></div></article>`;
}

/* ---------- home ---------- */
function initHome() {
  document.getElementById('featured').innerHTML = PACKAGES.filter(p => p.type === 'gaming').map(packageCard).join('');
  document.getElementById('tournaments').innerHTML = TOURNAMENTS.map((t, i) => `
    <div class="card tourney ${i ? 'p' : ''}"><div class="icon-box">${t.icon}</div>
    <div class="grow"><h3>${t.name}</h3><p class="muted">Date: ${t.date}</p></div>
    <a class="btn small ${i ? '' : 'purple'}" href="contact.html?event=${encodeURIComponent(t.name)}">Register</a></div>`).join('');
}

/* ---------- packages + comparison table ---------- */
function initPackages() {
  document.getElementById('gaming').innerHTML = PACKAGES.filter(p => p.type === 'gaming').map(packageCard).join('');
  document.getElementById('individual').innerHTML = PACKAGES.filter(p => p.type === 'individual').map(p => `
    <article class="card p"><div class="icon-box">${p.icon}</div><h3>${p.name}</h3>
    <p class="muted">${p.short}</p><div class="row"><span class="price" style="color:var(--purple)">${formatRand(p.price)}</span>
    <a class="btn purple small" href="calculator.html?add=${p.id}">Quick Book</a></div></article>`).join('');
  const rows = PACKAGES.map(p => `<tr><td><a class="accent" href="package-detail.html?id=${p.id}">${p.name}</a></td>
    <td>${p.type === 'gaming' ? 'Gaming package' : 'Individual experience'}</td><td>${p.session}</td>
    <td class="num">${formatRand(p.price)}</td><td class="num">${formatRand(p.price * (1 + VAT_RATE))}</td></tr>`).join('');
  document.getElementById('compareWrap').innerHTML = `<table class="data"><caption>Package comparison (VAT is 15%)</caption>
    <thead><tr><th scope="col">Package</th><th scope="col">Type</th><th scope="col">Session</th><th scope="col" class="num">Price excl. VAT</th><th scope="col" class="num">Price incl. VAT</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
}

/* ---------- package detail (with not-found handling) ---------- */
function initDetail() {
  const id = new URLSearchParams(location.search).get('id');
  const p = PACKAGES.find(x => x.id === id);
  const box = document.getElementById('detail');
  if (!p) {
    document.title = 'Package not found | Next Level Gaming & Esports Arena';
    box.style.display = 'block';
    box.innerHTML = `<div class="form-error show" role="alert">Sorry, we could not find that package${id ? ` ("${id.replace(/[<>&"]/g, '')}")` : ''}.</div>
      <p style="margin-top:1rem"><a class="btn" href="packages.html">Back to Packages</a></p>`;
    return;
  }
  document.title = p.name + ' | Next Level Gaming & Esports Arena';
  box.innerHTML = `
    <div class="art" aria-hidden="true">${p.icon}</div>
    <div><h1>${p.name}</h1>
    <p style="margin:.6rem 0"><span class="price" style="font-size:2rem">${formatRand(p.price)}</span>
    ${p.badge ? `<span class="badge">${p.badge}</span>` : ''} <span class="muted">excl. VAT</span></p>
    <p class="muted">${p.desc}</p><p style="margin-top:.6rem"><strong>Session:</strong> <span class="muted">${p.session}</span></p>
    <h3 class="accent" style="margin-top:1.2rem">What's Included</h3>
    <ul class="checklist">${p.includes.map(i => `<li>${i}</li>`).join('')}</ul>
    <a class="btn" href="calculator.html?add=${p.id}">Book Now</a>
    <a class="btn outline" href="packages.html">Back to Packages</a></div>`;
}

/* ---------- fee calculator (quotation table + error handling) ---------- */
function initCalculator() {
  const MAX = 10, state = {};
  PACKAGES.forEach(p => state[p.id] = 0);
  const add = new URLSearchParams(location.search).get('add');
  if (add) { if (state.hasOwnProperty(add)) state[add] = 1; }
  const err = document.getElementById('calcError');
  const say = m => { err.textContent = m; err.classList.toggle('show', !!m); };
  const list = document.getElementById('items');
  list.innerHTML = PACKAGES.map(p => `
    <div class="item"><input type="checkbox" id="chk-${p.id}" aria-label="Select ${p.name}">
    <div class="grow"><strong>${p.name}</strong><div class="sub">${formatRand(p.price)}</div></div>
    <div class="stepper"><button type="button" data-id="${p.id}" data-d="-1" aria-label="Decrease ${p.name}">-</button>
    <span class="q" id="q-${p.id}">0</span>
    <button type="button" class="plus" data-id="${p.id}" data-d="1" aria-label="Increase ${p.name}">+</button></div></div>`).join('');
  document.getElementById('tierRow').innerHTML = '1 booking: <b>0%</b> | 2: <b>5%</b> | 3: <b>10%</b> | 4+: <b>15%</b>';
  list.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const id = b.dataset.id, next = state[id] + Number(b.dataset.d);
    if (next > MAX) { say(`You can book a maximum of ${MAX} of each package.`); return; }
    if (next < 0) return;
    say(''); state[id] = next; render();
  });
  list.addEventListener('change', e => {
    if (e.target.type !== 'checkbox') return;
    say(''); const id = e.target.id.replace('chk-', ''); state[id] = e.target.checked ? Math.max(1, state[id]) : 0; render();
  });
  function render() {
    PACKAGES.forEach(p => {
      document.getElementById('q-' + p.id).textContent = state[p.id];
      document.getElementById('chk-' + p.id).checked = state[p.id] > 0;
    });
    const items = PACKAGES.filter(p => state[p.id] > 0).map(p => ({ ...p, qty: state[p.id] }));
    const q = calculateQuote(items);
    if (!isFinite(q.total)) { say('We could not calculate your total. Please refresh and try again.'); return { items: [], q }; }
    document.getElementById('sCount').textContent = q.count;
    document.getElementById('sSub').textContent = formatRand(q.subtotal);
    document.getElementById('sDiscLabel').textContent = `Multi-Booking Discount (${Math.round(q.rate * 100)}%)`;
    document.getElementById('sDisc').textContent = '- ' + formatRand(q.discount);
    document.getElementById('sVat').textContent = formatRand(q.vat);
    document.getElementById('sTotal').textContent = formatRand(q.total);
    document.getElementById('quoteBox').style.display = 'none';
    return { items, q };
  }
  document.getElementById('quoteBtn').addEventListener('click', () => {
    try {
      const { items, q } = render();
      const box = document.getElementById('quoteBox');
      if (!items.length) { say('Please select at least one package or experience to generate a quotation.'); box.style.display = 'none'; return; }
      say('');
      box.style.display = 'block';
      box.innerHTML = `<div class="table-wrap"><table class="data"><caption>Quotation, ${new Date().toLocaleDateString('en-ZA')}</caption>
        <thead><tr><th scope="col">Item</th><th scope="col" class="num">Qty</th><th scope="col" class="num">Unit price</th><th scope="col" class="num">Total</th></tr></thead>
        <tbody>${items.map(i => `<tr><td>${i.name}</td><td class="num">${i.qty}</td><td class="num">${formatRand(i.price)}</td><td class="num">${formatRand(i.price * i.qty)}</td></tr>`).join('')}</tbody>
        <tfoot><tr><td colspan="3">Subtotal</td><td class="num">${formatRand(q.subtotal)}</td></tr>
        <tr class="disc"><td colspan="3">Discount (${Math.round(q.rate * 100)}%)</td><td class="num">- ${formatRand(q.discount)}</td></tr>
        <tr><td colspan="3">VAT (15%)</td><td class="num">${formatRand(q.vat)}</td></tr>
        <tr class="total"><td colspan="3">TOTAL DUE</td><td class="num">${formatRand(q.total)}</td></tr></tfoot></table></div>
        <p style="margin-top:.8rem"><a class="accent" href="contact.html?quote=1">Send this quote to our team</a></p>`;
    } catch (e) { console.error(e); say('Something went wrong while creating your quotation. Please try again.'); }
  });
  render();
}

/* ---------- contact form (validation) ---------- */
function initContact() {
  const params = new URLSearchParams(location.search);
  const form = document.getElementById('contactForm'), msg = document.getElementById('message');
  if (params.get('event')) msg.value = 'I would like to register for: ' + params.get('event');
  if (params.get('quote')) msg.value = 'Please send me a booking confirmation for my quotation.';
  const rules = {
    name: v => v.length < 2 ? 'Please enter your full name.' : '',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Please enter a valid email address.',
    phone: v => /^\+?[0-9 ]{9,15}$/.test(v) ? '' : 'Enter a valid phone number, e.g. +27 82 123 4567.',
    message: v => v.length < 10 ? 'Message must be at least 10 characters.' : ''
  };
  const check = k => {
    const el = form.elements[k], m = rules[k](el.value.trim());
    document.getElementById('e-' + k).textContent = m; el.classList.toggle('invalid', !!m); el.setAttribute('aria-invalid', String(!!m));
    return !m;
  };
  Object.keys(rules).forEach(k => form.elements[k].addEventListener('blur', () => check(k)));
  form.addEventListener('submit', e => {
    e.preventDefault();
    const ok = Object.keys(rules).map(check).every(Boolean);
    const okMsg = document.getElementById('okMsg');
    okMsg.style.display = ok ? 'block' : 'none';
    if (ok) form.reset();
    else form.querySelector('.invalid').focus();
  });
}
