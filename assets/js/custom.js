/* =========================================================
   11 LD – JavaScript formos (contact.html)
   Privaloma dalis: duomenų surinkimas, išvedimas, vidurkis,
                    neaktyvus „Siųsti“ mygtukas.
   Papildoma dalis: validacija realiu laiku, telefono numerio
                    formatavimas, „Išvalyti“ mygtukas.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const submitBtn = document.getElementById('submitBtn');
  const clearBtn = document.getElementById('clearBtn');
  const resultBox = document.getElementById('formResult');
  const resultList = document.getElementById('resultList');
  const resultAverage = document.getElementById('resultAverage');
  const phoneInput = form.elements.telefonas;

  // Laukų pavadinimai, rodomi rezultatų bloke
  const LABELS = {
    vardas: 'Vardas',
    pavarde: 'Pavardė',
    email: 'El. paštas',
    telefonas: 'Tel. numeris',
    adresas: 'Adresas',
    q1: 'Dizaino įvertinimas',
    q2: 'Turinio įvertinimas',
    q3: 'Rekomendacijos įvertinimas',
  };

  /* ---------------- Validacijos taisyklės ---------------- */

  const LETTERS_ONLY = /^\p{L}+$/u;                    // tik raidės (ir lietuviškos)
  const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_FORMAT = /^\+370 6\d{2} \d{5}$/;         // +370 6xx xxxxx

  const validateName = (what) => (value) => {
    if (value === '') return `Įveskite ${what}.`;
    if (!LETTERS_ONLY.test(value)) return `${what[0].toUpperCase() + what.slice(1)} gali sudaryti tik raidės.`;
    return '';
  };

  const validateRating = (value, input) => {
    if (input.validity.badInput) return 'Įveskite skaičių nuo 1 iki 10.';
    if (value === '') return 'Įveskite įvertinimą.';
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1 || n > 10) return 'Vertė turi būti sveikasis skaičius nuo 1 iki 10.';
    return '';
  };

  // Kiekvienam laukui – funkcija, grąžinanti klaidos tekstą ('' – klaidos nėra)
  const validators = {
    vardas: validateName('vardą'),
    pavarde: validateName('pavardę'),
    email: (v) => {
      if (v === '') return 'Įveskite el. pašto adresą.';
      if (!EMAIL_FORMAT.test(v)) return 'Neteisingas el. pašto formatas (pvz. vardenis@mail.lt).';
      return '';
    },
    telefonas: (v) => {
      if (v === '') return 'Įveskite telefono numerį.';
      if (!PHONE_FORMAT.test(v)) return 'Numeris turi atitikti formatą +370 6xx xxxxx.';
      return '';
    },
    adresas: (v) => (v === '' ? 'Įveskite adresą.' : ''),
    q1: validateRating,
    q2: validateRating,
    q3: validateRating,
  };

  const fieldNames = Object.keys(validators);
  const touched = new Set(); // laukai, su kuriais vartotojas jau sąveikavo

  const getValue = (name) => form.elements[name].value.trim();
  const getError = (name) => validators[name](getValue(name), form.elements[name]);
  const isFormValid = () => fieldNames.every((name) => getError(name) === '');

  // Klaidos rodymas po lauku + raudonas / žalias rėmelis
  function showFieldState(name) {
    const input = form.elements[name];
    const errorEl = document.getElementById(`${name}-error`);
    const error = getError(name);

    if (!touched.has(name)) return;

    errorEl.textContent = error;
    input.classList.toggle('field-invalid', error !== '');
    input.classList.toggle('field-valid', error === '');
    input.setAttribute('aria-invalid', String(error !== ''));
  }

  // „Siųsti“ aktyvus tik kai visi laukai užpildyti ir be klaidų
  function updateSubmitState() {
    submitBtn.disabled = !isFormValid();
  }

  /* ---------------- Telefono numerio formatavimas ---------------- */

  // Iš bet kokio teksto suformuoja „+370 6xx xxxxx“
  function formatPhone(raw) {
    let digits = raw.replace(/\D/g, '');

    if (raw.trim().startsWith('+') || digits.startsWith('370')) {
      digits = digits.replace(/^370/, '');   // šalies kodas jau yra
    } else if (digits.startsWith('8')) {
      digits = digits.slice(1);              // vietinis formatas 86xxxxxxx
    }

    digits = digits.slice(0, 8);             // ilgio apribojimas: 8 skaitmenys po +370
    if (digits === '') return '';

    let formatted = '+370 ' + digits.slice(0, 3);
    if (digits.length > 3) formatted += ' ' + digits.slice(3);
    return formatted;
  }

  // Leidžiama įvesti tik skaitmenis
  phoneInput.addEventListener('beforeinput', (e) => {
    if (e.inputType === 'insertText' && e.data && /\D/.test(e.data)) {
      e.preventDefault();
    }
  });

  function applyPhoneFormat() {
    const raw = phoneInput.value;
    const caret = phoneInput.selectionStart ?? raw.length;
    const digitsBeforeCaret = raw.slice(0, caret).replace(/\D/g, '').length;
    const formatted = formatPhone(raw);

    if (formatted === raw) return;
    phoneInput.value = formatted;

    // Žymeklį paliekame po to paties skaitmens (jei redaguojama numerio viduryje)
    let pos = formatted.length;
    if (raw.startsWith('+370') && caret < raw.length) {
      let seen = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) seen++;
        if (seen === digitsBeforeCaret) { pos = i + 1; break; }
      }
    }
    phoneInput.setSelectionRange(pos, pos);
  }

  /* ---------------- Įvykiai: validacija realiu laiku ---------------- */

  form.addEventListener('input', (e) => {
    const name = e.target.name;
    if (!validators[name]) return;

    if (e.target === phoneInput) applyPhoneFormat();

    touched.add(name);
    showFieldState(name);
    updateSubmitState();
  });

  // Palikus lauką tuščią – iškart parodoma klaida
  form.addEventListener('focusout', (e) => {
    const name = e.target.name;
    if (!validators[name]) return;
    touched.add(name);
    showFieldState(name);
  });

  /* ---------------- Formos pateikimas ---------------- */

  form.addEventListener('submit', (e) => {
    e.preventDefault(); // puslapis neperkraunamas

    if (!isFormValid()) {
      fieldNames.forEach((name) => { touched.add(name); showFieldState(name); });
      updateSubmitState();
      return;
    }

    // Visų laukų vertės – viename objekte
    const formData = {
      vardas: getValue('vardas'),
      pavarde: getValue('pavarde'),
      email: getValue('email'),
      telefonas: getValue('telefonas'),
      adresas: getValue('adresas'),
      q1: Number(getValue('q1')),
      q2: Number(getValue('q2')),
      q3: Number(getValue('q3')),
    };

    console.log('Formos duomenys:', formData);

    // Vertinimų vidurkis
    const average = (formData.q1 + formData.q2 + formData.q3) / 3;
    const averageText = Number(average.toFixed(2)).toString();
    console.log(`${formData.vardas} ${formData.pavarde}: ${averageText}`);

    renderResult(formData, averageText, average);
  });

  function renderResult(data, averageText, average) {
    resultList.replaceChildren();

    Object.entries(data).forEach(([key, value]) => {
      const row = document.createElement('p');
      const label = document.createElement('strong');
      label.textContent = `${LABELS[key]}: `;
      row.append(label, String(value));
      resultList.append(row);
    });

    // Formatas: Vardas Pavardė: vidurkis
    resultAverage.replaceChildren();
    const who = document.createElement('span');
    who.textContent = `${data.vardas} ${data.pavarde}: `;
    const score = document.createElement('span');
    score.className = 'average-score';
    score.textContent = averageText;
    score.dataset.level = average >= 7 ? 'high' : average >= 4 ? 'mid' : 'low';
    resultAverage.append(who, score);

    resultBox.hidden = false;
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ---------------- „Išvalyti“ mygtukas ---------------- */

  clearBtn.addEventListener('click', () => {
    form.reset();
    touched.clear();

    fieldNames.forEach((name) => {
      const input = form.elements[name];
      input.classList.remove('field-invalid', 'field-valid');
      input.removeAttribute('aria-invalid');
      document.getElementById(`${name}-error`).textContent = '';
    });

    resultList.replaceChildren();
    resultAverage.replaceChildren();
    resultBox.hidden = true;

    updateSubmitState();
    form.elements.vardas.focus();
  });

  updateSubmitState();
});
