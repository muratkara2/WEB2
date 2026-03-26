const modal = document.querySelector('.site-modal');
const modalDialog = modal?.querySelector('.site-modal__dialog');
const modalTitle = modal?.querySelector('#site-modal-title');
const modalDescription = modal?.querySelector('#site-modal-description');
const modalFrame = modal?.querySelector('iframe');
const closeTargets = document.querySelectorAll('[data-close-modal]');
const siteTriggers = document.querySelectorAll('.site-trigger:not(.info-trigger)');
let lastTrigger = null;

const infoModal = document.querySelector('.info-modal');
const infoDialog = infoModal?.querySelector('.info-modal__dialog');
const infoTitle = infoModal?.querySelector('#info-modal-title');
const infoDescription = infoModal?.querySelector('#info-modal-description');
const infoList = infoModal?.querySelector('#info-modal-list');
const infoCode = infoModal?.querySelector('#info-modal-code');
const infoDemo = infoModal?.querySelector('#info-modal-demo');
const infoCloseTargets = document.querySelectorAll('[data-close-info]');
const infoTriggers = document.querySelectorAll('.info-trigger');
let lastInfoTrigger = null;

const codeExamples = {
  'web-tasarim': `<!DOCTYPE html>
<section class="hero">
  <h1>Dogru Hiyerarsi</h1>
  <p>Kullanici once basligi, sonra faydayi, sonra eylemi gorur.</p>
  <a class="cta" href="#">Hemen Basla</a>
</section>`,
  teknolojiler: `<main class="stack">
  <button id="tema">Temayi Degistir</button>
</main>

<style>
  .acik { background: #f4f7ff; color: #1e1f2d; }
  .koyu { background: #181a29; color: #f8f9ff; }
</style>

<script>
  document.getElementById('tema').onclick = () => {
    document.body.classList.toggle('koyu');
  };
<\/script>`,
  'frontend-calisma': `<button id="sayacBtn">Artir</button>
<p id="sayac">0</p>

<script>
  let deger = 0;
  const btn = document.getElementById('sayacBtn');
  const alan = document.getElementById('sayac');
  btn.addEventListener('click', () => {
    deger += 1;
    alan.textContent = deger;
  });
<\/script>`
};

const openModal = ({ title, description, src }) => {
  if (!modal || !modalDialog || !modalTitle || !modalDescription || !modalFrame) return;
  modalTitle.textContent = title;
  modalDescription.textContent = description;
  modalFrame.src = src || '';
  modal.classList.add('is-active');
  document.body.classList.add('modal-open');
  modal.setAttribute('aria-hidden', 'false');
  modalDialog.focus();
};

const closeModal = () => {
  if (!modal || !modalFrame) return;
  modal.classList.remove('is-active');
  modal.setAttribute('aria-hidden', 'true');
  modalFrame.src = '';
  if (!infoModal?.classList.contains('is-active')) {
    document.body.classList.remove('modal-open');
  }
  if (lastTrigger) {
    lastTrigger.focus();
    lastTrigger = null;
  }
};

siteTriggers.forEach((button) => {
  button.addEventListener('click', () => {
    lastTrigger = button;
    const payload = {
      title: button.dataset.title || 'Örnek proje',
      description: button.dataset.description || '',
      src: button.dataset.src || ''
    };
    openModal(payload);
  });
});

closeTargets.forEach((target) => target.addEventListener('click', closeModal));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeModal();
    closeInfoModal();
  }
});

const openInfoModal = ({ title, description, topics, code, demo }) => {
  if (!infoModal || !infoDialog || !infoTitle || !infoDescription || !infoList || !infoCode || !infoDemo) return;
  infoTitle.textContent = title;
  infoDescription.textContent = description;
  infoList.innerHTML = '';
  infoCode.textContent = code;
  infoDemo.src = demo;

  topics.forEach((topic) => {
    const li = document.createElement('li');
    li.textContent = topic;
    infoList.appendChild(li);
  });

  infoModal.classList.add('is-active');
  document.body.classList.add('modal-open');
  infoModal.setAttribute('aria-hidden', 'false');
  infoDialog.focus();
};

const closeInfoModal = () => {
  if (!infoModal || !infoDemo) return;
  infoModal.classList.remove('is-active');
  infoModal.setAttribute('aria-hidden', 'true');
  infoDemo.src = '';
  if (!modal?.classList.contains('is-active')) {
    document.body.classList.remove('modal-open');
  }
  if (lastInfoTrigger) {
    lastInfoTrigger.focus();
    lastInfoTrigger = null;
  }
};

infoTriggers.forEach((button) => {
  button.addEventListener('click', () => {
    lastInfoTrigger = button;
    const topicsRaw = button.dataset.topics || '';
    const topics = topicsRaw
      .split('|')
      .map((item) => item.trim())
      .filter(Boolean);
    const payload = {
      title: button.dataset.title || 'Bilgi kartı',
      description: button.dataset.description || '',
      topics: topics.length ? topics : ['Detay bulunamadı.'],
      code: codeExamples[button.dataset.codeKey || ''] || '<!-- Kod ornegi bulunamadi -->',
      demo: button.dataset.demo || ''
    };
    openInfoModal(payload);
  });
});

infoCloseTargets.forEach((target) => target.addEventListener('click', closeInfoModal));
