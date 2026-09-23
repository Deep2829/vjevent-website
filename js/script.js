// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navMobile = document.getElementById('navMobile');

navToggle.addEventListener('click', () => {
  const isOpen = navMobile.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', isOpen);
});

navMobile.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navMobile.classList.remove('open'));
});

// Header background once the page has scrolled past the hero frame
const header = document.getElementById('siteHeader');
const setHeaderState = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
setHeaderState();
window.addEventListener('scroll', setHeaderState, { passive: true });

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// WhatsApp button — build link from the placeholder phone number shown in Contact
const WHATSAPP_PHONE = '91XXXXXXXXXX'; // TODO: replace with your real WhatsApp number, country code + number, no symbols
document.getElementById('whatsappBtn').href =
  `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent('Hi Vjevent! I would like to enquire about event decor.')}`;

// Quick Enquiry chat widget — a guided, scripted assistant (not a live/AI chat).
// It walks visitors through a few questions, then hands the answers to WhatsApp
// or pre-fills the contact form above. No server or API key involved.
(() => {
  const fab = document.getElementById('chatFabBtn');
  const panel = document.getElementById('chatPanel');
  const closeBtn = document.getElementById('chatCloseBtn');
  const messagesEl = document.getElementById('chatMessages');
  const inputArea = document.getElementById('chatInputArea');

  const EVENT_TYPES = ['Wedding', 'Pre-Wedding Function', 'Birthday / Celebration', 'Corporate Event', 'Something else'];
  const EVENT_TYPE_TO_FORM_OPTION = {
    'Wedding': 'Wedding',
    'Pre-Wedding Function': 'Pre-Wedding Function',
    'Birthday / Celebration': 'Birthday / Celebration',
    'Corporate Event': 'Corporate Event',
    'Something else': 'Other',
  };
  const TIMINGS = ['Within a month', '1–3 months', '3–6 months', 'Just exploring'];
  const BUDGETS = ['Under ₹20,000', '₹20,000 – 50,000', '₹50,000 – 1,00,000', 'Above ₹1,00,000', 'Not sure yet'];

  let started = false;
  let answers = {};

  function addMessage(text, sender) {
    const wrap = document.createElement('div');
    wrap.className = `chat-message ${sender}`;
    const who = document.createElement('span');
    who.className = 'who';
    who.textContent = sender === 'bot' ? 'Vjevent' : 'You';
    const body = document.createElement('p');
    body.textContent = text;
    wrap.append(who, body);
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // Renders quick-reply chips AND a free-text box — visitors can tap an
  // option or just type their own answer; both call onAnswer the same way.
  function renderStepControls(options, onAnswer) {
    inputArea.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'chat-options';
    options.forEach(option => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chat-chip';
      btn.textContent = option;
      btn.addEventListener('click', () => onAnswer(option));
      wrap.appendChild(btn);
    });
    inputArea.appendChild(wrap);

    const composer = document.createElement('form');
    composer.className = 'chat-composer';
    composer.innerHTML = `
      <input type="text" class="chat-text-input" placeholder="Or type your own answer" aria-label="Type your answer">
      <button type="submit" class="chat-send" aria-label="Send">&rarr;</button>
    `;
    composer.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = composer.querySelector('.chat-text-input');
      const val = input.value.trim();
      if (!val) return;
      onAnswer(val);
    });
    inputArea.appendChild(composer);
    composer.querySelector('.chat-text-input').focus();
  }

  function askEventType() {
    addMessage("Hi! I can help get your enquiry to us quickly. What are you planning?", 'bot');
    renderStepControls(EVENT_TYPES, (choice) => {
      answers.eventType = choice;
      addMessage(choice, 'user');
      askTiming();
    });
  }

  function askTiming() {
    addMessage('Lovely. Roughly when is the event?', 'bot');
    renderStepControls(TIMINGS, (choice) => {
      answers.timing = choice;
      addMessage(choice, 'user');
      askBudget();
    });
  }

  function askBudget() {
    addMessage("And what's a comfortable budget range?", 'bot');
    renderStepControls(BUDGETS, (choice) => {
      answers.budget = choice;
      addMessage(choice, 'user');
      askContact();
    });
  }

  function askContact() {
    addMessage('Last thing — how should we reach you?', 'bot');
    inputArea.innerHTML = '';
    const form = document.createElement('form');
    form.className = 'chat-contact-form';
    form.innerHTML = `
      <input type="text" id="chatName" placeholder="Your name" autocomplete="name" required>
      <input type="tel" id="chatPhone" placeholder="Phone number" autocomplete="tel" required>
      <p class="chat-error" id="chatContactError"></p>
      <button type="submit" class="btn btn-primary">Continue</button>
    `;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.querySelector('#chatName').value.trim();
      const phone = form.querySelector('#chatPhone').value.trim();
      const error = form.querySelector('#chatContactError');
      if (!name || !phone) {
        error.textContent = 'Please add both your name and phone number.';
        return;
      }
      answers.name = name;
      answers.phone = phone;
      addMessage(`${name} — ${phone}`, 'user');
      finish();
    });
    inputArea.appendChild(form);
  }

  function buildSummary() {
    let summary = `Hi Vjevent! I would like to enquire about a ${answers.eventType}. `
      + `Timing: ${answers.timing}. Budget: ${answers.budget}. `
      + `Name: ${answers.name}, Phone: ${answers.phone}.`;
    if (answers.notes) summary += ` Notes: ${answers.notes}`;
    return summary;
  }

  function finish() {
    addMessage("Thank you! Anything else you'd like to add before I send this along?", 'bot');
    inputArea.innerHTML = '';

    const notesWrap = document.createElement('div');
    notesWrap.className = 'chat-notes';
    notesWrap.innerHTML = `
      <label for="chatNotes" class="chat-notes-label">Additional notes (optional)</label>
      <textarea id="chatNotes" rows="2" placeholder="Type here..."></textarea>
    `;
    notesWrap.querySelector('#chatNotes').addEventListener('input', (e) => {
      answers.notes = e.target.value.trim();
    });
    inputArea.appendChild(notesWrap);

    const actions = document.createElement('div');
    actions.className = 'chat-actions';

    const whatsappBtn = document.createElement('a');
    whatsappBtn.className = 'btn btn-outline';
    whatsappBtn.target = '_blank';
    whatsappBtn.rel = 'noopener';
    whatsappBtn.textContent = 'Send on WhatsApp';
    whatsappBtn.href = '#';
    whatsappBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const url = `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(buildSummary())}`;
      window.open(url, '_blank', 'noopener');
    });

    const formBtn = document.createElement('button');
    formBtn.type = 'button';
    formBtn.className = 'btn btn-primary';
    formBtn.textContent = 'Fill the form below';
    formBtn.addEventListener('click', () => {
      const typeSelect = document.getElementById('f-type');
      const mapped = EVENT_TYPE_TO_FORM_OPTION[answers.eventType] || 'Other';
      for (const opt of typeSelect.options) {
        if (opt.value === mapped) { typeSelect.value = mapped; break; }
      }
      document.getElementById('f-name').value = answers.name;
      document.getElementById('f-phone').value = answers.phone;
      document.getElementById('f-message').value =
        `Timing: ${answers.timing}. Budget: ${answers.budget}.`
        + (answers.notes ? ` Notes: ${answers.notes}` : '');
      closePanel();
      const contactSection = document.getElementById('contact');
      contactSection.scrollIntoView({ behavior: 'smooth' });
      document.getElementById('f-message').focus();
    });

    const restart = document.createElement('button');
    restart.type = 'button';
    restart.className = 'chat-restart';
    restart.textContent = 'Start over';
    restart.addEventListener('click', () => {
      answers = {};
      messagesEl.innerHTML = '';
      askEventType();
    });

    actions.append(whatsappBtn, formBtn, restart);
    inputArea.appendChild(actions);
  }

  function openPanel() {
    panel.hidden = false;
    fab.setAttribute('aria-expanded', 'true');
    if (!started) {
      started = true;
      askEventType();
    }
    closeBtn.focus();
  }

  function closePanel() {
    panel.hidden = true;
    fab.setAttribute('aria-expanded', 'false');
    fab.focus();
  }

  fab.addEventListener('click', () => {
    if (panel.hidden) openPanel(); else closePanel();
  });
  closeBtn.addEventListener('click', closePanel);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) closePanel();
  });
})();

