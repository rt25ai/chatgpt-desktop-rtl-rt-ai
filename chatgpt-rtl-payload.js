// ===========================================================================
// RT-AI ChatGPT RTL Patch - Smart RTL Detection & Alignment
//
// Adds automatic right-to-left support to the unified ChatGPT desktop app
// ("Powered by Codex & OWL" - the merged ChatGPT Work + Codex app) on
// Windows and macOS. Detects Hebrew and Arabic text in the composer and
// streamed responses, aligns RTL content naturally, and keeps code blocks
// left-to-right.
//
// The marker strings and window flags keep the historical CODEX names so
// re-patching an install made by the older Codex-RT-AI patcher stays
// idempotent.
//
// ---------------------------------------------------------------------------
// THE ONE RULE THIS PATCH IS BUILT AROUND: never write dir= or lang=
// ---------------------------------------------------------------------------
// The ChatGPT desktop UI is built with Tailwind v4. Its `rtl:` variant
// compiles to selectors shaped like:
//
//   .rtl\:end-4:where(:is(:lang(ar),...,:lang(he),...),[dir=rtl],[dir=rtl] *)
//       { inset-inline-end: ... }
//
// so putting dir="rtl" (or lang="he") on ANY element switches those rules on
// for that element and every descendant. This build ships 30 such rules -
// flex-row-reverse, rotate-180, translate-x-full, inset-inline-end - and on
// top of that the UA stylesheet maps [dir=rtl] to direction:rtl, which flips
// ~280 logical-property declarations (padding-inline-*, margin-inline-*,
// inset-inline-*).
//
// Applied to app chrome that was laid out for LTR, that reverses flex rows,
// rotates chevrons 180deg and translates popovers, switches and menus away
// from where they are painted - so clicks land on empty space. That is what
// made buttons stop responding in the previous version of this patch.
//
// Two facts (verified in Chromium) make a safe patch possible:
//   1. The CSS `direction` property does NOT match [dir=rtl] or :dir(rtl).
//      Setting direction in CSS flips logical properties without ever waking
//      up the app's rtl: variants.
//   2. `unicode-bidi: plaintext` resolves each paragraph's base direction
//      from its first strong character, and `text-align: start` resolves
//      against that. It aligns Hebrew right and English left with zero
//      layout change - it is not an inherited property, so it only ever
//      affects the inline content of the element it is set on.
//
// So: alignment is done in CSS, the stylesheet is injected into its own
// lowest-priority cascade layer (every app rule keeps winning), and the small
// amount of JavaScript only ever toggles a class - never dir, never lang,
// never an inline style.
//
// Part of the RT-AI tooling suite (https://rt-ai.co.il).
// ===========================================================================

