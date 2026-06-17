/* ===========================================================================
 * dynamic.js — connects the static Del Zotto site to the API without changing
 * the design. It re-renders specific containers using the SAME markup/classes
 * that already exist in the HTML, then re-wires the small interactions
 * (project slider, careers filter, contact map) on the new content.
 *
 * Served from the same origin as the API (Next.js), so it uses relative URLs.
 * ========================================================================= */
(function () {
  'use strict';

  const API = ''; // same-origin
  const $ = (sel, root = document) => root.querySelector(sel);
  const param = (k) => new URLSearchParams(location.search).get(k);
  const esc = (s) =>
    String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  async function getJSON(path) {
    const res = await fetch(API + path, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`${path} -> ${res.status}`);
    return res.json();
  }

  document.addEventListener('DOMContentLoaded', () => {
    try { initProjectViewPage(); } catch (e) { console.error(e); }
    try { initProjectNestedPage(); } catch (e) { console.error(e); }
    try { initCareersPage(); } catch (e) { console.error(e); }
    try { initCareerViewPage(); } catch (e) { console.error(e); }
    try { initContactPage(); } catch (e) { console.error(e); }
    try { initDeliveryQuotePage(); } catch (e) { console.error(e); }
    try { initBlogsPage(); } catch (e) { console.error(e); }
    try { initBlogViewPage(); } catch (e) { console.error(e); }
    try { initGalleryPage(); } catch (e) { console.error(e); }
    try { initHomeArticles(); } catch (e) { console.error(e); }
    try { initHomeProjects(); } catch (e) { console.error(e); }
  });

  /* ---------------------------------------------------- Home "Articles & News"
   * index.html: latest 3 blog posts in .articles-grid.
   */
  function initHomeArticles() {
    const grid = $('.articles-grid');
    if (!grid) return;
    getJSON('/api/blogs').then((blogs) => {
      if (!blogs.length) return;
      grid.innerHTML = blogs.slice(0, 3).map((b) => `
        <a href="blog-view.html?slug=${encodeURIComponent(b.slug)}" class="article-card" style="text-decoration:none;color:inherit;">
          <div class="article-card-img">
            <img src="${esc(b.coverImage || '')}" alt="${esc(b.title)}">
          </div>
          <div class="article-card-body">
            <span class="article-date">${esc(b.date || '')}</span>
            <h3 class="article-card-title">${esc(b.title)}</h3>
          </div>
        </a>`).join('');
    }).catch(console.error);
  }

  /* -------------------------------------------------- Home "Our Projects"
   * index.html: the coverflow slider shows the latest 6 Commercial & Concrete
   * projects (newest added first). Each slide links to its project-nested page.
   * The static demo slides are kept as a fallback when the API has none.
   *
   * script.js wires the slider on the static slides at DOMContentLoaded (before
   * our fetch resolves), so we rebuild the wrapper + controls as fresh nodes
   * (cloneNode drops script.js's listeners) and re-wire the interaction here.
   */
  function homeProjectSlideHTML(p) {
    const img = p.thumbnail || (p.images && p.images[0] && p.images[0].url) || '';
    const tag = [p.tag, p.year].filter(Boolean).join(' / ');
    const href = `project-nested.html?project=${encodeURIComponent(p.id)}`;
    return `
      <div class="project-slide" data-href="${esc(href)}">
        <div class="project-slide-img-wrap">
          <img src="${esc(img)}" alt="${esc(p.title)}">
          <a href="${esc(href)}" class="project-slide-hover-btn" aria-label="View Project">
            <i class="fa-solid fa-arrow-right fa-rotate-by" style="--fa-rotate-angle: -45deg;"></i>
          </a>
        </div>
        <div class="project-slide-info">
          <span class="project-slide-tag">${esc(tag)}</span>
          <h3 class="project-slide-title">${esc(p.title)}</h3>
        </div>
      </div>`;
  }

  function initHomeProjects() {
    const oldWrapper = document.getElementById('projectsSliderWrapper');
    if (!oldWrapper) return;

    getJSON('/api/projects?category=commercial-concrete').then((all) => {
      // Newest added first (id is autoincrement = creation order), latest 6.
      const projects = (all || []).slice().sort((a, b) => b.id - a.id).slice(0, 6);
      if (!projects.length) return; // keep the static demo slides as a fallback

      // Fresh wrapper (same id/classes, no inherited listeners) with our slides.
      const wrapper = oldWrapper.cloneNode(false);
      wrapper.innerHTML =
        `<div class="projects-slider-track">${projects.map(homeProjectSlideHTML).join('')}</div>`;
      oldWrapper.replaceWith(wrapper);

      // Replace the controls with clones to drop script.js's stale handlers.
      const freshen = (id) => {
        const el = document.getElementById(id);
        if (!el) return null;
        const clone = el.cloneNode(true);
        el.replaceWith(clone);
        return clone;
      };
      const prevBtn = freshen('projectsPrevBtn');
      const nextBtn = freshen('projectsNextBtn');
      const rangeFill = freshen('projectsRangeFill');

      wireHomeProjectsSlider(wrapper, prevBtn, nextBtn, rangeFill);
    }).catch(console.error);
  }

  // Re-implements the coverflow projects slider from script.js on fresh nodes.
  function wireHomeProjectsSlider(wrapper, prevBtn, nextBtn, rangeFill) {
    const slides = Array.from(wrapper.querySelectorAll('.project-slide'));
    const total = slides.length;
    if (!total) return;
    let current = 0;
    let timer = null;

    const update = () => {
      const prevIndex = (current - 1 + total) % total;
      const nextIndex = (current + 1) % total;
      slides.forEach((slide, idx) => {
        slide.classList.remove('active', 'prev', 'next');
        if (idx === current) slide.classList.add('active');
        else if (idx === prevIndex) slide.classList.add('prev');
        else if (idx === nextIndex) slide.classList.add('next');
      });
      if (rangeFill) rangeFill.style.width = `${((current + 1) / total) * 100}%`;
    };
    const showNext = () => { current = (current + 1) % total; update(); };
    const showPrev = () => { current = (current - 1 + total) % total; update(); };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const start = () => { stop(); if (total > 1) timer = setInterval(showNext, 2000); };
    const reset = () => start();

    if (nextBtn) nextBtn.addEventListener('click', () => { showNext(); reset(); });
    if (prevBtn) prevBtn.addEventListener('click', () => { showPrev(); reset(); });

    slides.forEach((slide) => {
      slide.addEventListener('click', (e) => {
        if (slide.classList.contains('next')) { e.preventDefault(); showNext(); reset(); }
        else if (slide.classList.contains('prev')) { e.preventDefault(); showPrev(); reset(); }
        else if (slide.classList.contains('active')) {
          // Clicking the centered slide opens the project (the arrow link, if
          // hit directly, navigates on its own).
          const href = slide.getAttribute('data-href');
          if (href && !e.target.closest('a')) window.location.href = href;
        }
      });
    });

    // Swipe / drag (parity with script.js).
    let startX = 0, dragging = false;
    wrapper.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX; dragging = true; stop();
    }, { passive: true });
    wrapper.addEventListener('touchend', (e) => {
      if (!dragging) return;
      const diff = startX - e.changedTouches[0].clientX;
      if (diff > 50) showNext(); else if (diff < -50) showPrev();
      dragging = false; reset();
    }, { passive: true });
    wrapper.addEventListener('mousedown', (e) => { startX = e.clientX; dragging = true; stop(); });
    wrapper.addEventListener('mouseup', (e) => {
      if (!dragging) return;
      const diff = startX - e.clientX;
      if (diff > 50) showNext(); else if (diff < -50) showPrev();
      dragging = false; reset();
    });
    wrapper.addEventListener('mouseleave', () => { if (dragging) { dragging = false; reset(); } });

    update();
    start();
  }

  /* ------------------------------------------------------------ Project view
   * project-view.html: projects grouped by subcategory for ?cat=<categorySlug>.
   * The 2 categories are fixed; the heading name comes from a static map.
   */
  const CATEGORY_NAMES = {
    'commercial-concrete': 'Commercial & Concrete',
    'residential-concrete': 'Residential & Concrete',
  };

  function projectCardHTML(p) {
    const img = p.thumbnail || (p.images && p.images[0] && p.images[0].url) || '';
    return `
      <a href="project-nested.html?project=${p.id}" class="project-view-card">
        <div class="project-card-image-wrap">
          <img src="${esc(img)}" alt="${esc(p.title)}" class="project-card-img">
          <div class="project-card-hover-overlay">
            <div class="project-card-arrow-circle">
              <i class="fa-solid fa-arrow-right-long fa-rotate-by" style="--fa-rotate-angle: -45deg;"></i>
            </div>
          </div>
        </div>
        <div class="project-card-info">
          <span class="project-card-category">${esc([p.tag, p.year].filter(Boolean).join(' / '))}</span>
          <h3 class="project-card-title">${esc(p.title)}</h3>
        </div>
      </a>`;
  }

  function initProjectViewPage() {
    const container = $('.wwa-container');
    const grid = $('.project-child-section');
    if (!container || !grid) return;
    const slug = param('cat') || 'commercial-concrete';

    const heroTitle = $('.gallery-hero-title');
    if (heroTitle && CATEGORY_NAMES[slug]) heroTitle.textContent = CATEGORY_NAMES[slug];

    getJSON('/api/subcategories?category=' + encodeURIComponent(slug)).then((subs) => {
      // Flatten every subcategory's projects into ONE continuous grid (no
      // per-subcategory badges), so cards fill left-to-right and wrap to the
      // next line — a 2-up layout on desktop. Reuses the page's grid classes.
      const projects = subs.flatMap((s) => s.projects || []);
      container.innerHTML = projects.length
        ? `<div class="project-child-section">${projects.map(projectCardHTML).join('')}</div>`
        : `<div class="project-child-section"><p class="project-card-title">Projects coming soon.</p></div>`;
    }).catch(console.error);
  }

  /* ---------------------------------------------------------- Project nested
   * project-nested.html: single project meta + image slider.
   */
  function initProjectNestedPage() {
    const section = $('.project-nested-section');
    if (!section) return;
    const id = param('project');
    if (!id) return;

    getJSON('/api/projects/' + encodeURIComponent(id)).then((p) => {
      const heroTitle = $('.gallery-hero-title');
      if (heroTitle) heroTitle.textContent = p.title;

      // Metadata rows (same classes/markup).
      const meta = $('.nested-meta-container');
      if (meta) {
        const rows = [
          ['Job Name:', p.jobName || p.title],
          ['Location:', p.location],
          ['Project Size:', p.projectSize],
        ].filter(([, v]) => v);
        meta.innerHTML = rows.map(([label, value]) => `
          <div class="nested-meta-item">
            <span class="nested-meta-label">${esc(label)}</span>
            <span class="nested-meta-value">${esc(value)}</span>
          </div>`).join('');
      }

      // Project description (new client-requested content; inline-styled to stay
      // on-brand without modifying the stylesheet).
      if (p.description) {
        let descEl = section.querySelector('.nested-project-desc');
        if (!descEl) {
          descEl = document.createElement('p');
          descEl.className = 'nested-project-desc';
          descEl.style.cssText =
            'max-width:1100px;margin:18px auto 0;padding:0 24px;line-height:1.7;color:#444;font-size:1rem;text-align:center;';
          const anchor = section.querySelector('.nested-meta-container');
          if (anchor) anchor.insertAdjacentElement('afterend', descEl);
          else section.prepend(descEl);
        }
        descEl.textContent = p.description;
      }

      // Slider + thumbnails.
      const images = (p.images && p.images.length)
        ? p.images
        : (p.thumbnail ? [{ url: p.thumbnail, alt: p.title }] : []);
      const wrapper = $('.nested-slider-wrapper');
      const thumbs = $('.nested-slider-thumbnails');
      if (wrapper) {
        const navBtns = `
          <button class="nested-slider-nav nav-prev" aria-label="Previous Slide"><i class="fa-solid fa-arrow-left-long"></i></button>
          <button class="nested-slider-nav nav-next" aria-label="Next Slide"><i class="fa-solid fa-arrow-right-long"></i></button>`;
        wrapper.innerHTML = images.map((img, i) => `
          <div class="nested-slide${i === 0 ? ' active' : ''}">
            <img src="${esc(img.url)}" alt="${esc(img.alt || p.title)}" class="nested-slide-img">
          </div>`).join('') + navBtns;
      }
      if (thumbs) {
        thumbs.innerHTML = images.map((img, i) => `
          <div class="nested-thumbnail${i === 0 ? ' active' : ''}" data-slide="${i}">
            <img src="${esc(img.url)}" alt="${esc(img.alt || p.title)}">
          </div>`).join('');
      }
      wireNestedSlider(section);
    }).catch(console.error);
  }

  // Re-implements the nested slider interaction from script.js on fresh nodes.
  function wireNestedSlider(root) {
    const container = root.querySelector('.nested-slider-container');
    if (!container) return;
    const slides = container.querySelectorAll('.nested-slide');
    const thumbs = container.querySelectorAll('.nested-thumbnail');
    const prev = container.querySelector('.nav-prev');
    const next = container.querySelector('.nav-next');
    let active = 0;

    // Thumbnail navigation elements
    const viewPort = container.querySelector('.nested-slider-thumbnails-viewport');
    const track = container.querySelector('.nested-slider-thumbnails');
    const prevThumbBtn = container.querySelector('.nav-prev-thumb');
    const nextThumbBtn = container.querySelector('.nav-next-thumb');
    let currentScrollIndex = 0;

    const update = (i) => {
      slides.forEach((s, idx) => s.classList.toggle('active', idx === i));
      thumbs.forEach((t, idx) => t.classList.toggle('active', idx === i));
      active = i;

      // Auto-scroll thumbnails on active slide change
      if (viewPort && track) {
        if (window.innerWidth > 768) {
          const maxVisible = window.innerWidth <= 1199 ? 6 : 10;
          if (i < currentScrollIndex) {
            currentScrollIndex = i;
            updateThumbScroll();
          } else if (i >= currentScrollIndex + maxVisible) {
            currentScrollIndex = i - maxVisible + 1;
            updateThumbScroll();
          }
        } else {
          const activeThumb = thumbs[i];
          if (activeThumb) {
            const scrollLeft = activeThumb.offsetLeft - (viewPort.clientWidth / 2) + (activeThumb.clientWidth / 2);
            viewPort.scrollTo({ left: scrollLeft, behavior: 'smooth' });
          }
        }
      }
    };

    function updateThumbScroll() {
      if (viewPort && track && prevThumbBtn && nextThumbBtn) {
        const maxVisible = window.innerWidth <= 1199 ? 6 : 10;
        const thumbWidth = 115; // 100px width + 15px gap
        const maxIndex = Math.max(0, thumbs.length - maxVisible);
        
        if (currentScrollIndex > maxIndex) currentScrollIndex = maxIndex;
        if (currentScrollIndex < 0) currentScrollIndex = 0;

        track.style.transform = `translateX(-${currentScrollIndex * thumbWidth}px)`;
        prevThumbBtn.disabled = currentScrollIndex === 0;
        nextThumbBtn.disabled = currentScrollIndex >= maxIndex;
      }
    }

    if (prevThumbBtn) {
      prevThumbBtn.addEventListener('click', () => {
        currentScrollIndex -= 3;
        updateThumbScroll();
      });
    }
    if (nextThumbBtn) {
      nextThumbBtn.addEventListener('click', () => {
        currentScrollIndex += 3;
        updateThumbScroll();
      });
    }

    if (prev) prev.addEventListener('click', () => update((active - 1 + slides.length) % slides.length));
    if (next) next.addEventListener('click', () => update((active + 1) % slides.length));
    thumbs.forEach((t, idx) => t.addEventListener('click', () => update(idx)));

    if (viewPort && track) {
      window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
          updateThumbScroll();
        } else {
          track.style.transform = 'none';
        }
      });
      updateThumbScroll();
    }
  }

  /* ----------------------------------------------------------------- Careers
   * careers.html: job cards + sidebar filter counts.
   */
  function initCareersPage() {
    const listings = $('.careers-listings');
    if (!listings) return;

    getJSON('/api/jobs').then((jobs) => {
      listings.innerHTML = jobs.map((j) => `
        <div class="job-card" data-category="${esc(j.category)}">
          <h3 class="job-title">${esc(j.title)}</h3>
          <div class="job-tags">
            ${j.location ? `<span class="job-tag">${esc(j.location)}</span>` : ''}
            ${j.employmentType ? `<span class="job-tag">${esc(j.employmentType)}</span>` : ''}
          </div>
          <p class="job-description">${esc(j.shortDescription)}</p>
          <div class="job-action">
            <a href="career-view.html?job=${j.id}" class="btn-see-position">
              <span>See positions</span>
              <i class="fa-solid fa-arrow-right"></i>
            </a>
          </div>
        </div>`).join('') || '<p class="job-description">No open positions at the moment.</p>';

      updateCareerCounts(jobs);
      wireCareerFilter();
    }).catch(console.error);
  }

  // Updates the "(n)" counts on the desktop buttons and mobile dropdown.
  function updateCareerCounts(jobs) {
    const counts = { all: jobs.length };
    jobs.forEach((j) => { counts[j.category] = (counts[j.category] || 0) + 1; });
    const label = { all: 'All positions', engineering: 'Engineering', labor: 'Laborer', drive: 'Drive', operation: 'Operation', marketing: 'Marketing' };

    document.querySelectorAll('.filter-btn').forEach((btn) => {
      const cat = btn.getAttribute('data-category');
      btn.textContent = `${label[cat] || cat} (${counts[cat] || 0})`;
    });
    document.querySelectorAll('#careerMobileFilter option').forEach((opt) => {
      const cat = opt.value;
      opt.textContent = `${label[cat] || cat} (${counts[cat] || 0})`;
    });
  }

  // Re-implements careers filtering from script.js on the new cards.
  function wireCareerFilter() {
    const buttons = document.querySelectorAll('.filter-btn');
    const mobile = $('#careerMobileFilter');
    const cards = document.querySelectorAll('.job-card');
    const filter = (cat) => cards.forEach((c) => {
      c.style.display = cat === 'all' || c.getAttribute('data-category') === cat ? 'block' : 'none';
    });
    buttons.forEach((btn) => btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-category');
      filter(cat);
      if (mobile) mobile.value = cat;
    }));
    if (mobile) mobile.addEventListener('change', (e) => {
      const cat = e.target.value;
      filter(cat);
      buttons.forEach((b) => b.classList.toggle('active', b.getAttribute('data-category') === cat));
    });
  }

  /* ------------------------------------------------------------- Career view
   * career-view.html: single job detail.
   */
  function initCareerViewPage() {
    const container = $('.career-view-container');
    if (!container) return;
    const id = param('job');
    if (!id) return;

    getJSON('/api/jobs/' + encodeURIComponent(id)).then((j) => {
      const title = $('.career-view-title');
      if (title) title.textContent = j.title;

      const tags = $('.career-view-header .job-tags');
      if (tags) {
        tags.innerHTML = [j.location, j.employmentType].filter(Boolean)
          .map((t) => `<span class="job-tag">${esc(t)}</span>`).join('');
      }

      const body = $('.career-view-body');
      if (body) {
        const applyBtn = `
          <div class="apply-btn-wrap bottom-apply">
            <a href="employment-application.html" class="btn-see-position btn-apply-now">
              <span>APPLY NOW</span><i class="fa-solid fa-arrow-right"></i>
            </a>
          </div>`;
        body.innerHTML = renderCareerBody(j.fullDescription || j.shortDescription || '') + applyBtn;
      }
    }).catch(console.error);
  }

  // Renders a job's full description. Rich-editor HTML (headings/lists/paragraphs)
  // is mapped to the careers page's styled classes; legacy plain text keeps the
  // original "Role Description" + paragraphs layout.
  function renderCareerBody(content) {
    const html = String(content || '');
    if (/<[a-z][\s\S]*>/i.test(html)) {
      const mapped = html
        .replace(/<h2>/g, '<h2 class="detail-heading">')
        .replace(/<h3>/g, '<h3 class="detail-heading">')
        .replace(/<ul>/g, '<ul class="detail-bullets-list">')
        .replace(/<ol>/g, '<ol class="detail-bullets-list">')
        .replace(/<blockquote>/g, '<blockquote style="border-left:3px solid #c8102e;margin:18px 0;padding:6px 0 6px 18px;color:#444;">')
        .replace(/<img /g, '<img style="max-width:100%;height:auto;border-radius:12px;margin:18px 0;" ');
      return `<div class="detail-block">${mapped}</div>`;
    }
    const paragraphs = html.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    return `
      <div class="detail-block">
        <h4 class="detail-heading">Role Description</h4>
        ${paragraphs.map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('')}
      </div>`;
  }

  /* ----------------------------------------------------------------- Contact
   * contact-us.html: location boxes + map, and form submission.
   */
  function initContactPage() {
    const boxesRow = $('.contact-boxes-row');
    if (boxesRow) {
      getJSON('/api/locations').then((locs) => {
        boxesRow.innerHTML = locs.map((l, i) => `
          <div class="contact-info-box${i === 0 ? ' active' : ''}" data-map-url="${esc(l.mapEmbedUrl)}">
            <div class="box-header">
              <h3 class="box-title">${esc(l.city)}</h3>
              ${l.badge ? `<span class="badge ${l.badgeType === 'hq' ? 'badge-hq' : 'badge-new'}">${esc(l.badge)}</span>` : ''}
            </div>
            <div class="box-body">
              <div class="info-line"><i class="fa-solid fa-location-dot"></i><span>${esc(l.address)}</span></div>
              ${l.hours ? `<div class="info-line"><i class="fa-solid fa-clock"></i><span>${esc(l.hours)}</span></div>` : ''}
              ${l.serviceArea ? `<div class="info-line"><i class="fa-solid fa-truck"></i><span>${esc(l.serviceArea)}</span></div>` : ''}
              ${l.phone ? `<a href="tel:${esc(l.phone.replace(/[^0-9+]/g, ''))}" class="box-phone-link">${esc(l.phone)}</a>` : ''}
            </div>
          </div>`).join('');

        // Point the map iframe at the first location and wire box switching.
        const iframe = $('#contactMapIframe');
        if (iframe && locs[0]) iframe.src = locs[0].mapEmbedUrl;
        wireContactMap();
      }).catch(console.error);
    }

    wireContactForm();
  }

  // Re-implements the contact map switching from script.js.
  function wireContactMap() {
    const boxes = document.querySelectorAll('.contact-info-box');
    const iframe = $('#contactMapIframe');
    if (!boxes.length || !iframe) return;
    boxes.forEach((box) => box.addEventListener('click', () => {
      const url = box.getAttribute('data-map-url');
      if (url) iframe.src = url;
      boxes.forEach((b) => b.classList.remove('active'));
      box.classList.add('active');
    }));
  }

  // Sends the contact form to the API and stores it in the database.
  function wireContactForm() {
    const form = $('.contact-form');
    if (!form) return;
    const btn = form.querySelector('.contact-submit-btn');
    const label = btn ? btn.querySelector('span') : null;
    const original = label ? label.textContent : 'SUBMIT';

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        fullName: (form.querySelector('#fullName') || {}).value || '',
        phone: (form.querySelector('#phone') || {}).value || '',
        email: (form.querySelector('#email') || {}).value || '',
        service: (form.querySelector('#service') || {}).value || '',
        message: (form.querySelector('#message') || {}).value || '',
      };
      if (label) label.textContent = 'SENDING…';
      if (btn) btn.disabled = true;
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed');
        form.reset();
        if (label) label.textContent = 'THANK YOU!';
        setTimeout(() => { if (label) label.textContent = original; }, 3000);
      } catch (err) {
        if (label) label.textContent = 'TRY AGAIN';
        setTimeout(() => { if (label) label.textContent = original; }, 3000);
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  }

  /* --------------------------------------------------------- Delivery quote
   * delivery-quote.html: render the admin-managed Reinforcing & Supplies
   * catalog into .products-list, and expose window.delzotto.submitQuote so the
   * page's inline form handler can POST the whole order to the API.
   */
  function supplyFieldHTML(productTitle, f) {
    // Field name encodes "Product — Label" so it groups cleanly server-side.
    const name = `supply[${productTitle} — ${f.label}]`;
    const helper = f.helper ? `<span class="input-helper">${esc(f.helper)}</span>` : '';
    if (f.inputType === 'select' && Array.isArray(f.options)) {
      const opts = f.options.map((o, i) =>
        `<option value="${esc(o)}"${i === 0 ? ' selected' : ''}>${esc(o)}</option>`).join('');
      return `<div class="product-field">
        <label>${esc(f.label)}</label>
        <select name="${esc(name)}">${opts}</select>${helper}
      </div>`;
    }
    return `<div class="product-field">
      <label>${esc(f.label)}</label>
      <input type="number" name="${esc(name)}" min="0" placeholder="${esc(f.placeholder || '')}">${helper}
    </div>`;
  }

  function initDeliveryQuotePage() {
    const list = $('.products-list');
    // Expose the submit hook regardless (inline handler calls it).
    window.delzotto = window.delzotto || {};
    window.delzotto.submitQuote = submitQuote;
    if (!list) return;

    getJSON('/api/supplies').then((products) => {
      if (!products.length) return; // keep the static cards as a fallback
      list.innerHTML = products.map((p) => `
        <div class="product-card-item">
          <div class="product-img-wrap">
            <img src="${esc(p.image || '')}" alt="${esc(p.title)}" class="product-img">
          </div>
          <div class="product-details">
            <h4 class="product-title">${esc(p.title)}</h4>
            <div class="product-fields-grid">
              ${(p.fields || []).map((f) => supplyFieldHTML(p.title, f)).join('')}
            </div>
          </div>
        </div>`).join('');
    }).catch(console.error);
  }

  // Gathers the whole quote form (incl. dynamic supply fields) and POSTs it.
  async function submitQuote(form) {
    const fd = new FormData(form);
    const reinforcing = {};
    const body = {};
    for (const [key, value] of fd.entries()) {
      const v = String(value).trim();
      if (key.startsWith('supply[')) {
        if (v) reinforcing[key.slice(7, -1)] = v; // strip "supply[" .. "]"
      } else {
        body[key] = v;
      }
    }
    body.reinforcing = reinforcing;
    try {
      const res = await fetch('/api/delivery-quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  /* ------------------------------------------------------------------- Blogs
   * blogs.html: render published posts into .blogs-grid.
   */
  function initBlogsPage() {
    const grid = $('.blogs-grid');
    if (!grid) return;
    getJSON('/api/blogs').then((blogs) => {
      grid.innerHTML = blogs.map((b) => `
        <a href="blog-view.html?slug=${encodeURIComponent(b.slug)}" class="blog-card">
          <div class="blog-card-img-wrap">
            <img src="${esc(b.coverImage || '')}" alt="${esc(b.title)}" class="blog-card-img">
          </div>
          <span class="blog-card-date">${esc(b.date || '')}</span>
          <h3 class="blog-card-title">${esc(b.title)}</h3>
        </a>`).join('') || '<p class="blog-card-title">No articles yet.</p>';
    }).catch(console.error);
  }

  /* -------------------------------------------------------------- Blog view
   * blog-view.html: render a single post for ?slug=<slug> (or ?id=).
   */
  function initBlogViewPage() {
    const container = $('.blog-view-container');
    if (!container) return;
    const slug = param('slug') || param('id');
    if (!slug) return;

    getJSON('/api/blogs/' + encodeURIComponent(slug)).then((b) => {
      const heroTitle = $('.resi-hero-title');
      if (heroTitle) heroTitle.textContent = b.title;
      if (b.coverImage) {
        const banner = $('.resi-hero-banner-img');
        if (banner) banner.src = b.coverImage;
        const bg = $('.resi-hero-bg-img');
        if (bg) bg.src = b.coverImage;
      }
      const metaLine = [b.date, b.author].filter(Boolean).join(' · ');
      container.innerHTML =
        (metaLine ? `<h2 class="blog-view-main-title">${esc(metaLine)}</h2>` : '') +
        (b.excerpt ? `<p class="blog-view-paragraph"><strong>${esc(b.excerpt)}</strong></p>` : '') +
        renderBlogContent(b.content);
    }).catch(console.error);
  }

  // Renders blog body. Rich-editor HTML is mapped to the page's styled classes
  // so it matches the design; legacy plain text splits on blank lines.
  function renderBlogContent(content) {
    const html = String(content || '');
    if (/<[a-z][\s\S]*>/i.test(html)) {
      return html
        .replace(/<p>/g, '<p class="blog-view-paragraph">')
        .replace(/<h2>/g, '<h2 class="blog-view-subheading">')
        .replace(/<h3>/g, '<h3 class="blog-view-section-title">')
        .replace(/<ul>/g, '<ul class="blog-view-list">')
        .replace(/<ol>/g, '<ol class="blog-view-list">')
        .replace(/<li>/g, '<li class="blog-view-list-item">')
        .replace(/<blockquote>/g, '<blockquote class="blog-view-blockquote">')
        // Make embedded images responsive without touching the stylesheet.
        .replace(/<img /g, '<img style="max-width:100%;height:auto;border-radius:12px;margin:18px 0;" ');
    }
    return html
      .split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
      .map((p) => `<p class="blog-view-paragraph">${esc(p).replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  /* ----------------------------------------------------------------- Gallery
   * gallery.html: fill the fixed grid (2 big + small groups) from the
   * admin-managed, sorted photo list. The branded slideshow is left untouched.
   * Order: first photo = large left, last = large right, the rest fill the
   * left/right small groups. The lightbox is re-wired on the new images.
   */
  function initGalleryPage() {
    const container = $('.gallery-photos-container');
    if (!container) return;

    getJSON('/api/gallery').then((imgs) => {
      if (!imgs.length) return; // keep static photos as a fallback

      const imgTag = (im) =>
        `<img src="${esc(im.url)}" alt="${esc(im.alt || 'Gallery Image')}" class="gallery-img">`;
      const smallItem = (im) => `<div class="gallery-small-item">${imgTag(im)}</div>`;

      const first = imgs[0];
      const last = imgs.length > 1 ? imgs[imgs.length - 1] : null;
      const middle = imgs.slice(1, last ? imgs.length - 1 : imgs.length);
      const half = Math.ceil(middle.length / 2);

      const bigLeft = $('.group-left-large .gallery-big-item');
      const smallLeft = $('.group-left-large .gallery-small-group');
      const smallRight = $('.group-right-large .gallery-small-group');
      const bigRight = $('.group-right-large .gallery-big-item');

      if (bigLeft) bigLeft.innerHTML = imgTag(first);
      if (smallLeft) smallLeft.innerHTML = middle.slice(0, half).map(smallItem).join('');
      if (smallRight) smallRight.innerHTML = middle.slice(half).map(smallItem).join('');
      if (bigRight && last) bigRight.innerHTML = imgTag(last);

      wireGalleryLightbox();
    }).catch(console.error);
  }

  // Re-implements the gallery lightbox (from script.js) on the fresh images.
  // The control buttons are cloned first to drop script.js's stale listeners.
  function wireGalleryLightbox() {
    const lightbox = $('#galleryLightbox');
    const lightboxImg = $('#lightboxImg');
    if (!lightbox || !lightboxImg) return;
    const imgs = Array.from(document.querySelectorAll('.gallery-img'));
    if (!imgs.length) return;

    let idx = 0;
    const open = (i) => {
      idx = i;
      lightboxImg.src = imgs[idx].src;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    };
    const close = () => { lightbox.classList.remove('active'); document.body.style.overflow = ''; };
    const show = (d) => { idx = (idx + d + imgs.length) % imgs.length; lightboxImg.src = imgs[idx].src; };

    imgs.forEach((img, i) => img.addEventListener('click', () => open(i)));

    // Replace control buttons with clones to remove the static handlers.
    ['#lightboxClose', '#lightboxPrev', '#lightboxNext'].forEach((sel) => {
      const el = $(sel);
      if (el) el.replaceWith(el.cloneNode(true));
    });
    const closeBtn = $('#lightboxClose');
    const prevBtn = $('#lightboxPrev');
    const nextBtn = $('#lightboxNext');
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); show(-1); });
    if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); show(1); });
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lightbox-content')) close();
    });
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') show(1);
      if (e.key === 'ArrowLeft') show(-1);
    });
  }
})();
