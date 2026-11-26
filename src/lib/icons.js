// Maps the technology names used in content.json to real brand glyphs (simple-icons, CC0).
// Names with no brand glyph in the set simply get no symbol.
import {
  siPython, siFastapi, siPostgresql, siRedis, siDjango, siFlask, siNextdotjs, siTypescript,
  siJavascript, siTailwindcss, siShadcnui, siGraphql, siLangchain, siTensorflow, siKeras,
  siScikitlearn, siDocker, siGithub, siGit, siPostman, siJira, siStreamlit, siGradio,
  siPydantic, siGooglegemini, siOllama, siReact, siHtml5, siGrafana,
} from 'simple-icons';

// order matters: the first matching pattern wins
const MAP = [
  [/python/, siPython],
  [/fastapi/, siFastapi],
  [/postgres/, siPostgresql],
  [/redis/, siRedis],
  [/django/, siDjango],
  [/flask/, siFlask],
  [/next\.?js/, siNextdotjs],
  [/typescript/, siTypescript],
  [/javascript/, siJavascript],
  [/tailwind/, siTailwindcss],
  [/shadcn/, siShadcnui],
  [/graphql/, siGraphql],
  [/langchain/, siLangchain],
  [/tensorflow/, siTensorflow],
  [/keras/, siKeras],
  [/scikit/, siScikitlearn],
  [/docker/, siDocker],
  [/github/, siGithub],
  [/\bgit\b/, siGit],
  [/postman/, siPostman],
  [/jira/, siJira],
  [/streamlit/, siStreamlit],
  [/gradio/, siGradio],
  [/pydantic/, siPydantic],
  [/gemini 2/, siGooglegemini],
  [/ollama/, siOllama],
  [/\breact\b/, siReact],
  [/html/, siHtml5],
  [/grafana/, siGrafana],
];

export function iconFor(name) {
  const key = String(name).toLowerCase();
  const hit = MAP.find(([re]) => re.test(key));
  return hit ? hit[1] : null;
}

// up to `max` distinct glyphs for a list of technology names
export function iconsFor(names = [], max = 6) {
  const seen = new Set();
  const out = [];
  for (const n of names) {
    const ic = iconFor(n);
    if (ic && !seen.has(ic.title)) {
      seen.add(ic.title);
      out.push(ic);
      if (out.length >= max) break;
    }
  }
  return out;
}
