/* ===========================================================
   Harbor & Vine — reservation demonstration
   Validates and previews a request. Never emails the fictional
   address and never holds a table.
   =========================================================== */
(function () {
  'use strict';
  var form = document.getElementById('restaurant-reservation');
  if (!form) return;
  var status = document.getElementById('reservation-status');
  var preview = document.getElementById('reservation-preview');
  var date = form.elements.date;

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }
  if (date) {
    date.min = today();
    date.addEventListener('input', function () { date.setCustomValidity(''); });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (date) {
      date.min = today();
      date.setCustomValidity(date.value && date.value < date.min ? 'Choose today or a future date.' : '');
    }
    if (!form.reportValidity()) return;
    var lines = ['DEMONSTRATION ONLY — nothing has been sent.', ''];
    new FormData(form).forEach(function (value, key) {
      lines.push(key.replace(/_/g, ' ') + ': ' + value);
    });
    if (preview) {
      preview.textContent = lines.join('\n');
      preview.hidden = false;
    }
    if (status) {
      status.textContent = 'Your demo request is shown below. No email was sent, no booking was made, and no table is held.';
    }
  });
})();