// --- RT-AI CODEX RTL PATCH START ---
;(function () {
    "use strict";

    if (typeof window === "undefined" || typeof document === "undefined") return;
    if (window.__RT_AI_CODEX_RTL_PATCH__) return;
    window.__RT_AI_CODEX_RTL_PATCH__ = true;

    var VERSION = "2.1.0";
    var STYLE_ID = "rt-ai-codex-rtl-styles";

    // Class names the patch owns. Nothing else about an element is touched.
    var CLS_FLIP = "rt-ai-rtl";         // structural flip: lists, blockquotes
    var CLS_TEXT = "rt-ai-rtl-text";    // force a text block to an RTL base
    var CLS_NODRAG = "rt-ai-nodrag";    // see fixPhantomDragRegions()

    // Where message content lives. The patch only ever adds classes inside one
    // of these; if a future build renames them the CSS half still works and
    // the JS half simply does nothing.
    //
    // The desktop build renders every message through a CSS-module wrapper
    // named _MarkdownRoot_<hash> - the hash changes with each release but the
    // component name does not, so match on the prefix. The rest are the hooks
    // chatgpt.com and older desktop builds use.
    var CONTENT_ROOT_SEL = [
        "[class*=\"_MarkdownRoot_\"]",
        ".markdown",
        ".prose",
        "[data-message-author-role]",
        "[data-testid^=\"conversation-turn\"]",
        "article"
    ].join(", ");

    // Blocks whose base direction we may override.
    var BLOCK_SEL = "p, li, blockquote, h1, h2, h3, h4, h5, h6, dd, dt, td, th, figcaption";
    // Containers we flip structurally so bullets, numbers and quote bars sit
    // on the correct side.
    var FLIP_SEL = "ul, ol, blockquote";

    var CODE_SEL = "pre, code, kbd, samp, .cm-editor, .monaco-editor, .shiki, .hljs, [data-language]";
    var EDITABLE_SEL = "[contenteditable=\"true\"], [contenteditable=\"\"]";

    var NODRAG_MAX_TOP = 200;    // px from the top of the viewport
    var NODRAG_MAX_SCAN = 6000;  // elements examined per pass

    // -----------------------------------------------------------------------
    // Direction detection
    // -----------------------------------------------------------------------

    function isRTLChar(code) {
        return (code >= 0x0590 && code <= 0x05ff) ||   // Hebrew
            (code >= 0x0600 && code <= 0x06ff) ||      // Arabic
            (code >= 0x0700 && code <= 0x074f) ||      // Syriac
            (code >= 0x0750 && code <= 0x077f) ||      // Arabic Supplement
            (code >= 0x0780 && code <= 0x07bf) ||      // Thaana
            (code >= 0x08a0 && code <= 0x08ff) ||      // Arabic Extended-A
            (code >= 0xfb1d && code <= 0xfdff) ||      // Hebrew/Arabic presentation
            (code >= 0xfe70 && code <= 0xfeff);        // Arabic presentation-B
    }

    function isLatinChar(code) {
        return (code >= 0x0041 && code <= 0x005a) ||
            (code >= 0x0061 && code <= 0x007a) ||
            (code >= 0x00c0 && code <= 0x024f);
    }

    // First strong character decides what `unicode-bidi: plaintext` will do on
    // its own, so we only need to intervene when it disagrees with the text as
    // a whole.
    function firstStrong(text) {
        for (var i = 0; i < text.length; i++) {
            var code = text.charCodeAt(i);
            if (isRTLChar(code)) return "rtl";
            if (isLatinChar(code)) return "ltr";
        }
        return null;
    }

    // "ChatGPT הוא כלי מצוין" starts with a Latin product name but is a Hebrew
    // sentence, so plaintext would leave it left-aligned. Decide those by which
    // script actually carries the paragraph. Text that is mostly Latin with a
    // few Hebrew words stays LTR.
    function detectTextDir(text) {
        if (!text) return null;
        var rtl = 0;
        var ltr = 0;
        for (var i = 0; i < text.length; i++) {
            var code = text.charCodeAt(i);
            if (isRTLChar(code)) rtl++;
            else if (isLatinChar(code)) ltr++;
        }
        if (rtl === 0) return "ltr";
        return rtl > ltr ? "rtl" : "ltr";
    }

    // Text of an element with code spans removed - a Hebrew paragraph that
    // quotes a long snippet of English code is still a Hebrew paragraph.
    function textWithoutCode(el, budget) {
        var out = "";
        var nodes = el.childNodes;
        for (var i = 0; i < nodes.length && out.length < budget; i++) {
            var node = nodes[i];
            if (node.nodeType === 3) {
                out += node.nodeValue || "";
            } else if (node.nodeType === 1 && !matches(node, CODE_SEL)) {
                out += textWithoutCode(node, budget - out.length);
            }
        }
        return out;
    }

    // A list gets its base direction from its items, not from the character
    // count of the whole list: one long English bullet inside an otherwise
    // Hebrew list must not drag the markers back to the left. Ties go to RTL,
    // but only when at least one item really is RTL.
    function listDir(el, fallback) {
        if (el.tagName !== "UL" && el.tagName !== "OL") return fallback;
        var items = el.children;
        var rtl = 0;
        var ltr = 0;
        for (var i = 0; i < items.length; i++) {
            if (items[i].tagName !== "LI") continue;
            var d = detectTextDir(textWithoutCode(items[i], TEXT_BUDGET));
            if (d === "rtl") rtl++;
            else if (d === "ltr") ltr++;
        }
        if (rtl === 0 && ltr === 0) return fallback;
        return rtl >= ltr && rtl > 0 ? "rtl" : "ltr";
    }

    function matches(el, sel) {
        return !!(el && el.matches && el.matches(sel));
    }

    function closest(el, sel) {
        return el && el.closest ? el.closest(sel) : null;
    }

    // -----------------------------------------------------------------------
    // Stylesheet - this is where almost all of the work happens
    // -----------------------------------------------------------------------

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;
        var head = document.head || document.documentElement;
        if (!head) return;

        var style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = [
            // Declared in its own layer, and inserted as the first stylesheet in
            // the document, so `rt-ai-rtl` is the first layer name the cascade
            // sees and therefore the weakest. Every app rule - layered or not -
            // still wins over everything below. No !important anywhere.
            "@layer rt-ai-rtl {",

            // 1. Per-paragraph automatic direction. `unicode-bidi` is not an
            //    inherited property, so each of these only affects the inline
            //    text of the element itself: no box, flexbox or grid layout
            //    changes anywhere in the app.
            //
            //    Deliberately limited to semantic text elements and inputs.
            //    `div`, `span` and `button` are NOT in this list: app chrome is
            //    built out of those, the app already puts dir="auto" on the
            //    chrome text that needs it (conversation titles and so on), and
            //    giving a chrome flex row its own base direction moves its
            //    inline children. Content and input is our business; the app's
            //    own furniture is not.
            "  p, li, blockquote, h1, h2, h3, h4, h5, h6,",
            "  dd, dt, figcaption, caption, td, th,",
            "  textarea, input:not([type]), input[type=\"text\"], input[type=\"search\"],",
            "  .markdown, .prose, .ProseMirror, .ProseMirror > * {",
            "    unicode-bidi: plaintext;",
            "  }",

            // 2. Composer: ProseMirror and other rich editors render each line
            //    as a block child, so give those children their own base
            //    direction too. Purely visual - the editor's own DOM is never
            //    modified by this patch.
            "  [contenteditable=\"true\"] > div, [contenteditable=\"true\"] > p,",
            "  [contenteditable=\"true\"] > li, [contenteditable=\"\"] > div {",
            "    unicode-bidi: plaintext;",
            "  }",

            // 3. Code always reads left to right, including inline code sitting
            //    inside a Hebrew sentence.
            "  pre, code, kbd, samp, .cm-editor, .monaco-editor, .shiki, .hljs, [data-language] {",
            "    direction: ltr;",
            "    unicode-bidi: isolate;",
            "  }",
            "  pre, pre code, .cm-editor, .monaco-editor { text-align: left; }",

            // 4. Structural flip. Applied by the observer below to Hebrew and
            //    Arabic lists and quotes inside message content only, so list
            //    markers, list indentation and quote bars land on the right.
            //    This sets the CSS `direction` property and never the dir
            //    attribute, so the app's Tailwind rtl: variants stay off.
            "  ." + CLS_FLIP + " { direction: rtl; }",
            "  ." + CLS_FLIP + " > li { unicode-bidi: plaintext; }",

            // 5. Force an RTL base on a block whose first strong character is
            //    Latin but whose body is Hebrew or Arabic. `isolate` rather
            //    than `plaintext` here, because plaintext would re-derive the
            //    direction from that same leading Latin word.
            "  ." + CLS_TEXT + " {",
            "    direction: rtl;",
            "    unicode-bidi: isolate;",
            "    text-align: start;",
            "  }",
            "  ." + CLS_TEXT + " pre, ." + CLS_TEXT + " code,",
            "  ." + CLS_FLIP + " pre, ." + CLS_FLIP + " code { direction: ltr; }",

            "}",

            // 6. Deliberately OUTSIDE the layer. Unlayered declarations beat
            //    every layered one, which is what this rule needs: it has to
            //    override the app's own `-webkit-app-region: drag`. It is only
            //    ever applied to elements the scanner below proves are
            //    non-interactive, so it cannot take a real drag handle away.
            "." + CLS_NODRAG + " { -webkit-app-region: no-drag; }"
        ].join("\n");

        // First stylesheet in the document => lowest cascade layer.
        if (head.firstChild) head.insertBefore(style, head.firstChild);
        else head.appendChild(style);
    }

    // -----------------------------------------------------------------------
    // Class toggling - the only DOM writes this patch performs
    // -----------------------------------------------------------------------

    var TEXT_BUDGET = 4000;   // chars of an element we bother to inspect
    var WORK_PER_FRAME = 400; // elements processed per animation frame
    var MAX_QUEUE = 4000;

    var lastSeen = typeof WeakMap === "function" ? new WeakMap() : null;

    function unchanged(el, len) {
        if (!lastSeen) return false;
        if (lastSeen.get(el) === len) return true;
        lastSeen.set(el, len);
        return false;
    }

    function applyTo(el) {
        // Never touch anything the editor owns: ProseMirror rewrites its own
        // DOM and would fight us. The stylesheet already handles the composer.
        if (closest(el, EDITABLE_SEL)) return;
        if (closest(el, CODE_SEL)) return;
        if (!closest(el, CONTENT_ROOT_SEL)) return;

        var raw = el.textContent || "";
        if (unchanged(el, raw.length)) return;
        if (!raw) {
            el.classList.remove(CLS_FLIP, CLS_TEXT);
            return;
        }

        var text = raw.length > TEXT_BUDGET ? raw.slice(0, TEXT_BUDGET) : raw;
        var dir = detectTextDir(textWithoutCode(el, TEXT_BUDGET) || text);

        if (matches(el, FLIP_SEL)) {
            el.classList.toggle(CLS_FLIP, listDir(el, dir) === "rtl");
        }
        if (matches(el, BLOCK_SEL)) {
            // plaintext already gets this right when the first strong character
            // is RTL, so only add the class when the two disagree.
            var needsForce = dir === "rtl" && firstStrong(text) === "ltr";
            el.classList.toggle(CLS_TEXT, needsForce);
        }
    }

    // -----------------------------------------------------------------------
    // Workaround for an upstream bug: the toolbar row is an OS title bar
    // -----------------------------------------------------------------------
    // ChatGPT desktop 26.831 paints several full-width overlays across the
    // toolbar strip that carry BOTH `-webkit-app-region: drag` and
    // `pointer-events: none`. Chromium builds the window's OS drag region from
    // `-webkit-app-region` alone and ignores `pointer-events`, so the whole
    // strip is reported to Windows as HTCAPTION. The notification bell, the
    // search button and the Chat/Work/Codex mode switcher sit inside it, so a
    // real mouse click starts a window drag and never reaches them - while a
    // scripted click works fine, because in the page those overlays are
    // click-through.
    //
    // This is not caused by the RTL patch: an untouched Store install of the
    // same build reports HTCAPTION over exactly the same pixels. The fix is
    // safe by construction - an element that cannot receive pointer events has
    // no business claiming a drag handle, so we only clear the region on
    // elements that are provably non-interactive. The real title bar (which is
    // pointer-events: auto) keeps working, so the window can still be dragged.
    //
    // If OpenAI fixes this upstream, nothing matches and this becomes a no-op.
    var lastNoDragScan = 0;
    // Elements already examined. Keeps the steady-state cost near zero: the
    // first pass pays for the whole document, later passes only look at nodes
    // that appeared since. Cleared whenever a forced rescan is requested.
    var seenForDrag = typeof WeakSet === "function" ? new WeakSet() : null;

    function fixPhantomDragRegions() {
        var els;
        try {
            els = document.querySelectorAll("*");
        } catch (err) {
            return 0;
        }

        var marked = 0;
        var limit = Math.min(els.length, NODRAG_MAX_SCAN);
        for (var i = 0; i < limit; i++) {
            var el = els[i];
            if (seenForDrag) {
                if (seenForDrag.has(el)) continue;
                seenForDrag.add(el);
            }
            if (el.classList.contains(CLS_NODRAG)) continue;

            var rect = el.getBoundingClientRect();
            if (rect.top > NODRAG_MAX_TOP || rect.width < 1 || rect.height < 1) continue;

            var cs = window.getComputedStyle(el);
            // An element that cannot receive pointer events cannot be a drag
            // handle either - that is the whole basis for this workaround, so
            // anything interactive is left exactly as the app declared it.
            if (cs.pointerEvents !== "none") continue;

            var region = cs.webkitAppRegion;
            if (region == null) region = cs.getPropertyValue("-webkit-app-region");
            if (region !== "drag") continue;

            el.classList.add(CLS_NODRAG);
            marked++;
        }
        return marked;
    }

    function scheduleNoDragScan(force) {
        var now = Date.now();
        if (!force && now - lastNoDragScan < 400) return;
        lastNoDragScan = now;
        if (force && typeof WeakSet === "function") seenForDrag = new WeakSet();
        return fixPhantomDragRegions();
    }

    // -----------------------------------------------------------------------
    // Scheduling
    // -----------------------------------------------------------------------

    var queue = [];
    var queued = typeof Set === "function" ? new Set() : null;
    var frame = 0;
    var fullScanPending = false;

    var raf = window.requestAnimationFrame
        ? window.requestAnimationFrame.bind(window)
        : function (fn) { return window.setTimeout(fn, 16); };

    function enqueue(el) {
        if (!el || el.nodeType !== 1) return;
        if (queued) {
            if (queued.has(el)) return;
            queued.add(el);
        }
        queue.push(el);
        if (queue.length > MAX_QUEUE) fullScanPending = true;
    }

    // Collect the candidate elements inside a subtree that was just added or
    // changed - not the whole document.
    function collect(root) {
        if (!root || root.nodeType !== 1) return;
        if (matches(root, FLIP_SEL) || matches(root, BLOCK_SEL)) enqueue(root);
        if (!root.querySelectorAll) return;
        var found = root.querySelectorAll(FLIP_SEL + ", " + BLOCK_SEL);
        for (var i = 0; i < found.length; i++) enqueue(found[i]);
    }

    function scheduleFlush() {
        if (frame) return;
        frame = raf(flush);
    }

    function flush() {
        frame = 0;

        if (fullScanPending) {
            fullScanPending = false;
            queue.length = 0;
            if (queued) queued.clear();
            var roots = document.querySelectorAll(CONTENT_ROOT_SEL);
            for (var r = 0; r < roots.length; r++) collect(roots[r]);
        }

        var budget = WORK_PER_FRAME;
        while (queue.length && budget-- > 0) {
            var el = queue.shift();
            if (queued) queued.delete(el);
            if (!el.isConnected) continue;
            try {
                applyTo(el);
            } catch (err) {
                /* one bad node must never take the observer down */
            }
        }

        // Cheap and throttled: the candidate set is small and the probe runs at
        // most a few times a second, whatever the DOM is doing.
        scheduleNoDragScan(false);

        if (queue.length) scheduleFlush();
    }

    // -----------------------------------------------------------------------
    // Boot
    // -----------------------------------------------------------------------

    function init() {
        injectStyles();

        fullScanPending = true;
        scheduleFlush();

        var observer = new MutationObserver(function (mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var m = mutations[i];
                if (m.type === "characterData") {
                    var host = m.target.parentElement;
                    if (host) {
                        // Streamed tokens land in a text node: re-check the block
                        // that owns it, and the list it may belong to.
                        if (matches(host, FLIP_SEL) || matches(host, BLOCK_SEL)) enqueue(host);
                        var owner = closest(host, FLIP_SEL + ", " + BLOCK_SEL);
                        if (owner && owner !== host) enqueue(owner);
                    }
                    continue;
                }
                for (var j = 0; j < m.addedNodes.length; j++) {
                    var node = m.addedNodes[j];
                    if (node.nodeType === 1) collect(node);
                    else if (node.nodeType === 3 && m.target && m.target.nodeType === 1) collect(m.target);
                }
            }
            // The toolbar re-renders on navigation and on window state changes,
            // so any mutation is a reason to re-check the drag regions. flush()
            // throttles the actual probe.
            scheduleFlush();
        });

        observer.observe(document.body || document.documentElement, {
            childList: true,
            subtree: true,
            characterData: true
        });

        scheduleNoDragScan(true);
        window.addEventListener("resize", function () { scheduleNoDragScan(true); });

        window.__RT_AI_CODEX_RTL_INFO__ = {
            version: VERSION,
            styleId: STYLE_ID,
            classes: [CLS_FLIP, CLS_TEXT, CLS_NODRAG],
            rescan: function () { fullScanPending = true; scheduleFlush(); },
            fixDragRegions: function () { return fixPhantomDragRegions(); }
        };

        console.info("[RT-AI ChatGPT RTL] patch active (v" + VERSION + ")");
    }

    // The stylesheet must go in as early as possible so the first paint is
    // already correct; the observer needs a body.
    injectStyles();

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})()
// --- RT-AI CODEX RTL PATCH END ---
