/* =============================================================================
   PrinterTheme — app.js
   Global behaviour shared across every page:
     1.  Back-to-top button         — scroll-triggered fade + smooth scroll
     2.  Sticky header shadow       — subtle elevation when user scrolls down
     3.  Active nav-link highlight  — marks the current page in the navbar
     4.  Generic qty stepper        — .btn-plus / .btn-minus inside .quantity
     5.  Mobile drawer              — hamburger open, backdrop/×-button close,
                                     ESC-key dismiss, focus-trap, ARIA updates
     6.  Mobile search toggle       — shows/hides the inline search bar
     7.  Dragover CSS classes       — visual feedback on the upload drop-zone
     8.  Salla cart-count sync      — keeps #cart-count badge in sync via SDK
   ============================================================================= */

(function ($) {
  'use strict';

  /* ── 1. Back-to-top ──────────────────────────────────────────────────────── */

  var $backToTop = $('.back-to-top');

  $(window).on('scroll.backToTop', function () {
    if ($(this).scrollTop() > 300) {
      $backToTop.addClass('is-visible');
    } else {
      $backToTop.removeClass('is-visible');
    }
  });

  $backToTop.on('click', function (e) {
    e.preventDefault();
    $('html, body').animate({ scrollTop: 0 }, 600, 'swing');
  });

  /* ── 2. Sticky header shadow ─────────────────────────────────────────────── */

  var $navbar = $('nav.navbar, .site-header__main');

  $(window).on('scroll.stickyNav', function () {
    if ($(this).scrollTop() > 10) {
      $navbar.addClass('shadow-sm');
    } else {
      $navbar.removeClass('shadow-sm');
    }
  });

  /* ── 3. Active nav-link highlight ───────────────────────────────────────── */

  var currentPath = window.location.pathname;
  $('.navbar-nav .nav-link, .site-header__menu a').each(function () {
    var href = $(this).attr('href') || '';
    if (href && href !== '/' && currentPath.indexOf(href) === 0) {
      $(this).addClass('active is-active');
    } else if (href === currentPath) {
      $(this).addClass('active is-active');
    }
  });

  /* ── 4. Generic qty stepper ─────────────────────────────────────────────── */

  $(document).on('click', '.btn-plus', function () {
    var $input = $(this).closest('.quantity').find('input[type="number"], input[type="text"]');
    if (!$input.length) return;
    var step  = parseInt($input.attr('step'), 10) || 1;
    var max   = parseInt($input.attr('max'), 10);
    var next  = (parseInt($input.val(), 10) || 0) + step;
    if (!isNaN(max) && next > max) return;
    $input.val(next).trigger('change');
  });

  $(document).on('click', '.btn-minus', function () {
    var $input = $(this).closest('.quantity').find('input[type="number"], input[type="text"]');
    if (!$input.length) return;
    var step = parseInt($input.attr('step'), 10) || 1;
    var min  = parseInt($input.attr('min'),  10);
    if (isNaN(min)) min = 1;
    var next = (parseInt($input.val(), 10) || min) - step;
    if (next < min) return;
    $input.val(next).trigger('change');
  });

  /* ── 5. Mobile drawer ───────────────────────────────────────────────────── */

  var DRAWER_ID = 'mobile-drawer';
  var $drawer   = $('#' + DRAWER_ID);
  var $body     = $('body');
  var _lastFocus;

  function openDrawer() {
    _lastFocus = document.activeElement;
    $drawer
      .addClass('is-open')
      .attr('aria-hidden', 'false');
    $body.addClass('has-drawer-open');
    $('[aria-controls="' + DRAWER_ID + '"]').attr('aria-expanded', 'true');
    /* Move focus into the panel for accessibility */
    var $panel = $drawer.find('.mobile-drawer__panel');
    $panel.attr('tabindex', '-1').focus();
  }

  function closeDrawer() {
    $drawer
      .removeClass('is-open')
      .attr('aria-hidden', 'true');
    $body.removeClass('has-drawer-open');
    $('[aria-controls="' + DRAWER_ID + '"]').attr('aria-expanded', 'false');
    if (_lastFocus) { _lastFocus.focus(); }
  }

  /* Open — hamburger button */
  $(document).on('click', '[data-toggle="mobile-drawer"]', function () {
    if ($drawer.hasClass('is-open')) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

  /* Close — × button or backdrop */
  $(document).on('click', '[data-close="mobile-drawer"]', function () {
    closeDrawer();
  });

  /* Close — ESC key */
  $(document).on('keydown', function (e) {
    if ((e.key === 'Escape' || e.keyCode === 27) && $drawer.hasClass('is-open')) {
      closeDrawer();
    }
  });

  /* Close — click outside the panel (on the overlay itself) */
  $drawer.on('click', function (e) {
    if ($(e.target).is($drawer)) {
      closeDrawer();
    }
  });

  /* ── 6. Mobile search toggle ────────────────────────────────────────────── */

  $(document).on('click', '[data-toggle="mobile-search"]', function () {
    var $searchBar = $('.site-header__search--mobile');
    var isHidden   = $searchBar.prop('hidden');
    $searchBar.prop('hidden', !isHidden);
    if (isHidden) {
      $searchBar.find('input').focus();
    }
  });

  /* ── 7. Upload-zone dragover CSS classes ────────────────────────────────── */

  var uploadZone = document.getElementById('upload-zone');
  if (uploadZone) {
    uploadZone.addEventListener('dragenter', function (e) {
      e.preventDefault();
      this.classList.add('dragover');
    });

    uploadZone.addEventListener('dragover', function (e) {
      e.preventDefault();
      this.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', function (e) {
      /* Only remove the class when leaving the zone (not a child element) */
      if (!this.contains(e.relatedTarget)) {
        this.classList.remove('dragover');
      }
    });

    uploadZone.addEventListener('drop', function (e) {
      e.preventDefault();
      this.classList.remove('dragover');
    });
  }

  /* ── 8. Salla cart-count sync ───────────────────────────────────────────── */

  function sallaReady(cb) {
    if (typeof salla !== 'undefined') {
      cb();
    } else {
      document.addEventListener('salla:ready', cb, { once: true });
    }
  }

  sallaReady(function () {
    if (salla.event && typeof salla.event.on === 'function') {
      salla.event.on('cart.updated', function (data) {
        var count = 0;
        if (data) {
          /* Salla may pass the cart object directly or nested under .cart */
          count = (data.count !== undefined)
            ? data.count
            : (data.cart && data.cart.count !== undefined ? data.cart.count : 0);
        }
        var badge = document.getElementById('cart-count');
        if (badge) {
          badge.textContent = count;
          /* Subtle pulse animation to draw attention to the badge change */
          badge.classList.remove('badge-pulse');
          /* Force reflow so the animation re-triggers if already applied */
          void badge.offsetWidth;
          badge.classList.add('badge-pulse');
        }
      });
    }
  });

}(jQuery));
