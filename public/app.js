/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/assets/styles/app.css"
/*!***********************************!*\
  !*** ./src/assets/styles/app.css ***!
  \***********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("{__webpack_require__.r(__webpack_exports__);\n// extracted by mini-css-extract-plugin\n\n\n//# sourceURL=webpack://printer-theme/./src/assets/styles/app.css?\n}");

/***/ },

/***/ "./src/assets/js/app.js"
/*!******************************!*\
  !*** ./src/assets/js/app.js ***!
  \******************************/
() {

eval("{/* =============================================================================\n   PrinterTheme — app.js\n   Global behaviour shared across every page:\n     1.  Back-to-top button         — scroll-triggered fade + smooth scroll\n     2.  Sticky header shadow       — subtle elevation when user scrolls down\n     3.  Active nav-link highlight  — marks the current page in the navbar\n     4.  Generic qty stepper        — .btn-plus / .btn-minus inside .quantity\n     5.  Mobile drawer              — hamburger open, backdrop/×-button close,\n                                     ESC-key dismiss, focus-trap, ARIA updates\n     6.  Mobile search toggle       — shows/hides the inline search bar\n     7.  Dragover CSS classes       — visual feedback on the upload drop-zone\n     8.  Salla cart-count sync      — keeps #cart-count badge in sync via SDK\n   ============================================================================= */\n\n(function ($) {\n  'use strict';\n\n  /* ── 1. Back-to-top ──────────────────────────────────────────────────────── */\n  var $backToTop = $('.back-to-top');\n  $(window).on('scroll.backToTop', function () {\n    if ($(this).scrollTop() > 300) {\n      $backToTop.addClass('is-visible');\n    } else {\n      $backToTop.removeClass('is-visible');\n    }\n  });\n  $backToTop.on('click', function (e) {\n    e.preventDefault();\n    $('html, body').animate({\n      scrollTop: 0\n    }, 600, 'swing');\n  });\n\n  /* ── 2. Sticky header shadow ─────────────────────────────────────────────── */\n\n  var $navbar = $('nav.navbar, .site-header__main');\n  $(window).on('scroll.stickyNav', function () {\n    if ($(this).scrollTop() > 10) {\n      $navbar.addClass('shadow-sm');\n    } else {\n      $navbar.removeClass('shadow-sm');\n    }\n  });\n\n  /* ── 3. Active nav-link highlight ───────────────────────────────────────── */\n\n  var currentPath = window.location.pathname;\n  $('.navbar-nav .nav-link, .site-header__menu a').each(function () {\n    var href = $(this).attr('href') || '';\n    if (href && href !== '/' && currentPath.indexOf(href) === 0) {\n      $(this).addClass('active is-active');\n    } else if (href === currentPath) {\n      $(this).addClass('active is-active');\n    }\n  });\n\n  /* ── 4. Generic qty stepper ─────────────────────────────────────────────── */\n\n  $(document).on('click', '.btn-plus', function () {\n    var $input = $(this).closest('.quantity').find('input[type=\"number\"], input[type=\"text\"]');\n    if (!$input.length) return;\n    var step = parseInt($input.attr('step'), 10) || 1;\n    var max = parseInt($input.attr('max'), 10);\n    var next = (parseInt($input.val(), 10) || 0) + step;\n    if (!isNaN(max) && next > max) return;\n    $input.val(next).trigger('change');\n  });\n  $(document).on('click', '.btn-minus', function () {\n    var $input = $(this).closest('.quantity').find('input[type=\"number\"], input[type=\"text\"]');\n    if (!$input.length) return;\n    var step = parseInt($input.attr('step'), 10) || 1;\n    var min = parseInt($input.attr('min'), 10);\n    if (isNaN(min)) min = 1;\n    var next = (parseInt($input.val(), 10) || min) - step;\n    if (next < min) return;\n    $input.val(next).trigger('change');\n  });\n\n  /* ── 5. Mobile drawer ───────────────────────────────────────────────────── */\n\n  var DRAWER_ID = 'mobile-drawer';\n  var $drawer = $('#' + DRAWER_ID);\n  var $body = $('body');\n  var _lastFocus;\n  function openDrawer() {\n    _lastFocus = document.activeElement;\n    $drawer.addClass('is-open').attr('aria-hidden', 'false');\n    $body.addClass('has-drawer-open');\n    $('[aria-controls=\"' + DRAWER_ID + '\"]').attr('aria-expanded', 'true');\n    /* Move focus into the panel for accessibility */\n    var $panel = $drawer.find('.mobile-drawer__panel');\n    $panel.attr('tabindex', '-1').focus();\n  }\n  function closeDrawer() {\n    $drawer.removeClass('is-open').attr('aria-hidden', 'true');\n    $body.removeClass('has-drawer-open');\n    $('[aria-controls=\"' + DRAWER_ID + '\"]').attr('aria-expanded', 'false');\n    if (_lastFocus) {\n      _lastFocus.focus();\n    }\n  }\n\n  /* Open — hamburger button */\n  $(document).on('click', '[data-toggle=\"mobile-drawer\"]', function () {\n    if ($drawer.hasClass('is-open')) {\n      closeDrawer();\n    } else {\n      openDrawer();\n    }\n  });\n\n  /* Close — × button or backdrop */\n  $(document).on('click', '[data-close=\"mobile-drawer\"]', function () {\n    closeDrawer();\n  });\n\n  /* Close — ESC key */\n  $(document).on('keydown', function (e) {\n    if ((e.key === 'Escape' || e.keyCode === 27) && $drawer.hasClass('is-open')) {\n      closeDrawer();\n    }\n  });\n\n  /* Close — click outside the panel (on the overlay itself) */\n  $drawer.on('click', function (e) {\n    if ($(e.target).is($drawer)) {\n      closeDrawer();\n    }\n  });\n\n  /* ── 6. Mobile search toggle ────────────────────────────────────────────── */\n\n  $(document).on('click', '[data-toggle=\"mobile-search\"]', function () {\n    var $searchBar = $('.site-header__search--mobile');\n    var isHidden = $searchBar.prop('hidden');\n    $searchBar.prop('hidden', !isHidden);\n    if (isHidden) {\n      $searchBar.find('input').focus();\n    }\n  });\n\n  /* ── 7. Upload-zone dragover CSS classes ────────────────────────────────── */\n\n  var uploadZone = document.getElementById('upload-zone');\n  if (uploadZone) {\n    uploadZone.addEventListener('dragenter', function (e) {\n      e.preventDefault();\n      this.classList.add('dragover');\n    });\n    uploadZone.addEventListener('dragover', function (e) {\n      e.preventDefault();\n      this.classList.add('dragover');\n    });\n    uploadZone.addEventListener('dragleave', function (e) {\n      /* Only remove the class when leaving the zone (not a child element) */\n      if (!this.contains(e.relatedTarget)) {\n        this.classList.remove('dragover');\n      }\n    });\n    uploadZone.addEventListener('drop', function (e) {\n      e.preventDefault();\n      this.classList.remove('dragover');\n    });\n  }\n\n  /* ── 8. Salla cart-count sync ───────────────────────────────────────────── */\n  /*\n     Salla exposes a global `salla` object once Twilight is bootstrapped.\n     The canonical entry point is `salla.onReady(cb)` (NOT a `salla:ready`\n     DOM event). For cart updates the typed API `salla.cart.event.onUpdated`\n     is preferred and ships with `summary` shaped data (count, total, items).\n  */\n\n  function whenSallaReady(cb) {\n    if (typeof salla !== 'undefined' && typeof salla.onReady === 'function') {\n      salla.onReady(cb);\n    } else {\n      /* Fallback: poll briefly until Twilight injects the SDK. */\n      var tries = 0;\n      var t = setInterval(function () {\n        if (typeof salla !== 'undefined' && typeof salla.onReady === 'function') {\n          clearInterval(t);\n          salla.onReady(cb);\n        } else if (++tries > 50) {\n          clearInterval(t);\n        }\n      }, 100);\n    }\n  }\n  function paintCartCount(count) {\n    var badge = document.getElementById('cart-count');\n    if (!badge) return;\n    badge.textContent = typeof salla !== 'undefined' && salla.helpers && salla.helpers.number ? salla.helpers.number(count) : count;\n    badge.classList.remove('badge-pulse');\n    void badge.offsetWidth;\n    badge.classList.add('badge-pulse');\n  }\n  whenSallaReady(function () {\n    if (salla.cart && salla.cart.event && typeof salla.cart.event.onUpdated === 'function') {\n      salla.cart.event.onUpdated(function (summary) {\n        var count = summary && summary.count !== undefined ? summary.count : 0;\n        paintCartCount(count);\n        document.querySelectorAll('[data-cart-count]').forEach(function (el) {\n          el.textContent = salla.helpers && salla.helpers.number ? salla.helpers.number(count) : count;\n        });\n        if (salla.money && summary && summary.total !== undefined) {\n          document.querySelectorAll('[data-cart-total]').forEach(function (el) {\n            el.innerHTML = salla.money(summary.total);\n          });\n        }\n      });\n    }\n  });\n})(jQuery);\n\n//# sourceURL=webpack://printer-theme/./src/assets/js/app.js?\n}");

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	__webpack_modules__["./src/assets/styles/app.css"](0,{},__webpack_require__);
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/assets/js/app.js"](0,__webpack_exports__,__webpack_require__);
/******/ 	
/******/ })()
;