// Contact form — client-side validation only (no backend wired up yet)
const form = document.getElementById('contactForm');
const formError = document.getElementById('formError');
const formNote = document.getElementById('formNote');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = form.elements.name.value.trim();
  const phone = form.elements.phone.value.trim();

  if (!name || !phone) {
    formError.textContent = 'Please add your name and phone number so we can reach you.';
    formError.hidden = false;
    formNote.textContent = '';
    return;
  }

  formError.hidden = true;
  formNote.textContent = "Thanks! This form isn't connected to email/storage yet — see the setup note in js/script.js.";
});

// Appointment form — same client-side-only validation pattern as Contact
const appointmentForm = document.getElementById('appointmentForm');
const appointmentError = document.getElementById('appointmentError');
const appointmentNote = document.getElementById('appointmentNote');

appointmentForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = appointmentForm.elements.name.value.trim();
  const phone = appointmentForm.elements.phone.value.trim();
  const date = appointmentForm.elements.date.value;

  if (!name || !phone || !date) {
    appointmentError.textContent = 'Please add your name, phone number and a preferred date.';
    appointmentError.hidden = false;
    appointmentNote.textContent = '';
    return;
  }

  appointmentError.hidden = true;
  appointmentNote.textContent = "Thanks! This form isn't connected to email/storage yet — see the setup note in js/script.js.";
});
