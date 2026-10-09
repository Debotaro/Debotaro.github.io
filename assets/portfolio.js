const menu = document.getElementById('menu-toggle'),
  navigation = document.getElementById('site-navigation');
function closeMenu() {
  menu.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('open');
}
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('open', open);
});
navigation.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menu.focus();
  }
});
matchMedia('(min-width:641px)').addEventListener('change', (event) => {
  if (event.matches) closeMenu();
});
document.querySelectorAll('[data-filter]').forEach((button) =>
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach((item) => {
      item.classList.toggle('active', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
    let count = 0;
    document.querySelectorAll('.project').forEach((project) => {
      project.hidden = filter !== 'all' && project.dataset.type !== filter;
      if (!project.hidden) {
        count++;
        project.classList.add('visible');
      }
    });
    document.getElementById('project-count').textContent =
      `Showing ${count} ${filter === 'all' ? 'concept projects' : filter === 'product' ? 'product systems' : 'brand experiences'}`;
  }),
);
const reduced = matchMedia('(prefers-reduced-motion:reduce)');
if (!reduced.matches && 'IntersectionObserver' in window) {
  document.body.classList.add('motion-ready');
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      }),
    { threshold: 0.08 },
  );
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
}
if (!reduced.matches && matchMedia('(pointer:fine)').matches) {
  const art = document.querySelector('.hero-art'),
    frame = art.querySelector('.logo-frame');
  let frameRequest;
  art.addEventListener('pointermove', (event) => {
    cancelAnimationFrame(frameRequest);
    frameRequest = requestAnimationFrame(() => {
      const rect = art.getBoundingClientRect(),
        x = (event.clientX - rect.left) / rect.width - 0.5,
        y = (event.clientY - rect.top) / rect.height - 0.5;
      frame.style.transform = `perspective(850px) rotate(-9deg) rotateY(${-16 + x * 12}deg) rotateX(${8 - y * 10}deg)`;
    });
  });
  art.addEventListener('pointerleave', () => {
    cancelAnimationFrame(frameRequest);
    frame.style.transform = '';
  });
}
let toastTimer;
function notify(message) {
  clearTimeout(toastTimer);
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toastTimer = setTimeout(() => (toast.textContent = ''), 3500);
}
document.getElementById('copy-email').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText('mail.deborajsarkar@gmail.com');
    notify('Email copied — say hello when you’re ready.');
  } catch {
    notify('Email: mail.deborajsarkar@gmail.com');
  }
});
const dialog = document.getElementById('case-dialog'),
  caseBody = document.getElementById('case-body');
let caseOpener;
document.querySelectorAll('[data-case]').forEach((button) =>
  button.addEventListener('click', () => {
    caseOpener = button;
  }),
);
dialog.addEventListener('close', () => caseOpener?.focus({ preventScroll: true }));
const routes = {
  portfolio: '#top',
  relay: 'relay-os/',
  nova: 'nova-os/',
  atlas: 'atlas-ops/',
  nila: 'nila-ledger/',
  aura: 'aura/',
  vanta: 'vanta/',
  rasa: 'rasa/',
};
const sourceDirectories = {
  portfolio: '',
  relay: 'relay-os',
  nova: 'nova-os',
  atlas: 'atlas-ops',
  nila: 'nila-ledger',
  aura: 'aura',
  vanta: 'vanta',
  rasa: 'rasa',
};
const sourceUrl = (id) =>
  'https://github.com/Debotaro/Debotaro.github.io' +
  (sourceDirectories[id] ? '/tree/main/' + sourceDirectories[id] : '');
const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );
const caseData = fetch('data/case-studies.json')
  .then((response) => {
    if (!response.ok) throw new Error('Case studies unavailable');
    return response.json();
  })
  .catch(() => null);
document.querySelectorAll('[data-case]').forEach((button) =>
  button.addEventListener('click', async () => {
    button.disabled = true;
    const cases = await caseData;
    button.disabled = false;
    const item = cases?.find((study) => study.id === button.dataset.case);
    if (!item) {
      notify('The case study could not load. Please refresh and try again.');
      return;
    }
    document.getElementById('case-category').textContent = item.category + ' / Case study';
    caseBody.innerHTML = `<h2 id="case-title">${escapeHtml(item.title)}</h2><p class="case-summary">${escapeHtml(item.summary)}</p><div class="tags">${item.stack.map((skill) => `<span>${escapeHtml(skill)}</span>`).join('')}</div><p class="case-role"><strong>Role & process</strong>${escapeHtml(item.role)}</p><div class="case-columns"><div><h3>The challenge</h3><p>${escapeHtml(item.challenge)}</p></div><div><h3>The approach</h3><p>${escapeHtml(item.approach)}</p></div></div><div class="case-highlights"><h3>What works</h3><ul>${item.highlights.map((highlight) => `<li>${escapeHtml(highlight)}</li>`).join('')}</ul></div><div class="verification"><h3>How it was checked</h3><p>${escapeHtml(item.validation)}</p></div><p class="case-limitations">${escapeHtml(item.limitations)}</p><div class="actions"><a class="button" href="${routes[item.id]}" ${item.id === 'portfolio' ? 'data-back-to-portfolio' : ''}>${item.id === 'portfolio' ? 'Back to portfolio' : 'Explore the demo'} <span class="arrow" aria-hidden="true">↗</span></a><a class="text-link" href="${sourceUrl(item.id)}" target="_blank" rel="noopener noreferrer">View source code ↗</a></div>`;
    dialog.showModal();
    dialog.scrollTop = 0;
    caseBody
      .querySelector('[data-back-to-portfolio]')
      ?.addEventListener('click', () => dialog.close());
  }),
);
document.getElementById('close-case').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) {
    const bounds = dialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      dialog.close();
  }
});
