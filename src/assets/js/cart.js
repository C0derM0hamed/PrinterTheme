/* =============================================================================
   PrinterTheme — cart.js
   Cart page logic:
     1. Quantity update  → salla.cart.updateItem
     2. Item removal     → salla.cart.deleteItem
     3. Clear cart       → iterates salla.cart.deleteItem
     4. Coupon apply     → salla.cart.applyCoupon
     5. Totals refresh   → listens to cart.updated event
   ============================================================================= */

(function () {
  'use strict';

  var page = document.getElementById('cart-page');
  if (!page) return;

  /* ─── Helpers ─────────────────────────────────────────────────────────── */
  /*
     Salla bootstraps Twilight on the page and exposes a global `salla`
     object. Use `salla.onReady(cb)` — there is no `salla:ready` DOM event.
  */

  function sallaReady(cb) {
    if (typeof salla !== 'undefined' && typeof salla.onReady === 'function') {
      salla.onReady(cb);
      return;
    }
    var tries = 0;
    var t = setInterval(function () {
      if (typeof salla !== 'undefined' && typeof salla.onReady === 'function') {
        clearInterval(t);
        salla.onReady(cb);
      } else if (++tries > 50) {
        clearInterval(t);
      }
    }, 100);
  }

  function formatMoney(amount) {
    if (typeof salla !== 'undefined' && salla.money && salla.money.format) {
      return salla.money.format(amount);
    }
    return amount.toFixed(2);
  }

  function setLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = loading;
    var icon = btn.querySelector('i');
    if (loading) {
      btn.dataset.origHtml = btn.innerHTML;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
    } else if (btn.dataset.origHtml) {
      btn.innerHTML = btn.dataset.origHtml;
    }
  }

  function showToast(msg, type) {
    var toast = document.createElement('div');
    toast.className = 'cart-toast cart-toast--' + (type || 'info');
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(function () { toast.classList.add('is-visible'); });
    setTimeout(function () {
      toast.classList.remove('is-visible');
      setTimeout(function () { toast.remove(); }, 300);
    }, 3200);
  }

  /* ─── Quantity helpers ─────────────────────────────────────────────────── */

  function getQtyInput(itemId) {
    return page.querySelector('.js-cart-qty[data-item-id="' + itemId + '"]');
  }

  function updateQty(itemId, newQty) {
    if (newQty < 1) return;
    sallaReady(function () {
      salla.cart.updateItem({ id: itemId, quantity: newQty })
        .then(function (res) {
          refreshCartUI(res);
        })
        .catch(function (err) {
          var msg = (err && err.message) ? err.message : 'Could not update quantity.';
          showToast(msg, 'error');
          /* revert input to last known value from the server */
        });
    });
  }

  /* ─── Event delegation ─────────────────────────────────────────────────── */

  page.addEventListener('click', function (e) {
    /* Decrease qty */
    if (e.target.closest('.js-cart-decrease')) {
      var btn = e.target.closest('.js-cart-decrease');
      var itemId = btn.dataset.itemId;
      var input = getQtyInput(itemId);
      var cur = parseInt(input.value, 10) || 1;
      if (cur > 1) {
        input.value = cur - 1;
        updateQty(itemId, cur - 1);
      }
    }

    /* Increase qty */
    if (e.target.closest('.js-cart-increase')) {
      var btn2 = e.target.closest('.js-cart-increase');
      var itemId2 = btn2.dataset.itemId;
      var input2 = getQtyInput(itemId2);
      var cur2 = parseInt(input2.value, 10) || 1;
      input2.value = cur2 + 1;
      updateQty(itemId2, cur2 + 1);
    }

    /* Remove item */
    if (e.target.closest('.js-cart-remove')) {
      var btn3 = e.target.closest('.js-cart-remove');
      var itemId3 = btn3.dataset.itemId;
      var row = page.querySelector('.cart-item[data-item-id="' + itemId3 + '"]');
      setLoading(btn3, true);
      sallaReady(function () {
        salla.cart.deleteItem(itemId3)
          .then(function (res) {
            if (row) {
              row.classList.add('cart-item--removing');
              setTimeout(function () { row.remove(); }, 300);
            }
            refreshCartUI(res);
          })
          .catch(function (err) {
            setLoading(btn3, false);
            var msg = (err && err.message) ? err.message : 'Could not remove item.';
            showToast(msg, 'error');
          });
      });
    }

    /* Clear cart */
    if (e.target.closest('#btn-clear-cart')) {
      var clearBtn = e.target.closest('#btn-clear-cart');
      if (!confirm('Are you sure you want to clear your cart?')) return;
      setLoading(clearBtn, true);
      sallaReady(function () {
        var items = Array.from(page.querySelectorAll('.cart-item'));
        var ids = items.map(function (el) { return el.dataset.itemId; });
        var seq = Promise.resolve();
        ids.forEach(function (id) {
          seq = seq.then(function () { return salla.cart.deleteItem(id); });
        });
        seq.then(function () {
          window.location.reload();
        }).catch(function () {
          setLoading(clearBtn, false);
          showToast('Could not clear cart.', 'error');
        });
      });
    }

    /* Apply coupon */
    if (e.target.closest('.js-apply-coupon')) {
      var applyBtn = e.target.closest('.js-apply-coupon');
      var codeInput = document.getElementById('coupon-code');
      var code = (codeInput && codeInput.value.trim()) || '';
      var feedback = document.getElementById('coupon-feedback');
      if (!code) {
        if (feedback) {
          feedback.textContent = 'Please enter a coupon code.';
          feedback.className = 'cart-coupon__feedback mt-2 text-danger';
          feedback.classList.remove('d-none');
        }
        return;
      }
      setLoading(applyBtn, true);
      sallaReady(function () {
        salla.cart.applyCoupon({ coupon: code })
          .then(function (res) {
            setLoading(applyBtn, false);
            if (feedback) {
              feedback.textContent = res.message || 'Coupon applied!';
              feedback.className = 'cart-coupon__feedback mt-2 text-success';
              feedback.classList.remove('d-none');
            }
            refreshCartUI(res);
          })
          .catch(function (err) {
            setLoading(applyBtn, false);
            if (feedback) {
              feedback.textContent = (err && err.message) ? err.message : 'Invalid coupon code.';
              feedback.className = 'cart-coupon__feedback mt-2 text-danger';
              feedback.classList.remove('d-none');
            }
          });
      });
    }
  });

  /* Manual qty input (blur / enter) */
  page.addEventListener('change', function (e) {
    if (e.target.classList.contains('js-cart-qty')) {
      var itemId = e.target.dataset.itemId;
      var val = parseInt(e.target.value, 10);
      if (isNaN(val) || val < 1) { e.target.value = 1; val = 1; }
      updateQty(itemId, val);
    }
  });

  /* ─── Cart UI refresh after Salla response ─────────────────────────────── */

  function refreshCartUI(res) {
    if (!res || !res.data) return;
    var data = res.data;

    /* Totals */
    var elSub     = document.getElementById('cart-subtotal');
    var elDisc    = document.getElementById('cart-discount');
    var elTax     = document.getElementById('cart-tax');
    var elShip    = document.getElementById('cart-shipping');
    var elTotal   = document.getElementById('cart-total');

    if (elSub   && data.subtotal   !== undefined) elSub.textContent   = formatMoney(data.subtotal);
    if (elDisc  && data.discount   !== undefined) elDisc.textContent  = '-' + formatMoney(data.discount);
    if (elTax   && data.tax        !== undefined) elTax.textContent   = formatMoney(data.tax);
    if (elShip  && data.shipping   !== undefined) elShip.textContent  = formatMoney(data.shipping);
    if (elTotal && data.total      !== undefined) elTotal.textContent = formatMoney(data.total);

    /* Per-item line totals */
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach(function (item) {
        var lineEl = page.querySelector('.js-cart-line-total[data-item-id="' + item.id + '"]');
        if (lineEl && item.total !== undefined) {
          lineEl.textContent = formatMoney(item.total);
        }
      });
    }

    /* If cart becomes empty, reload so the empty state renders */
    if (data.count === 0 || (data.items && data.items.length === 0)) {
      window.location.reload();
    }

    /* Sync header cart badge */
    var badge = document.getElementById('cart-count');
    if (badge && data.count !== undefined) {
      badge.textContent = data.count;
    }
  }

  /* ─── Salla cart.updated event (fires from other tabs / Salla widgets) ── */
  /*
     Use the typed `salla.cart.event.onUpdated` hook — it receives a
     `CartSummary` object directly (no `.data` wrapper).
  */

  sallaReady(function () {
    if (salla.cart && salla.cart.event && typeof salla.cart.event.onUpdated === 'function') {
      salla.cart.event.onUpdated(function (summary) {
        refreshCartUI({ data: summary });
      });
    }
  });

})();
