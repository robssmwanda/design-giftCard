(function () {
  'use strict';

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

  function showError(id, msg) {
    var el = $('[data-error-for="' + id + '"]');
    if (el) { el.textContent = msg; el.classList.add('visible'); }
    var input = $('#' + id);
    if (input) input.classList.add('has-error');
  }
  function clearError(id) {
    var el = $('[data-error-for="' + id + '"]');
    if (el) { el.textContent = ''; el.classList.remove('visible'); }
    var input = $('#' + id);
    if (input) input.classList.remove('has-error');
  }
  function clearAllErrors(form) {
    $all('.auth-error', form).forEach(function (e) { e.classList.remove('visible'); e.textContent = ''; });
    $all('.has-error', form).forEach(function (e) { e.classList.remove('has-error'); });
  }

  function setButtonLoading(btnId, loading) {
    var btn = $('#' + btnId);
    if (!btn) return;
    var text = btn.querySelector('.auth-btn-text');
    var spinner = btn.querySelector('.auth-btn-spinner');
    if (loading) {
      btn.disabled = true;
      if (text) text.style.display = 'none';
      if (spinner) spinner.style.display = 'flex';
    } else {
      btn.disabled = false;
      if (text) text.style.display = '';
      if (spinner) spinner.style.display = 'none';
    }
  }

  function normalizeDialCode(val) {
    val = val.replace(/[^(0-9+]/g, '');
    if (val && val.charAt(0) !== '+') val = '+' + val;
    return val.slice(0, 4);
  }
  function getDialCode() {
    var input = $('#reset-dial-code');
    if (!input) return '+1';
    var val = input.value.trim();
    if (!val) return '+1';
    if (val.charAt(0) !== '+') val = '+' + val;
    return val;
  }
  function formatPhone(digits) {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return digits.slice(0, 3) + ' ' + digits.slice(3);
    return digits.slice(0, 3) + ' ' + digits.slice(3, 6) + ' ' + digits.slice(6, 10);
  }

  // ── Step management ──────────────────────────────────────
  var stepIds = ['reset-step-email', 'reset-step-email-otp', 'reset-step-phone', 'reset-step-phone-otp', 'reset-step-password', 'reset-step-success'];
  var currentStep = 1;
  var resetState = { email: '', phone: '', dialCode: '', emailVerified: false, phoneVerified: false };

  function showStep(n) {
    currentStep = n;
    stepIds.forEach(function (id, i) {
      var el = $('#' + id);
      if (el) el.style.display = (i === n - 1) ? '' : 'none';
    });
    updateProgress(n);
  }

  function updateProgress(n) {
    var steps = $all('.reset-progress-step');
    steps.forEach(function (s) {
      var stepNum = parseInt(s.getAttribute('data-step'), 10);
      s.classList.remove('active', 'completed');
      if (stepNum < n) s.classList.add('completed');
      else if (stepNum === n) s.classList.add('active');
    });
  }

  // ── Countdown helper ─────────────────────────────────────
  function startCountdown(btn, prefix) {
    var seconds = 60;
    btn.disabled = true;
    btn.textContent = prefix + seconds + 's';
    btn.classList.add('opacity-60', 'cursor-not-allowed');
    var interval = setInterval(function () {
      seconds--;
      if (seconds <= 0) {
        clearInterval(interval);
        btn.disabled = false;
        btn.textContent = 'Resend code';
        btn.classList.remove('opacity-60', 'cursor-not-allowed');
      } else {
        btn.textContent = prefix + seconds + 's';
      }
    }, 1000);
    return interval;
  }

  // ── OTP input helper ─────────────────────────────────────
  function setupOtpInputs(selector) {
    var inputs = $all(selector);
    inputs.forEach(function (input, idx) {
      input.addEventListener('input', function () {
        input.value = input.value.replace(/\D/g, '').slice(0, 1);
        if (input.value && idx < inputs.length - 1) inputs[idx + 1].focus();
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !input.value && idx > 0) inputs[idx - 1].focus();
      });
      input.addEventListener('paste', function (e) {
        e.preventDefault();
        var pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
        for (var i = 0; i < inputs.length && i < pasted.length; i++) inputs[i].value = pasted[i];
        if (pasted.length < inputs.length) inputs[pasted.length].focus();
        else inputs[inputs.length - 1].focus();
      });
    });
    return inputs;
  }

  // ── Country dropdown ─────────────────────────────────────
  function setupCountryDropdown(prefix) {
    var wrap = $('#' + prefix + '-country-wrap');
    var trigger = $('#' + prefix + '-country');
    var menu = $('#' + prefix + '-country-menu');
    var textEl = $('#' + prefix + '-country-text');
    var valueEl = $('#' + prefix + '-country-value');
    var optionsEl = $('#' + prefix + '-country-options');
    var searchEl = $('#' + prefix + '-country-search');
    var dialInput = $('#reset-dial-code');

    if (!optionsEl || !window.COUNTRIES) return;

    window.COUNTRIES.forEach(function (c) {
      var div = document.createElement('div');
      div.className = 'country-option';
      div.setAttribute('role', 'option');
      div.setAttribute('data-dial', c.dial);
      div.setAttribute('data-name', c.name.toLowerCase());
      div.innerHTML =
        '<span class="country-option-flag">' + c.flag + '</span>' +
        '<span class="country-option-name">' + c.name + '</span>' +
        '<span class="country-option-dial">' + c.dial + '</span>';
      div.addEventListener('click', function () {
        if (textEl) { textEl.textContent = c.flag + '  ' + c.name + ' (' + c.dial + ')'; textEl.classList.add('has-value'); }
        if (valueEl) valueEl.value = c.dial;
        if (dialInput) dialInput.value = c.dial;
        $all('.country-option', optionsEl).forEach(function (o) { o.classList.remove('selected'); });
        div.classList.add('selected');
        closeMenu();
        clearError(prefix + '-country');
      });
      optionsEl.appendChild(div);
    });

    function openMenu() {
      menu.classList.add('open');
      trigger.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
      if (searchEl) { searchEl.value = ''; filterCountries(''); setTimeout(function () { searchEl.focus(); }, 50); }
    }
    function closeMenu() {
      menu.classList.remove('open');
      trigger.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    }
    function filterCountries(q) {
      var query = q.toLowerCase().trim();
      var opts = $all('.country-option', optionsEl);
      var anyMatch = false;
      opts.forEach(function (o) {
        if (o.classList.contains('no-match')) { o.style.display = 'none'; return; }
        var name = o.getAttribute('data-name') || '';
        var dial = o.getAttribute('data-dial') || '';
        var match = !query || name.indexOf(query) !== -1 || dial.indexOf(query) !== -1;
        o.style.display = match ? '' : 'none';
        if (match) anyMatch = true;
      });
      var noMatch = $('.country-option.no-match', optionsEl);
      if (!anyMatch) {
        if (!noMatch) { noMatch = document.createElement('div'); noMatch.className = 'country-option no-match'; noMatch.textContent = 'No countries found'; optionsEl.appendChild(noMatch); }
        noMatch.style.display = '';
      } else if (noMatch) noMatch.style.display = 'none';
    }

    if (trigger) trigger.addEventListener('click', function (e) { e.preventDefault(); if (menu.classList.contains('open')) closeMenu(); else openMenu(); });
    if (searchEl) {
      searchEl.addEventListener('input', function () { filterCountries(searchEl.value); });
      searchEl.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    }
    document.addEventListener('click', function (e) { if (wrap && !wrap.contains(e.target)) closeMenu(); });
  }

  // ── Password visibility toggle ───────────────────────────
  $all('.auth-toggle-password').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var targetId = btn.getAttribute('data-toggle');
      var input = $('#' + targetId);
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ink-400"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
      } else {
        input.type = 'password';
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ink-400"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>';
      }
    });
  });

  // ── Step 1: Enter email ──────────────────────────────────
  var emailForm = $('#reset-email-form');
  if (emailForm) {
    emailForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearAllErrors(emailForm);
      var email = $('#reset-email').value.trim();
      var valid = true;

      if (!email) { showError('reset-email', 'Please enter your email address.'); valid = false; }
      else if (!isValidEmail(email)) { showError('reset-email', 'Please enter a valid email address.'); valid = false; }

      if (!valid) return;

      setButtonLoading('reset-email-submit', true);
      resetState.email = email;

      setTimeout(function () {
        var display = $('#reset-email-display');
        if (display) display.textContent = email;
        showStep(2);
        setButtonLoading('reset-email-submit', false);
        startEmailResendCountdown();
        var firstInput = $('[data-reseotp="0"]');
        if (firstInput) firstInput.focus();
      }, 1200);
    });

    var emailInput = $('#reset-email');
    if (emailInput) emailInput.addEventListener('input', function () { clearError('reset-email'); });
  }

  // ── Step 2: Verify email OTP ─────────────────────────────
  var emailOtpInputs = setupOtpInputs('[data-reseotp]');
  var emailResendBtn = $('#reset-email-resend');
  var emailCountdownInterval = null;

  function startEmailResendCountdown() {
    if (emailCountdownInterval) clearInterval(emailCountdownInterval);
    emailCountdownInterval = startCountdown(emailResendBtn, 'Resend code in ');
  }
  if (emailResendBtn) emailResendBtn.addEventListener('click', function () { if (!emailResendBtn.disabled) startEmailResendCountdown(); });

  var emailOtpForm = $('#reset-email-otp-form');
  if (emailOtpForm) {
    emailOtpForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var code = emailOtpInputs.map(function (i) { return i.value; }).join('');
      var errorEl = $('[data-error-for="reset-email-otp"]');
      emailOtpInputs.forEach(function (i) { i.classList.remove('has-error'); });
      if (errorEl) { errorEl.classList.remove('visible'); errorEl.textContent = ''; }

      if (code.length !== 6) {
        emailOtpInputs.forEach(function (i) { i.classList.add('has-error'); });
        if (errorEl) { errorEl.textContent = 'Please enter the 6-digit code.'; errorEl.classList.add('visible'); }
        return;
      }

      setButtonLoading('reset-email-otp-submit', true);
      setTimeout(function () {
        resetState.emailVerified = true;
        showStep(3);
        setButtonLoading('reset-email-otp-submit', false);
      }, 1200);
    });
  }

  // ── Step 3: Enter phone number ───────────────────────────
  setupCountryDropdown('reset');

  var phoneForm = $('#reset-phone-form');
  if (phoneForm) {
    var dialInput = $('#reset-dial-code');
    if (dialInput) dialInput.addEventListener('input', function () { dialInput.value = normalizeDialCode(dialInput.value); });

    var phoneInputEl = $('#reset-phone');
    if (phoneInputEl) phoneInputEl.addEventListener('input', function () {
      var digits = phoneInputEl.value.replace(/\D/g, '').slice(0, 10);
      phoneInputEl.value = formatPhone(digits);
    });

    phoneForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearAllErrors(phoneForm);
      var phone = $('#reset-phone').value.trim();
      var countryVal = $('#reset-country-value');
      var dialCode = getDialCode();
      var phoneDigits = phone.replace(/\D/g, '');
      var valid = true;

      if (!countryVal || !countryVal.value) { showError('reset-country', 'Please select your country.'); valid = false; }
      if (!dialCode || dialCode === '+') { showError('reset-dial-code', 'Please enter a country code.'); valid = false; }
      if (!phone) { showError('reset-phone', 'Please enter your phone number.'); valid = false; }
      else if (phoneDigits.length < 7 || phoneDigits.length > 15) { showError('reset-phone', 'Please enter a valid phone number.'); valid = false; }

      if (!valid) return;

      setButtonLoading('reset-phone-submit', true);
      resetState.dialCode = dialCode;
      resetState.phone = dialCode + ' ' + phone;

      setTimeout(function () {
        var display = $('#reset-phone-display');
        if (display) display.textContent = resetState.phone;
        showStep(4);
        setButtonLoading('reset-phone-submit', false);
        startPhoneResendCountdown();
        var firstInput = $('[data-respotp="0"]');
        if (firstInput) firstInput.focus();
      }, 1200);
    });

    if (phoneInputEl && dialInput) {
      phoneInputEl.addEventListener('input', function () { clearError('reset-dial-code'); });
    }
  }

  // ── Step 4: Verify phone OTP ─────────────────────────────
  var phoneOtpInputs = setupOtpInputs('[data-respotp]');
  var phoneResendBtn = $('#reset-phone-resend');
  var phoneCountdownInterval = null;

  function startPhoneResendCountdown() {
    if (phoneCountdownInterval) clearInterval(phoneCountdownInterval);
    phoneCountdownInterval = startCountdown(phoneResendBtn, 'Resend code in ');
  }
  if (phoneResendBtn) phoneResendBtn.addEventListener('click', function () { if (!phoneResendBtn.disabled) startPhoneResendCountdown(); });

  var phoneOtpForm = $('#reset-phone-otp-form');
  if (phoneOtpForm) {
    phoneOtpForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var code = phoneOtpInputs.map(function (i) { return i.value; }).join('');
      var errorEl = $('[data-error-for="reset-phone-otp"]');
      phoneOtpInputs.forEach(function (i) { i.classList.remove('has-error'); });
      if (errorEl) { errorEl.classList.remove('visible'); errorEl.textContent = ''; }

      if (code.length !== 6) {
        phoneOtpInputs.forEach(function (i) { i.classList.add('has-error'); });
        if (errorEl) { errorEl.textContent = 'Please enter the 6-digit code.'; errorEl.classList.add('visible'); }
        return;
      }

      setButtonLoading('reset-phone-otp-submit', true);
      setTimeout(function () {
        resetState.phoneVerified = true;
        showStep(5);
        setButtonLoading('reset-phone-otp-submit', false);
        var pwInput = $('#reset-new-password');
        if (pwInput) pwInput.focus();
      }, 1200);
    });
  }

  // ── Step 5: Change password ─────────────────────────────
  var passwordForm = $('#reset-password-form');
  if (passwordForm) {
    var newPwInput = $('#reset-new-password');
    var confirmPwInput = $('#reset-confirm-password');

    // Password strength + requirements
    if (newPwInput) {
      newPwInput.addEventListener('input', function () {
        var val = newPwInput.value;
        var strength = 0;
        if (val.length >= 8) strength++;
        if (/[A-Z]/.test(val) && /[a-z]/.test(val)) strength++;
        if (/\d/.test(val)) strength++;
        if (/[^A-Za-z0-9]/.test(val)) strength++;

        var bars = $all('.auth-strength-bar');
        var label = $('.auth-strength-label');
        bars.forEach(function (b) { b.classList.remove('weak', 'medium', 'strong'); });
        if (val.length === 0) { if (label) label.textContent = ''; return; }
        if (strength <= 1) { if (bars[0]) bars[0].classList.add('weak'); if (label) label.textContent = 'Weak password'; }
        else if (strength <= 2) { if (bars[0]) bars[0].classList.add('medium'); if (bars[1]) bars[1].classList.add('medium'); if (label) label.textContent = 'Medium strength'; }
        else { bars.forEach(function (b) { b.classList.add('strong'); }); if (label) label.textContent = 'Strong password'; }

        // Update requirement checks
        var reqLength = $('[data-req="length"]');
        var reqUpper = $('[data-req="upper"]');
        var reqLower = $('[data-req="lower"]');
        var reqNumber = $('[data-req="number"]');
        if (reqLength) reqLength.classList.toggle('met', val.length >= 8);
        if (reqUpper) reqUpper.classList.toggle('met', /[A-Z]/.test(val));
        if (reqLower) reqLower.classList.toggle('met', /[a-z]/.test(val));
        if (reqNumber) reqNumber.classList.toggle('met', /\d/.test(val));

        clearError('reset-new-password');
      });
    }

    if (confirmPwInput) confirmPwInput.addEventListener('input', function () { clearError('reset-confirm-password'); });

    passwordForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearAllErrors(passwordForm);
      var newPw = newPwInput.value;
      var confirmPw = confirmPwInput.value;
      var valid = true;

      if (!newPw) { showError('reset-new-password', 'Please enter a new password.'); valid = false; }
      else if (newPw.length < 8) { showError('reset-new-password', 'Password must be at least 8 characters.'); valid = false; }
      else if (!/[A-Z]/.test(newPw)) { showError('reset-new-password', 'Password must include an uppercase letter.'); valid = false; }
      else if (!/[a-z]/.test(newPw)) { showError('reset-new-password', 'Password must include a lowercase letter.'); valid = false; }
      else if (!/\d/.test(newPw)) { showError('reset-new-password', 'Password must include a number.'); valid = false; }

      if (!confirmPw) { showError('reset-confirm-password', 'Please confirm your new password.'); valid = false; }
      else if (newPw !== confirmPw) { showError('reset-confirm-password', 'Passwords do not match.'); valid = false; }

      if (!valid) return;

      setButtonLoading('reset-password-submit', true);
      setTimeout(function () {
        showStep(6);
        setButtonLoading('reset-password-submit', false);
      }, 1200);
    });
  }

  // Initialize at step 1
  showStep(1);
})();
