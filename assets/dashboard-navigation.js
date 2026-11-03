(function(){
    document.querySelectorAll(".page").forEach((page) => {
      page.classList.add("scroll-scene");
      page.querySelectorAll(".page-kicker").forEach((element) => element.classList.add("reveal-kicker"));
      page.querySelectorAll("h1,h2").forEach((element) => element.classList.add("reveal-title"));
      page.querySelectorAll(".lede,.hero-subtitle").forEach((element) => element.classList.add("reveal-copy"));
      page.querySelectorAll(".reveal").forEach((element, elementIndex) => {
        const isTextLead = element.matches(".page-kicker,h1,h2,.lede,.hero-subtitle");
        if(!isTextLead) element.classList.add("flow-from-bottom");
        element.style.setProperty("--reveal-delay", `${Math.min(elementIndex * 45, 180)}ms`);
      });
      page.querySelectorAll(".expand-card").forEach((card, cardIndex) => {
        card.classList.add("flow-from-bottom");
        card.style.setProperty("--reveal-delay", `${Math.min(cardIndex * 35, 210)}ms`);
      });
    });

    const reveals = document.querySelectorAll(".reveal");
    const revealObserver = new IntersectionObserver((entries, observerInstance) => {
      entries.forEach((entry) => {
        if(!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observerInstance.unobserve(entry.target);
      });
    }, {threshold:.08, rootMargin:"0px 0px -8% 0px"});
    reveals.forEach((element) => revealObserver.observe(element));
    let revealSyncQueued = false;
    function syncPassedReveals(){
      reveals.forEach((element) => {
        if(element.classList.contains("is-visible")) return;
        const rect = element.getBoundingClientRect();
        if(rect.top < window.innerHeight * .9){
          element.classList.add("is-visible");
          revealObserver.unobserve(element);
        }
      });
      revealSyncQueued = false;
    }
    function queueRevealSync(){
      if(revealSyncQueued) return;
      revealSyncQueued = true;
      requestAnimationFrame(syncPassedReveals);
    }
    queueRevealSync();

    const navLinks = document.querySelectorAll("[data-nav]");
    const transition = document.querySelector(".page-transition");
    navLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href");
        if(!href || !href.startsWith("#")) return;
        event.preventDefault();
        transition.classList.add("active");
        setTimeout(() => {
          document.querySelector(href)?.scrollIntoView({behavior:"smooth", block:"start"});
          history.replaceState(null, "", href);
          transition.classList.remove("active");
        }, 260);
      });
    });

    const pages = document.querySelectorAll(".page[id]");
    function activatePage(page){
      if(!page) return;
      pages.forEach((candidate) => candidate.classList.toggle("is-current", candidate === page));
      document.querySelectorAll(".nav-links a").forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === "#" + page.id);
      });
    }
    function syncCurrentPage(){
      let activePage = pages[0];
      let activeDistance = Number.POSITIVE_INFINITY;
      pages.forEach((page) => {
        const rect = page.getBoundingClientRect();
        if(rect.bottom < 96 || rect.top > window.innerHeight * .72) return;
        const distance = Math.abs(rect.top - 86);
        if(distance < activeDistance){
          activeDistance = distance;
          activePage = page;
        }
      });
      activatePage(activePage);
    }
    syncCurrentPage();
    const pageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if(!entry.isIntersecting) return;
        activatePage(entry.target);
      });
    }, {threshold:.24});
    pages.forEach((page) => pageObserver.observe(page));

    if(location.hash){
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.querySelector(location.hash)?.scrollIntoView({block:"start"});
          syncCurrentPage();
          queueRevealSync();
        });
      });
    }

    window.addEventListener("scroll", () => {
      queueRevealSync();
      syncCurrentPage();
    }, {passive:true});
})();
