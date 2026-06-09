(function(){
  "use strict";

  const STORAGE_KEY = "spacex-dashboard-language";
  const PDF_FILENAME = "spacex-thesis-valuation-dashboard.pdf";
  const PDF_PAGE_MARGIN = 28;
  const PDF_RENDER_SCALE = 1.5;
  const PDF_IMAGE_QUALITY = 0.92;
  const LANGUAGE_PAGES = {
    en: "spacex-dashboard.html",
    fr: "spacex-dashboard.fr.html",
    de: "spacex-dashboard.de.html",
    zh: "spacex-dashboard.zh.html",
    "pt-BR": "spacex-dashboard.pt-br.html",
    es: "spacex-dashboard.es.html"
  };

  function readStoredLanguage(){
    try{
      return window.localStorage.getItem(STORAGE_KEY);
    }catch(error){
      return null;
    }
  }

  function storeLanguage(lang){
    try{
      window.localStorage.setItem(STORAGE_KEY, lang);
    }catch(error){}
  }

  function pageLanguage(){
    const lang = document.documentElement.dataset.dashboardLang;
    if(lang) return lang;
    const page = decodeURIComponent(window.location.pathname.split("/").pop() || "");
    const entry = Object.entries(LANGUAGE_PAGES).find(([, filename]) => filename === page);
    return entry ? entry[0] : null;
  }

  function currentPageName(){
    return decodeURIComponent(window.location.pathname.split("/").pop() || LANGUAGE_PAGES.en);
  }

  function navigateToLanguage(lang){
    const filename = LANGUAGE_PAGES[lang] || LANGUAGE_PAGES.en;
    if(currentPageName() === filename) return;
    const hash = window.location.hash || "";
    window.location.href = `${filename}${hash}`;
  }

  function initLanguageSwitcher(){
    const switcher = document.querySelector("[data-language-switcher]");
    if(!switcher) return;
    const trigger = switcher.querySelector("[data-language-trigger]");
    const menu = switcher.querySelector("[data-language-menu]");
    const current = switcher.querySelector("[data-language-current]");
    const options = Array.from(switcher.querySelectorAll("[data-lang-option]"));
    if(!trigger || !menu || !current || !options.length) return;

    function setOpen(open){
      switcher.classList.toggle("is-open", open);
      menu.hidden = !open;
      trigger.setAttribute("aria-expanded", String(open));
    }

    function selectLanguage(lang){
      const option = options.find((candidate) => candidate.dataset.lang === lang) || options[0];
      const htmlLang = option.dataset.htmlLang || option.dataset.lang || "en";
      document.documentElement.lang = htmlLang;
      current.textContent = option.dataset.langCode || option.dataset.lang.toUpperCase();
      options.forEach((candidate) => {
        candidate.setAttribute("aria-checked", String(candidate === option));
      });
      storeLanguage(option.dataset.lang || "en");
    }

    trigger.addEventListener("click", () => {
      setOpen(menu.hidden);
    });

    options.forEach((option) => {
      option.addEventListener("click", () => {
        const lang = option.dataset.lang || "en";
        selectLanguage(lang);
        setOpen(false);
        navigateToLanguage(lang);
        trigger.focus({preventScroll:true});
      });
    });

    document.addEventListener("click", (event) => {
      if(menu.hidden || switcher.contains(event.target)) return;
      setOpen(false);
    });

    document.addEventListener("keydown", (event) => {
      if(event.key !== "Escape" || menu.hidden) return;
      setOpen(false);
      trigger.focus({preventScroll:true});
    });

    selectLanguage(pageLanguage() || readStoredLanguage() || "en");
  }

  function wait(ms){
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function waitForFrames(count){
    return new Promise((resolve) => {
      function step(remaining){
        if(remaining <= 0){
          resolve();
          return;
        }
        window.requestAnimationFrame(() => step(remaining - 1));
      }
      step(count);
    });
  }

  function expandCardsForPrint(){
    const state = [];
    document.querySelectorAll("[data-expand-card]").forEach((card) => {
      const body = card.querySelector(".expand-body");
      state.push({
        card,
        wasOpen: card.classList.contains("is-open"),
        body,
        height: body ? body.style.height : ""
      });
      card.classList.add("is-open");
      if(body) body.style.height = "auto";
    });
    return function restore(){
      state.forEach((entry) => {
        entry.card.classList.toggle("is-open", entry.wasOpen);
        if(entry.body) entry.body.style.height = entry.height;
      });
    };
  }

  function revealAllForPrint(){
    document.querySelectorAll(".reveal").forEach((element) => {
      element.classList.add("is-visible");
    });
  }

  function createPdfProgress(){
    const overlay = document.createElement("div");
    overlay.className = "pdf-export-overlay";
    overlay.hidden = true;
    overlay.setAttribute("role", "status");
    overlay.setAttribute("aria-live", "polite");
    overlay.setAttribute("data-html2canvas-ignore", "true");
    overlay.innerHTML = '<span data-pdf-status>Preparing PDF</span><span class="pdf-export-progress" aria-hidden="true"><span></span></span>';
    document.body.appendChild(overlay);
    const text = overlay.querySelector("[data-pdf-status]");
    const bar = overlay.querySelector(".pdf-export-progress span");
    return {
      show(message, percent){
        overlay.hidden = false;
        if(text) text.textContent = message;
        if(bar) bar.style.setProperty("--pdf-progress", `${Math.max(0, Math.min(100, percent || 0))}%`);
      },
      hide(){
        overlay.hidden = true;
      },
      remove(){
        overlay.remove();
      }
    };
  }

  async function preparePrintablePage(progress){
    const initialScroll = {x: window.scrollX, y: window.scrollY};
    document.body.classList.add("pdf-exporting");
    document.body.classList.toggle("pdf-file-export", window.location.protocol === "file:");
    if(progress) progress.show("Generating PDF", 4);
    revealAllForPrint();
    const restoreCards = expandCardsForPrint();
    if(window.SpaceXDashboardCharts && typeof window.SpaceXDashboardCharts.prepareForPrint === "function"){
      window.SpaceXDashboardCharts.prepareForPrint(document);
    }
    window.scrollTo(0, 0);
    await waitForFrames(2);
    await wait(240);
    return function restore(){
      restoreCards();
      document.body.classList.remove("pdf-exporting");
      document.body.classList.remove("pdf-file-export");
      window.scrollTo(initialScroll.x, initialScroll.y);
    };
  }

  function getPdfTools(){
    const html2canvas = window.html2canvas;
    const jsPDF = window.jspdf && window.jspdf.jsPDF;
    if(!html2canvas || !jsPDF){
      throw new Error("PDF renderer libraries are not available.");
    }
    return {html2canvas, jsPDF};
  }

  function setExportLabel(label, value){
    if(label) label.textContent = value;
  }

  function pdfTargets(){
    const targets = [];
    document.querySelectorAll(".site-shell > .page").forEach((page) => {
      const inner = page.querySelector(".page-inner");
      if(!inner) return;
      Array.from(inner.children).forEach((child) => {
        if(child.matches(".chart-accordion,.interactive-grid,.company-grid,.risk-list,.annex-grid")){
          child.querySelectorAll(".expand-card").forEach((card) => targets.push(card));
          return;
        }
        targets.push(child);
      });
    });
    document.querySelectorAll(".footer").forEach((footer) => targets.push(footer));
    return targets
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 20 && rect.height > 20;
      });
  }

  function elementSize(element){
    const rect = element.getBoundingClientRect();
    return {
      width: Math.ceil(Math.max(element.scrollWidth, rect.width, window.innerWidth)),
      height: Math.ceil(Math.max(element.scrollHeight, rect.height))
    };
  }

  function canvasJpeg(canvas){
    return canvas.toDataURL("image/jpeg", PDF_IMAGE_QUALITY);
  }

  function ignoreExportElement(element){
    if(element.hasAttribute("data-html2canvas-ignore")) return true;
    const tagName = element.tagName;
    return window.location.protocol === "file:" && (tagName === "IMG" || tagName === "VIDEO" || tagName === "SOURCE");
  }

  function createPdf(jsPDF){
    const pdf = new jsPDF({orientation: "portrait", unit: "pt", format: "a4", compress: true});
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const contentW = pageW - (PDF_PAGE_MARGIN * 2);
    const contentH = pageH - (PDF_PAGE_MARGIN * 2);
    const gap = 18;
    let y = PDF_PAGE_MARGIN;
    let pageEmpty = true;

    function paintBackground(){
      pdf.setFillColor(5, 5, 7);
      pdf.rect(0, 0, pageW, pageH, "F");
    }

    function addPage(){
      pdf.addPage();
      y = PDF_PAGE_MARGIN;
      pageEmpty = true;
      paintBackground();
    }

    paintBackground();
    return {
      pdf,
      // Scale each captured section to fit the page width; if it would be taller
      // than a full page, scale to fit the page height instead, so every block
      // always fits entirely on one page (never sliced/cut). Centered horizontally.
      addCanvas(canvas){
        if(!canvas.width || !canvas.height) return;
        let drawW = contentW;
        let drawH = drawW * (canvas.height / canvas.width);
        if(drawH > contentH){
          drawH = contentH;
          drawW = drawH * (canvas.width / canvas.height);
        }
        if(!pageEmpty && y + drawH > pageH - PDF_PAGE_MARGIN) addPage();
        const x = (pageW - drawW) / 2;
        pdf.addImage(canvasJpeg(canvas), "JPEG", x, y, drawW, drawH, undefined, "FAST");
        y += drawH + gap;
        pageEmpty = false;
      }
    };
  }

  function downloadPdfBlob(pdf){
    const blob = pdf.output("blob");
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = PDF_FILENAME;
    link.rel = "noopener";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
      link.remove();
    }, 30000);
  }

  async function downloadDashboardPdf(label, progress){
    const {html2canvas, jsPDF} = getPdfTools();
    const scale = Math.min(PDF_RENDER_SCALE, Math.max(1, window.devicePixelRatio || 1));
    const targets = pdfTargets();
    if(!targets.length) throw new Error("No dashboard sections were available to export.");
    const packer = createPdf(jsPDF);

    for(let targetIndex = 0; targetIndex < targets.length; targetIndex += 1){
      const target = targets[targetIndex];
      const {width, height} = elementSize(target);
      const percent = 10 + Math.round((targetIndex / targets.length) * 82);
      setExportLabel(label, `${targetIndex + 1}/${targets.length}`);
      if(progress) progress.show(`Rendering section ${targetIndex + 1} of ${targets.length}`, percent);
      target.scrollIntoView({block: "start", inline: "nearest"});
      await waitForFrames(2);

      const canvas = await html2canvas(target, {
        allowTaint: false,
        backgroundColor: "#050507",
        height,
        imageTimeout: 8000,
        ignoreElements: ignoreExportElement,
        logging: false,
        scale,
        scrollX: 0,
        scrollY: -window.scrollY,
        useCORS: true,
        width,
        windowHeight: window.innerHeight,
        windowWidth: Math.max(width, window.innerWidth)
      });

      packer.addCanvas(canvas);
      canvas.width = 1;
      canvas.height = 1;
    }

    setExportLabel(label, "Downloading");
    if(progress) progress.show("Downloading PDF", 98);
    downloadPdfBlob(packer.pdf);
  }

  function initPdfExport(){
    const button = document.querySelector("[data-pdf-export]");
    if(!button) return;
    const label = button.querySelector("[data-pdf-label]");
    const originalLabel = label ? label.textContent : "PDF";
    const progress = createPdfProgress();

    button.addEventListener("click", async () => {
      if(button.disabled) return;
      button.disabled = true;
      button.classList.add("is-busy");
      button.setAttribute("aria-busy", "true");
      if(label) label.textContent = "Preparing";

      const originalTitle = document.title;
      let restore = function(){};
      let finished = false;
      function finish(options){
        if(finished) return;
        finished = true;
        restore();
        document.title = originalTitle;
        button.disabled = false;
        button.classList.remove("is-busy");
        button.removeAttribute("aria-busy");
        if(label) label.textContent = originalLabel;
        if(!options || !options.keepProgress) progress.hide();
      }

      try{
        restore = await preparePrintablePage(progress);
        await downloadDashboardPdf(label, progress);
        finish();
      }catch(error){
        progress.show("PDF export failed. Check the console.", 100);
        finish({keepProgress:true});
        window.setTimeout(() => progress.hide(), 6000);
        console.error("PDF export failed", error);
      }
    });
  }

  initLanguageSwitcher();
  initPdfExport();

  window.SpaceXDashboardControls = Object.assign(window.SpaceXDashboardControls || {}, {
    preparePrintablePage
  });
})();
