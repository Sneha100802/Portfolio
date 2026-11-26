import { content } from './content.js';
import { chapterLabel, roomLabel, roomSlug, stops } from './gallery.js';

export const htmlEscape = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderQuickView(base, canonical) {
  const { gallery, meta, publications, quickResults, links } = content;
  const pageTitle = htmlEscape(`${gallery.quickView} | ${meta.name}`);
  const description = htmlEscape(`${meta.name} · ${meta.title}. Selected experience, projects, and published research.`);
  const path = stop => htmlEscape(base + roomSlug(stop));
  const entries = chapter => stops.filter(stop => stop.chapter === chapter && stop.kind !== 'document-retrieval').map(stop => `
    <li><a href="${path(stop)}">${htmlEscape(roomLabel(stop))}</a>
      <p>${htmlEscape(stop.data.role ?? stop.data.description)}</p></li>`).join('');
  const references = publications.map(paper => `
    <li><a href="${htmlEscape(paper.url)}">${htmlEscape(paper.title)}</a>
      <p>${htmlEscape([paper.venue, paper.year].filter(Boolean).join(' · '))}</p></li>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${pageTitle}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${htmlEscape(canonical)}">
  <meta property="og:title" content="${pageTitle}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${htmlEscape(canonical)}">
  <link rel="icon" href="${htmlEscape(base)}gallery-icon.png" type="image/png">
  <link rel="stylesheet" href="${htmlEscape(base)}quick-view.css">
  <script>try{const t=localStorage.getItem('portfolio-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch{}</script>
</head>
<body>
  <main>
    <header>
      <nav aria-label="${htmlEscape(gallery.quickView)}" class="page-actions">
        <a href="${htmlEscape(base)}">${htmlEscape(gallery.backToGallery)}</a>
        <button type="button" id="print-page">${htmlEscape(gallery.print)}</button>
      </nav>
      <h1>${htmlEscape(meta.name)}</h1>
      <p class="role">${htmlEscape(meta.title)}</p>
      <nav aria-label="${htmlEscape(gallery.profileLinks)}" class="profile">${links.map(link => `<a href="${htmlEscape(link.url)}">${htmlEscape(link.label)}</a>`).join('')}</nav>
    </header>
    <section aria-labelledby="highlights">
      <h2 id="highlights">${htmlEscape(gallery.results)}</h2>
      <ul class="highlights">${quickResults.map(result => `<li>${htmlEscape(result)}</li>`).join('')}</ul>
    </section>
    <div class="work-columns">
      <section aria-labelledby="experience">
        <h2 id="experience">${htmlEscape(chapterLabel.experience)}</h2><ul>${entries('experience')}</ul>
      </section>
      <section aria-labelledby="projects">
        <h2 id="projects">${htmlEscape(chapterLabel.projects)}</h2><ul>${entries('projects')}</ul>
      </section>
    </div>
    <section aria-labelledby="publications">
      <h2 id="publications">${htmlEscape(chapterLabel.research)}</h2>
      <ul class="papers">${references}</ul>
    </section>
  </main>
  <script>document.getElementById('print-page').addEventListener('click',()=>window.print())</script>
</body>
</html>`;
}
