// 이미지 경로. 빌드본은 window.__ASSETS__ 에 data URI로 들어 있고, 개발 중에는 파일을 읽는다.
let MAP = null;

export async function loadAssets() {
  if (window.__ASSETS__) { MAP = window.__ASSETS__; return; }
  try {
    const m = await (await fetch('assets/manifest.json')).json();
    MAP = { items: {}, news: {} };
    Object.entries(m.items).forEach(([id, v]) => { MAP.items[id] = `assets/${v.file}`; });
    Object.entries(m.news).forEach(([id, v]) => { MAP.news[id] = `assets/${v.file}`; });
  } catch (e) {
    MAP = { items: {}, news: {} };
  }
}

export const itemSrc = (id) => (MAP && MAP.items[id]) || null;
export const newsSrc = (id) => (MAP && MAP.news[id]) || null;
