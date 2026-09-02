(function () {
  'use strict';

  // ── Helpers ─────────────────────────────────────────────
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function showError(inputId, message) {
    var input = $('#' + inputId);
    var errorEl = $('[data-error-for="' + inputId + '"]');
    if (input) input.classList.add('has-error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
    }
  }

  function clearError(inputId) {
    var input = $('#' + inputId);
    var errorEl = $('[data-error-for="' + inputId + '"]');
    if (input) input.classList.remove('has-error');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
  }

  function clearAllErrors(form) {
    $all('.auth-error', form).forEach(function (el) {
      el.classList.remove('visible');
      el.textContent = '';
    });
    $all('.has-error', form).forEach(function (el) {
      el.classList.remove('has-error');
    });
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function getDialCode() {
    var input = $('#su-dial-code');
    if (!input) return '+1';
    var val = input.value.trim();
    if (!val) return '+1';
    if (val.charAt(0) !== '+') val = '+' + val;
    return val;
  }

  function normalizeDialCode(val) {
    val = val.replace(/[^(0-9+]/g, '');
    if (val && val.charAt(0) !== '+') val = '+' + val;
    return val.slice(0, 4);
  }

  function formatPhone(digits, dialCode) {
    // Basic formatting: group digits
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return digits.slice(0, 3) + ' ' + digits.slice(3);
    return digits.slice(0, 3) + ' ' + digits.slice(3, 6) + ' ' + digits.slice(6, 10);
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

  // ── Password visibility toggle ──────────────────────────
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

  // ── Login form ──────────────────────────────────────────
  var loginForm = $('#login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearAllErrors(loginForm);

      var email = $('#login-email').value.trim();
      var password = $('#login-password').value;
      var valid = true;

      if (!email) {
        showError('login-email', 'Please enter your email address.');
        valid = false;
      } else if (!isValidEmail(email)) {
        showError('login-email', 'Please enter a valid email address.');
        valid = false;
      }

      if (!password) {
        showError('login-password', 'Please enter your password.');
        valid = false;
      }

      if (!valid) return;

      setButtonLoading('login-submit', true);

      // Simulate login — real auth will be connected later
      setTimeout(function () {
        var user = { name: email.split('@')[0], email: email };
        try {
          localStorage.setItem('kadopay-user', JSON.stringify(user));
        } catch (err) {}
        window.location.href = '/';
      }, 1200);
    });

    // Clear errors on input
    $all('input', loginForm).forEach(function (input) {
      input.addEventListener('input', function () {
        clearError(input.id);
      });
    });
  }

  // ── Signup form ─────────────────────────────────────────
  var signupForm = $('#signup-form');
  if (signupForm) {
    // Country custom dropdown
    var countryWrap = $('#su-country-wrap');
    var countryTrigger = $('#su-country');
    var countryMenu = $('#su-country-menu');
    var countryText = $('#su-country-text');
    var countryValue = $('#su-country-value');
    var countryOptionsEl = $('#su-country-options');
    var countrySearch = $('#su-country-search');
    var dialInput = $('#su-dial-code');
    var selectedDial = '';
    var selectedLabel = '';

    if (countryOptionsEl && window.COUNTRIES) {
      window.COUNTRIES.forEach(function (c) {
        var div = document.createElement('div');
        div.className = 'country-option';
        div.setAttribute('role', 'option');
        div.setAttribute('data-dial', c.dial);
        div.setAttribute('data-name', c.name.toLowerCase());
        div.setAttribute('data-label', c.flag + '  ' + c.name + ' (' + c.dial + ')');
        div.innerHTML =
          '<span class="country-option-flag">' + c.flag + '</span>' +
          '<span class="country-option-name">' + c.name + '</span>' +
          '<span class="country-option-dial">' + c.dial + '</span>';
        div.addEventListener('click', function () {
          selectedDial = c.dial;
          selectedLabel = c.flag + '  ' + c.name + ' (' + c.dial + ')';
          if (countryText) {
            countryText.textContent = selectedLabel;
            countryText.classList.add('has-value');
          }
          if (countryValue) countryValue.value = c.dial;
          if (dialInput) dialInput.value = c.dial;
          // Mark selected
          $all('.country-option', countryOptionsEl).forEach(function (o) { o.classList.remove('selected'); });
          div.classList.add('selected');
          closeCountryMenu();
          clearError('su-country');
        });
        countryOptionsEl.appendChild(div);
      });
    }

    function openCountryMenu() {
      countryMenu.classList.add('open');
      countryTrigger.classList.add('open');
      countryTrigger.setAttribute('aria-expanded', 'true');
      if (countrySearch) {
        countrySearch.value = '';
        filterCountries('');
        setTimeout(function () { countrySearch.focus(); }, 50);
      }
    }

    function closeCountryMenu() {
      countryMenu.classList.remove('open');
      countryTrigger.classList.remove('open');
      countryTrigger.setAttribute('aria-expanded', 'false');
    }

    function filterCountries(query) {
      var q = query.toLowerCase().trim();
      var opts = $all('.country-option', countryOptionsEl);
      var anyMatch = false;
      opts.forEach(function (o) {
        if (o.classList.contains('no-match')) { o.style.display = 'none'; return; }
        var name = o.getAttribute('data-name') || '';
        var dial = o.getAttribute('data-dial') || '';
        var match = !q || name.indexOf(q) !== -1 || dial.indexOf(q) !== -1;
        o.style.display = match ? '' : 'none';
        if (match) anyMatch = true;
      });
      var noMatch = $('.country-option.no-match', countryOptionsEl);
      if (!anyMatch) {
        if (!noMatch) {
          noMatch = document.createElement('div');
          noMatch.className = 'country-option no-match';
          noMatch.textContent = 'No countries found';
          countryOptionsEl.appendChild(noMatch);
        }
        noMatch.style.display = '';
      } else if (noMatch) {
        noMatch.style.display = 'none';
      }
    }

    if (countryTrigger) {
      countryTrigger.addEventListener('click', function (e) {
        e.preventDefault();
        if (countryMenu.classList.contains('open')) closeCountryMenu();
        else openCountryMenu();
      });
    }

    if (countrySearch) {
      countrySearch.addEventListener('input', function () {
        filterCountries(countrySearch.value);
      });
      countrySearch.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeCountryMenu();
      });
    }

    // Close when clicking outside
    document.addEventListener('click', function (e) {
      if (countryWrap && !countryWrap.contains(e.target)) {
        closeCountryMenu();
      }
    });

    // Dial code normalization
    if (dialInput) {
      dialInput.addEventListener('input', function () {
        dialInput.value = normalizeDialCode(dialInput.value);
      });
    }

    // Phone formatting
    var phoneInput = $('#su-phone');
    if (phoneInput) {
      phoneInput.addEventListener('input', function () {
        var digits = phoneInput.value.replace(/\D/g, '').slice(0, 10);
        phoneInput.value = formatPhone(digits);
      });
    }

    // Password strength
    var pwInput = $('#su-password');
    if (pwInput) {
      pwInput.addEventListener('input', function () {
        var val = pwInput.value;
        var requirements = {
          length: val.length >= 8,
          upper: /[A-Z]/.test(val),
          lower: /[a-z]/.test(val),
          number: /\d/.test(val)
        };
        var strength = Object.keys(requirements).filter(function (key) { return requirements[key]; }).length;

        var bars = $all('.auth-strength-bar');
        var label = $('.auth-strength-label');
        Object.keys(requirements).forEach(function (key) {
          var requirement = $('[data-signup-req="' + key + '"]');
          if (requirement) requirement.classList.toggle('met', requirements[key]);
        });
        bars.forEach(function (b) {
          b.classList.remove('weak', 'medium', 'strong');
        });
        if (val.length === 0) {
          if (label) label.textContent = '';
          return;
        }
        if (strength <= 1) {
          if (bars[0]) bars[0].classList.add('weak');
          if (label) label.textContent = 'Weak password';
        } else if (strength <= 2) {
          if (bars[0]) bars[0].classList.add('medium');
          if (bars[1]) bars[1].classList.add('medium');
          if (label) label.textContent = 'Medium strength';
        } else {
          bars.forEach(function (b) { b.classList.add('strong'); });
          if (label) label.textContent = 'Strong password';
        }
      });
    }

    signupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearAllErrors(signupForm);

      var name = $('#su-name').value.trim();
      var email = $('#su-email').value.trim();
      var phone = $('#su-phone').value.trim();
      var password = $('#su-password').value;
      var confirm = $('#su-confirm').value;
      var valid = true;

      if (!name) {
        showError('su-name', 'Please enter your full name.');
        valid = false;
      } else if (name.length < 2) {
        showError('su-name', 'Name must be at least 2 characters.');
        valid = false;
      }

      if (!email) {
        showError('su-email', 'Please enter your email address.');
        valid = false;
      } else if (!isValidEmail(email)) {
        showError('su-email', 'Please enter a valid email address.');
        valid = false;
      }

      var dialCode = getDialCode();
      var phoneDigits = phone.replace(/\D/g, '');
      if (!countryValue || !countryValue.value) {
        showError('su-country', 'Please select your country.');
        valid = false;
      }
      if (!dialCode || dialCode === '+') {
        showError('su-dial-code', 'Please enter a country code.');
        valid = false;
      }
      if (!phone) {
        showError('su-phone', 'Please enter your phone number.');
        valid = false;
      } else if (phoneDigits.length < 7 || phoneDigits.length > 15) {
        showError('su-phone', 'Please enter a valid phone number.');
        valid = false;
      }

      if (!password) {
        showError('su-password', 'Please enter a password.');
        valid = false;
      } else if (password.length < 8) {
        showError('su-password', 'Password must be at least 8 characters.');
        valid = false;
      }

      if (!confirm) {
        showError('su-confirm', 'Please confirm your password.');
        valid = false;
      } else if (password !== confirm) {
        showError('su-confirm', 'Passwords do not match.');
        valid = false;
      }

      if (!valid) return;

      setButtonLoading('signup-submit', true);

      // Simulate account creation — real auth will be connected later
      setTimeout(function () {
        var dial = getDialCode();
        var fullPhone = dial + ' ' + phone;

        // Store registration data for later verification steps
        try {
          var regData = { name: name, email: email, phone: fullPhone, password: password };
          sessionStorage.setItem('kadopay-pending-signup', JSON.stringify(regData));
        } catch (err) {}

        // Show email verification step
        $('#signup-step-form').style.display = 'none';
        $('#signup-step-email').style.display = '';
        setButtonLoading('signup-submit', false);

        var emailDisplay = $('#email-verify-display');
        if (emailDisplay) emailDisplay.textContent = email;

        if (window.startEmailResendCountdown) window.startEmailResendCountdown();
        var firstEmailOtp = $('[data-email-otp-index="0"]');
        if (firstEmailOtp) firstEmailOtp.focus();
      }, 1200);
    });

    // Clear errors on input
    $all('input', signupForm).forEach(function (input) {
      input.addEventListener('input', function () {
        clearError(input.id);
      });
    });
    // Also clear dial-code error when phone changes and vice versa
    if (phoneInput && dialInput) {
      phoneInput.addEventListener('input', function () { clearError('su-dial-code'); });
    }
  }

  // ── Resend countdown helper ─────────────────────────────
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

  // ── Email verification ──────────────────────────────────
  var emailOtpInputs = $all('[data-email-otp-index]');
  if (emailOtpInputs.length > 0) {
    emailOtpInputs.forEach(function (input, idx) {
      input.addEventListener('input', function () {
        input.value = input.value.replace(/\D/g, '').slice(0, 1);
        if (input.value && idx < emailOtpInputs.length - 1) {
          emailOtpInputs[idx + 1].focus();
        }
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !input.value && idx > 0) {
          emailOtpInputs[idx - 1].focus();
        }
      });
      input.addEventListener('paste', function (e) {
        e.preventDefault();
        var pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
        for (var i = 0; i < emailOtpInputs.length && i < pasted.length; i++) {
          emailOtpInputs[i].value = pasted[i];
        }
        if (pasted.length < emailOtpInputs.length) {
          emailOtpInputs[pasted.length].focus();
        } else {
          emailOtpInputs[emailOtpInputs.length - 1].focus();
        }
      });
    });

    var emailResendBtn = $('#email-resend');
    var emailCountdownInterval = null;

    function startEmailResendCountdown() {
      if (emailCountdownInterval) clearInterval(emailCountdownInterval);
      emailCountdownInterval = startCountdown(emailResendBtn, 'Resend code in ');
    }
    // Expose for signup submit handler
    window.startEmailResendCountdown = startEmailResendCountdown;

    if (emailResendBtn) {
      emailResendBtn.addEventListener('click', function () {
        if (emailResendBtn.disabled) return;
        startEmailResendCountdown();
      });
    }

    var emailVerifyForm = $('#email-verify-form');
    if (emailVerifyForm) {
      emailVerifyForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var code = emailOtpInputs.map(function (i) { return i.value; }).join('');
        var errorEl = $('[data-error-for="email-otp"]');
        emailOtpInputs.forEach(function (i) { i.classList.remove('has-error'); });
        if (errorEl) { errorEl.classList.remove('visible'); errorEl.textContent = ''; }

        if (code.length !== 6) {
          emailOtpInputs.forEach(function (i) { i.classList.add('has-error'); });
          if (errorEl) { errorEl.textContent = 'Please enter the 6-digit code.'; errorEl.classList.add('visible'); }
          return;
        }

        setButtonLoading('email-verify-submit', true);

        // Simulate email verification — real verification will be connected later
        setTimeout(function () {
          // Move to phone verification step
          var pending = {};
          try { pending = JSON.parse(sessionStorage.getItem('kadopay-pending-signup') || '{}'); } catch (err) {}

          var phoneDisplay = $('#otp-phone-display');
          if (phoneDisplay) phoneDisplay.textContent = pending.phone || '';

          $('#signup-step-email').style.display = 'none';
          $('#signup-step-otp').style.display = '';
          setButtonLoading('email-verify-submit', false);

          startPhoneResendCountdown();
          var firstOtp = $('[data-otp-index="0"]');
          if (firstOtp) firstOtp.focus();
        }, 1200);
      });
    }

    var emailBack = $('#email-back');
    if (emailBack) {
      emailBack.addEventListener('click', function () {
        $('#signup-step-email').style.display = 'none';
        $('#signup-step-form').style.display = '';
      });
    }
  }

  // ── Phone OTP input handling ─────────────────────────────
  var otpInputs = $all('[data-otp-index]');
  if (otpInputs.length > 0) {
    otpInputs.forEach(function (input, idx) {
      input.addEventListener('input', function () {
        input.value = input.value.replace(/\D/g, '').slice(0, 1);
        if (input.value && idx < otpInputs.length - 1) {
          otpInputs[idx + 1].focus();
        }
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !input.value && idx > 0) {
          otpInputs[idx - 1].focus();
        }
      });
      input.addEventListener('paste', function (e) {
        e.preventDefault();
        var pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
        for (var i = 0; i < otpInputs.length && i < pasted.length; i++) {
          otpInputs[i].value = pasted[i];
        }
        if (pasted.length < otpInputs.length) {
          otpInputs[pasted.length].focus();
        } else {
          otpInputs[otpInputs.length - 1].focus();
        }
      });
    });

    var otpResendBtn = $('#otp-resend');
    var phoneCountdownInterval = null;

    function startPhoneResendCountdown() {
      if (phoneCountdownInterval) clearInterval(phoneCountdownInterval);
      phoneCountdownInterval = startCountdown(otpResendBtn, 'Resend code in ');
    }
    window.startPhoneResendCountdown = startPhoneResendCountdown;

    if (otpResendBtn) {
      otpResendBtn.addEventListener('click', function () {
        if (otpResendBtn.disabled) return;
        startPhoneResendCountdown();
      });
    }

    var otpForm = $('#otp-form');
    if (otpForm) {
      otpForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var code = otpInputs.map(function (i) { return i.value; }).join('');
        var errorEl = $('[data-error-for="otp"]');
        otpInputs.forEach(function (i) { i.classList.remove('has-error'); });
        if (errorEl) { errorEl.classList.remove('visible'); errorEl.textContent = ''; }

        if (code.length !== 6) {
          otpInputs.forEach(function (i) { i.classList.add('has-error'); });
          if (errorEl) { errorEl.textContent = 'Please enter the 6-digit code.'; errorEl.classList.add('visible'); }
          return;
        }

        setButtonLoading('otp-submit', true);

        // Simulate OTP verification — real verification will be connected later
        setTimeout(function () {
          // Save user as logged in
          try {
            var pending = JSON.parse(sessionStorage.getItem('kadopay-pending-signup') || '{}');
            var user = { name: pending.name || 'User', email: pending.email || '' };
            localStorage.setItem('kadopay-user', JSON.stringify(user));
            sessionStorage.removeItem('kadopay-pending-signup');
          } catch (err) {}

          // Show success step
          $('#signup-step-otp').style.display = 'none';
          $('#signup-step-success').style.display = '';
          setButtonLoading('otp-submit', false);
        }, 1200);
      });
    }

    var otpBack = $('#otp-back');
    if (otpBack) {
      otpBack.addEventListener('click', function () {
        $('#signup-step-otp').style.display = 'none';
        $('#signup-step-form').style.display = '';
      });
    }
  }

  // ── Account avatar + dropdown ───────────────────────────
  var avatarBtn = $('#account-avatar-btn');
  var dropdown = $('#account-dropdown');

  // Check login state first
  var currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem('kadopay-user') || 'null');
  } catch (err) {}

  if (avatarBtn && currentUser) {
    // Logged in: show initials avatar, enable dropdown, prevent /signup navigation
    var initials = (currentUser.name || currentUser.email || 'U').split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
    var avatarContent = $('#account-avatar-content');
    var dropdownAvatar = $('#dropdown-avatar');
    var userName = $('#dropdown-user-name');
    var userEmail = $('#dropdown-user-email');
    if (avatarContent) {
      avatarContent.innerHTML = '<span class="text-sm font-bold text-white" style="display:flex;height:100%;width:100%;align-items:center;justify-content:center;border-radius:9999px;background:linear-gradient(135deg,#10b981,#047857);">' + initials + '</span>';
    }
    if (dropdownAvatar) dropdownAvatar.textContent = initials;
    if (userName) userName.textContent = currentUser.name || 'User';
    if (userEmail) userEmail.textContent = currentUser.email || '';

    if (dropdown) {
      $('#dropdown-logged-in').style.display = '';

      var dropdownOpen = false;

      function openDropdown() {
        dropdown.style.display = '';
        dropdown.style.opacity = '1';
        dropdown.style.transform = 'translateY(0) scale(1)';
        dropdown.style.pointerEvents = '';
        dropdownOpen = true;
      }

      function closeDropdown() {
        dropdown.style.opacity = '0';
        dropdown.style.transform = 'translateY(-4px) scale(0.97)';
        dropdown.style.pointerEvents = 'none';
        dropdownOpen = false;
        setTimeout(function () {
          if (!dropdownOpen) dropdown.style.display = 'none';
        }, 200);
      }

      avatarBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (dropdownOpen) closeDropdown();
        else openDropdown();
      });

      document.addEventListener('click', function (e) {
        if (dropdownOpen && !dropdown.contains(e.target) && e.target !== avatarBtn) {
          closeDropdown();
        }
      });
    }

    var logoutBtn = $('#logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        try { localStorage.removeItem('kadopay-user'); } catch (err) {}
        window.location.href = '/';
      });
    }
  }
  // When not logged in, avatar is a plain <a href="/signup"> — browser handles navigation
})();
