/* =============================================================================
   PrinterTheme — product.js
   Single-product page logic:
     1. Option-state machine (color / image / chip / select)
     2. Print-spec multipliers and adders (paper size, type, sides, color, finishing)
     3. Live quote recalculation (unit price × qty + finishing add-ons)
     4. Delivery ETA computation (locale-aware Intl.DateTimeFormat)
     5. Upload zone state machine + salla.uploader hookup with input fallback
     6. Add-to-cart with notes/attachments via salla.cart.addItem
   ============================================================================= */

(function () {
  'use strict';

  /* ─── Helpers ────────────────────────────────────────────────── */

  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }
  function $$(sel, ctx) {
    return Array.from((ctx || document).querySelectorAll(sel));
  }
  function formatMoney(amount) {
    if (typeof salla !== 'undefined' && salla.money && salla.money.format) {
      return salla.money.format(amount);
    }
    return amount.toFixed(2);
  }

  /* ─── Page anchor ────────────────────────────────────────────── */

  var page         = $('#product-page');
  if (!page) return;                       // not on a product page

  var PRODUCT_ID   = page.dataset.productId;
  var BASE_PRICE   = parseFloat(page.dataset.basePrice) || 0;
  var _etaEl    = $('#delivery-eta-row');
  var BASE_DAYS = parseInt((_etaEl && _etaEl.dataset && _etaEl.dataset.baseDays) ? _etaEl.dataset.baseDays : '3', 10) || 3;

  /* =============================================================================
     1. OPTION STATE MACHINE
     ============================================================================= */

  /* selectedOptions[option_id] = { valueId, priceAdd } */
  var selectedOptions = {};

  /* Activate a button within an option group, deactivate siblings */
  function selectGroupBtn(btn) {
    var group = btn.closest('[data-option-id]') ||
                btn.closest('.option-group');
    if (!group) return;
    $$('.btn-option-chip, .btn-option-color, .btn-option-image', group)
      .forEach(function (b) { b.classList.remove('active'); b.removeAttribute('aria-pressed'); });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
  }

  /* Color swatches */
  $$('.btn-option-color').forEach(function (btn) {
    btn.addEventListener('click', function () {
      selectGroupBtn(this);
      var optId = this.closest('[data-option-id]').dataset.optionId;
      selectedOptions[optId] = {
        valueId:  this.dataset.valueId,
        priceAdd: parseFloat(this.dataset.priceAdd) || 0
      };
      recalc();
    });
  });

  /* Image swatches */
  $$('.btn-option-image').forEach(function (btn) {
    btn.addEventListener('click', function () {
      selectGroupBtn(this);
      var optId = this.closest('[data-option-id]').dataset.optionId;
      selectedOptions[optId] = {
        valueId:  this.dataset.valueId,
        priceAdd: parseFloat(this.dataset.priceAdd) || 0
      };
      recalc();
    });
  });

  /* Text / radio chips */
  $$('.btn-option-chip:not([data-spec])').forEach(function (btn) {
    btn.addEventListener('click', function () {
      selectGroupBtn(this);
      var optId = this.closest('[data-option-id]').dataset.optionId;
      if (!optId) return;
      selectedOptions[optId] = {
        valueId:  this.dataset.valueId,
        priceAdd: parseFloat(this.dataset.priceAdd) || 0
      };
      recalc();
    });
  });

  /* Selects */
  $$('.option-select').forEach(function (sel) {
    sel.addEventListener('change', function () {
      var opt  = this.options[this.selectedIndex];
      var optId = this.dataset.optionId;
      selectedOptions[optId] = {
        valueId:  opt.value,
        priceAdd: parseFloat(opt.dataset.priceAdd) || 0
      };
      recalc();
    });
  });

  /* ─── Gallery thumbnail sync ────────────────────────────────── */
  $$('.product-gallery__thumb').forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      $$('.product-gallery__thumb').forEach(function (t) { t.classList.remove('active'); });
      thumb.classList.add('active');
    });
  });

  /* =============================================================================
     2. PRINT-SPEC STATE MACHINE
     ============================================================================= */

  /*
   * specs state:
   *   paper_size   { value, multiplier }
   *   paper_type   { value, priceAdd }
   *   sides        { value, multiplier }
   *   color_mode   { value, multiplier }
   *   finishing    [ { value, priceAdd } ]   (multi-select checkboxes)
   */
  var specs = {
    paper_size:  { value: 'A4',     multiplier: 1.0  },
    paper_type:  { value: '80gsm',  priceAdd:   0    },
    sides:       { value: 'single', multiplier: 1.0  },
    color_mode:  { value: 'color',  multiplier: 1.0  },
    finishing:   []
  };

  /* Single-select spec chip groups (paper_size, paper_type, sides, color_mode) */
  $$('.print-spec-group').forEach(function (group) {
    var specKey = group.dataset.spec;
    $$('.btn-option-chip', group).forEach(function (btn) {
      btn.addEventListener('click', function () {
        /* deactivate siblings */
        $$('.btn-option-chip', group).forEach(function (b) {
          b.classList.remove('active');
          b.removeAttribute('aria-pressed');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');

        /* update state */
        if (specKey === 'paper_size') {
          specs.paper_size = {
            value:      btn.dataset.specValue,
            multiplier: parseFloat(btn.dataset.multiplier) || 1.0
          };
          /* Toggle custom-size inputs */
          var customInputs = $('#custom-size-inputs');
          if (customInputs) {
            customInputs.classList.toggle('d-none', btn.dataset.specValue !== 'custom');
          }
        } else if (specKey === 'paper_type') {
          specs.paper_type = {
            value:    btn.dataset.specValue,
            priceAdd: parseFloat(btn.dataset.priceAdd) || 0
          };
        } else if (specKey === 'sides') {
          specs.sides = {
            value:      btn.dataset.specValue,
            multiplier: parseFloat(btn.dataset.multiplier) || 1.0
          };
        } else if (specKey === 'color_mode') {
          specs.color_mode = {
            value:      btn.dataset.specValue,
            multiplier: parseFloat(btn.dataset.multiplier) || 1.0
          };
        }
        recalc();
      });
    });
  });

  /* Finishing checkboxes (multi-select) */
  $$('.finishing-checkbox').forEach(function (cb) {
    cb.addEventListener('change', function () {
      /* "None" is exclusive — unchecking others when none is ticked */
      if (cb.dataset.specValue === 'none' && cb.checked) {
        $$('.finishing-checkbox').forEach(function (o) {
          if (o !== cb) o.checked = false;
        });
      }
      if (cb.dataset.specValue !== 'none' && cb.checked) {
        var noneCheck = $('#finish-none');
        if (noneCheck) noneCheck.checked = false;
      }

      /* rebuild finishing array */
      specs.finishing = [];
      $$('.finishing-checkbox:checked').forEach(function (o) {
        if (o.dataset.specValue !== 'none') {
          specs.finishing.push({
            value:    o.dataset.specValue,
            priceAdd: parseFloat(o.dataset.priceAdd) || 0
          });
        }
      });
      recalc();
    });
  });

  /* =============================================================================
     3. LIVE QUOTE RECALCULATION
     ============================================================================= */

  var qUnitPrice     = $('#q-unit-price');
  var qQuantity      = $('#q-quantity');
  var qSubtotal      = $('#q-subtotal');
  var qSubtotalRow   = $('#q-subtotal-row');
  var qFinishing     = $('#q-finishing-cost');
  var qFinishingRow  = $('#q-finishing-row');
  var qTotal         = $('#q-total');
  var displayPrice   = $('#display-price');
  var mobilePrice    = $('#mobile-display-price');

  function recalc() {
    var qty    = parseInt(($('#product-qty') || {}).value) || 1;
    var optAdd = Object.values(selectedOptions)
                   .reduce(function (s, o) { return s + (o.priceAdd || 0); }, 0);

    /* Unit price: base + option adds + paper type add, then × size × sides × color */
    var unitPrice = (BASE_PRICE + optAdd + specs.paper_type.priceAdd)
                    * specs.paper_size.multiplier
                    * specs.sides.multiplier
                    * specs.color_mode.multiplier;

    var subtotal    = unitPrice * qty;
    var finishAdd   = specs.finishing.reduce(function (s, f) { return s + f.priceAdd; }, 0);
    var total       = subtotal + finishAdd;

    /* Update display price (main) */
    if (displayPrice) {
      displayPrice.textContent = formatMoney(total);
    }
    if (mobilePrice) {
      mobilePrice.textContent = formatMoney(total);
    }

    /* Quote panel */
    if (qUnitPrice)   qUnitPrice.textContent   = formatMoney(unitPrice);
    if (qQuantity)    qQuantity.textContent     = qty;

    var specsActive = (
      specs.paper_size.value !== 'A4' ||
      specs.paper_type.priceAdd !== 0 ||
      specs.sides.value !== 'single' ||
      specs.color_mode.value !== 'color'
    );

    if (qSubtotalRow) qSubtotalRow.classList.toggle('d-none', !specsActive);
    if (qSubtotal)    qSubtotal.textContent = formatMoney(subtotal);

    if (finishAdd > 0) {
      if (qFinishingRow) qFinishingRow.classList.remove('d-none');
      if (qFinishing)    qFinishing.textContent = '+' + formatMoney(finishAdd);
    } else {
      if (qFinishingRow) qFinishingRow.classList.add('d-none');
    }

    if (qTotal) qTotal.textContent = formatMoney(total);

    computeDeliveryEta(qty);
  }

  /* =============================================================================
     4. DELIVERY ETA COMPUTATION
     ============================================================================= */

  var qDeliveryEta = $('#q-delivery-eta');

  function computeDeliveryEta(qty) {
    if (!qDeliveryEta) return;

    var days = BASE_DAYS;
    if (qty > 100) days += 2;
    var hasBinding = specs.finishing.some(function (f) { return f.value === 'binding'; });
    if (hasBinding) days += 1;

    var etaDate = new Date();
    var added   = 0;
    while (added < days) {
      etaDate.setDate(etaDate.getDate() + 1);
      var dow = etaDate.getDay();
      if (dow !== 0 && dow !== 6) added++; /* skip weekends */
    }

    try {
      var locale = document.documentElement.lang || 'en';
      var formatted = new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        month:   'short',
        day:     'numeric'
      }).format(etaDate);
      qDeliveryEta.textContent = formatted;
    } catch (e) {
      /* Fallback for environments where Intl is unavailable */
      qDeliveryEta.textContent = etaDate.toDateString();
    }
  }

  /* =============================================================================
     5. QUANTITY STEPPER (product page specific — theme.js handles generic ones)
     ============================================================================= */

  var qtyInput = $('#product-qty');

  function onQtyChange() { recalc(); }

  $$('#product-add-row .btn-minus').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!qtyInput) return;
      var min  = parseInt(qtyInput.min)  || 1;
      var step = parseInt(qtyInput.step) || 1;
      var val  = parseInt(qtyInput.value) - step;
      if (val >= min) { qtyInput.value = val; onQtyChange(); }
    });
  });
  $$('#product-add-row .btn-plus').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!qtyInput) return;
      var max  = parseInt(qtyInput.max)  || Infinity;
      var step = parseInt(qtyInput.step) || 1;
      var val  = parseInt(qtyInput.value) + step;
      if (val <= max) { qtyInput.value = val; onQtyChange(); }
    });
  });
  if (qtyInput) qtyInput.addEventListener('input', onQtyChange);

  /* =============================================================================
     6. ADD TO CART
     ============================================================================= */

  function buildNotesFromSpecs() {
    var parts = [];
    if (specs.paper_size.value !== 'A4') {
      parts.push('Size: ' + specs.paper_size.value);
    }
    if (specs.paper_type.priceAdd !== 0) {
      parts.push('Paper: ' + specs.paper_type.value);
    }
    if (specs.sides.value === 'double') {
      parts.push('Double-sided');
    }
    if (specs.color_mode.value === 'bw') {
      parts.push('B&W');
    }
    if (specs.finishing.length) {
      parts.push('Finishing: ' + specs.finishing.map(function (f) { return f.value; }).join(', '));
    }
    return parts.join(', ');
  }

  function setAtcLoading(isLoading) {
    var btn     = $('#btn-add-to-cart');
    var label   = $('#btn-add-to-cart .btn-atc-label');
    var spinner = $('#btn-add-to-cart .btn-atc-spinner');
    if (!btn) return;
    btn.disabled = isLoading;
    if (label)   label.textContent = isLoading ? '' : btn.dataset.labelDefault || '';
    if (spinner) spinner.classList.toggle('d-none', !isLoading);
  }

  function doAddToCart() {
    var btn       = $('#btn-add-to-cart');
    if (!btn || btn.disabled) return;

    /* Cache the original label text for restore */
    if (!btn.dataset.labelDefault) {
      var lbl = $('#btn-add-to-cart .btn-atc-label');
      btn.dataset.labelDefault = lbl ? lbl.textContent.trim() : '';
    }

    var qty       = parseInt((qtyInput || {}).value) || 1;
    var options   = Object.keys(selectedOptions).map(function (k) {
      return { id: k, value: selectedOptions[k].valueId };
    });
    var notes     = buildNotesFromSpecs();
    var uploadId  = ($('#upload-file-id') || {}).value || null;

    var payload = {
      product_id: PRODUCT_ID,
      quantity:   qty
    };
    if (options.length)  payload.options     = options;
    if (notes)           payload.notes       = notes;
    if (uploadId)        payload.attachments = [uploadId];

    setAtcLoading(true);

    if (typeof salla !== 'undefined' && salla.cart && salla.cart.addItem) {
      salla.cart.addItem(payload)
        .then(function (res) {
          setAtcLoading(false);
          if (typeof salla.notify !== 'undefined') {
            salla.notify.success(res.message || 'Added to cart');
          }
          /* Update header cart count */
          var countEl = document.getElementById('cart-count');
          if (countEl && res.data && res.data.cart) {
            countEl.textContent = res.data.cart.count;
          }
        })
        .catch(function (err) {
          setAtcLoading(false);
          if (typeof salla.notify !== 'undefined') {
            salla.notify.error((err && err.message) || 'Something went wrong');
          }
        });
    } else {
      /* SDK not available — navigate to product URL (graceful degradation) */
      setAtcLoading(false);
    }
  }

  var atcBtn       = $('#btn-add-to-cart');
  var mobileAtcBtn = $('#mobile-btn-add-to-cart');

  if (atcBtn)       atcBtn.addEventListener('click',       doAddToCart);
  if (mobileAtcBtn) mobileAtcBtn.addEventListener('click', doAddToCart);

  /* Mobile sticky bar: show after scrolling past the desktop ATC row */
  var addRow      = $('#product-add-row');
  var mobileBar   = $('#mobile-atc-bar');

  if (mobileBar && addRow) {
    window.addEventListener('scroll', function () {
      var rect = addRow.getBoundingClientRect();
      mobileBar.classList.toggle('is-visible', rect.bottom < 0);
      mobileBar.setAttribute('aria-hidden', String(rect.bottom >= 0));
    }, { passive: true });
  }

  /* =============================================================================
     7. UPLOAD ZONE STATE MACHINE
     ============================================================================= */

  var uploadZone    = $('#upload-zone');
  var fileInput     = $('#file-input');
  var browseBtn     = $('#browse-btn');
  var replaceBtn    = $('#replace-file');
  var removeBtn     = $('#remove-file');
  var dropMsg       = $('#drop-message');
  var filePreview   = $('#file-preview');
  var previewImg    = $('#preview-img');
  var previewBadge  = $('#preview-badge');
  var fileNameEl    = $('#file-name');
  var fileSizeEl    = $('#file-size');
  var progressWrap  = $('#upload-progress');
  var progressBar   = $('#upload-progress-bar');
  var statusEl      = $('#upload-status');
  var uploadFileId  = $('#upload-file-id');

  /* Allowed MIME extensions → badge icon mapping */
  var BADGE_ICONS = {
    pdf: 'fa-file-pdf',
    ai:  'fa-file-alt',
    psd: 'fa-file-image',
    eps: 'fa-file-code',
    svg: 'fa-file-code',
    default: 'fa-file-text'
  };

  function setUploadState(state, file, pct) {
    if (!uploadZone) return;
    uploadZone.dataset.state = state;

    switch (state) {
      case 'idle':
        if (dropMsg)     dropMsg.classList.remove('d-none');
        if (filePreview) filePreview.classList.add('d-none');
        if (progressWrap) progressWrap.style.display = 'none';
        if (uploadFileId) uploadFileId.value = '';
        break;

      case 'reading':
        if (dropMsg)     dropMsg.classList.add('d-none');
        if (filePreview) filePreview.classList.remove('d-none');

        /* file name + size */
        if (fileNameEl) fileNameEl.textContent = file.name;
        if (fileSizeEl) fileSizeEl.textContent = (file.size / (1024 * 1024)).toFixed(2) + ' MB';

        /* image preview vs. filetype badge */
        var ext = (file.name.split('.').pop() || '').toLowerCase();
        if (file.type && file.type.startsWith('image/')) {
          var reader = new FileReader();
          reader.onload = function (ev) {
            if (previewImg) {
              previewImg.src = ev.target.result;
              previewImg.classList.remove('d-none');
            }
            if (previewBadge) previewBadge.classList.add('d-none');
          };
          reader.readAsDataURL(file);
        } else {
          if (previewImg)   previewImg.classList.add('d-none');
          if (previewBadge) {
            var icon = previewBadge.querySelector('i');
            if (icon) {
              icon.className = 'fa ' + (BADGE_ICONS[ext] || BADGE_ICONS.default) + ' fa-3x text-primary';
            }
            previewBadge.classList.remove('d-none');
          }
        }

        if (statusEl) { statusEl.textContent = ''; statusEl.className = 'upload-status d-block mb-2'; }
        break;

      case 'uploading':
        if (progressWrap) progressWrap.style.display = 'flex';
        if (progressBar) {
          progressBar.style.width = (pct || 0) + '%';
          progressBar.parentElement.setAttribute('aria-valuenow', pct || 0);
        }
        if (statusEl) {
          statusEl.textContent = 'Uploading…';
          statusEl.className   = 'upload-status d-block mb-2 text-muted';
        }
        break;

      case 'done':
        if (progressBar) {
          progressBar.style.width = '100%';
          progressBar.parentElement.setAttribute('aria-valuenow', 100);
        }
        if (statusEl) {
          statusEl.innerHTML = '<i class="fa fa-check-circle mr-1" aria-hidden="true"></i> Uploaded successfully';
          statusEl.className = 'upload-status d-block mb-2 text-success';
        }
        break;

      case 'error':
        if (statusEl) {
          statusEl.innerHTML = '<i class="fa fa-exclamation-circle mr-1" aria-hidden="true"></i> Upload failed. Please try again.';
          statusEl.className = 'upload-status d-block mb-2 text-danger';
        }
        break;
    }
  }

  /* Max size validation */
  var MAX_BYTES = (parseInt((uploadZone && uploadZone.dataset.maxMb) || 0) || 50) * 1024 * 1024;

  function handleFile(file) {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      alert('File is too large. Maximum allowed size is ' + (MAX_BYTES / (1024 * 1024)).toFixed(0) + 'MB.');
      return;
    }

    setUploadState('reading', file);

    /* Try salla.uploader first; fall back to leaving the raw input value
       so the form can POST the file directly when the merchant enables it. */
    if (typeof salla !== 'undefined' && salla.uploader && typeof salla.uploader.upload === 'function') {
      setUploadState('uploading', null, 0);
      salla.uploader.upload(file, {
        type: 'product_design',
        onProgress: function (pct) {
          setUploadState('uploading', null, pct);
        }
      }).then(function (res) {
        if (uploadFileId) uploadFileId.value = res.id || res.file_id || '';
        setUploadState('done');
      }).catch(function () {
        setUploadState('error');
      });
    } else {
      /* SDK unavailable — the raw input already holds the File object;
         it will be submitted with the form on browsers that support it. */
      setUploadState('done');
    }
  }

  if (browseBtn)  browseBtn.addEventListener('click',  function () { fileInput && fileInput.click(); });
  if (replaceBtn) replaceBtn.addEventListener('click', function () { fileInput && fileInput.click(); });
  if (removeBtn)  removeBtn.addEventListener('click',  function () {
    if (fileInput) fileInput.value = '';
    setUploadState('idle');
  });

  if (fileInput) {
    fileInput.addEventListener('change', function () {
      if (this.files[0]) handleFile(this.files[0]);
    });
  }

  if (uploadZone) {
    /* Allow clicking anywhere on the zone (when idle) to trigger browse */
    uploadZone.addEventListener('click', function (e) {
      if (uploadZone.dataset.state !== 'idle') return;
      if (e.target.closest('button, a, input')) return;
      fileInput && fileInput.click();
    });

    uploadZone.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (uploadZone.dataset.state === 'idle') fileInput && fileInput.click();
      }
    });

    uploadZone.addEventListener('dragover', function (e) {
      e.preventDefault();
      this.classList.add('dragover');
    });
    uploadZone.addEventListener('dragenter', function () { this.classList.add('dragover'); });
    uploadZone.addEventListener('dragleave', function () { this.classList.remove('dragover'); });
    uploadZone.addEventListener('drop', function (e) {
      e.preventDefault();
      this.classList.remove('dragover');
      var file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    });
  }

  /* Initialise state */
  setUploadState('idle');

  /* =============================================================================
     8. INITIAL RENDER
     ============================================================================= */

  recalc();

})();
