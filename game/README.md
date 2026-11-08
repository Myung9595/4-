# 서울 끝 (가제: 오늘25 야간 근무)

핵이 떨어진 지 100일. 편의점 야간 알바 강도일이 군에 있는 동생 강도준에게 가는 생존 어드벤처.
기획 문서는 `../docs/서울끝/`에 있다.

## 바로 플레이하기

`dist/index.html`을 더블클릭하면 브라우저에서 열린다. 이미지가 모두 안에 들어 있는 단일 파일이다.

## 개발하기

Node.js와 Python 3이 필요하다.

```bash
cd game
npm install            # 처음 한 번 (esbuild 설치)
npm run build          # src/ 를 묶어 dist/index.html 과 dist/artifact.html 생성
npm run serve          # http://localhost:8080 에서 개발용 index.html 실행
```

개발용 `index.html`은 `src/`를 그대로 읽으므로, 서버를 켠 채 파일을 고치고 새로고침하면 된다.

## 폴더

| 경로 | 내용 |
|---|---|
| `src/main.js` | 게임 루프, 이동·충돌, 조명(벽 그림자·암순응), 말풍선 |
| `src/story.js` | 장면과 대사: 편의점 근무 → 섬광 → 대피소 → 계단 → 집 → 꿈 |
| `src/ui.js` | 대화, 가방·선반, 휴대폰, 뉴스 컷신, 근무 미니게임 |
| `src/engine.js` | 입력, 효과음(전부 합성), 임시 더빙(브라우저 음성) |
| `src/world.js` | 맵 데이터와 타일 그리기 |
| `src/items.js` | 아이템 정의 |
| `assets/raw/` | 제미나이 원본 이미지 (새 이미지는 여기에 올린다) |
| `assets/items/`, `assets/news/` | 게임용으로 변환된 아이콘·컷신 |

## 도구

| 명령 (레포 루트에서) | 하는 일 |
|---|---|
| `python3 game/tools/process_assets.py` | `assets/raw/`의 제미나이 이미지를 아이콘·컷신으로 변환 (numpy, scipy, Pillow 필요) |
| `python3 game/tools/make_gemini_prompts.py` | 아이템 문서에서 제미나이 프롬프트 문서와 복사 페이지를 다시 생성 |
| `node game/tools/playthrough_test.cjs <폴더>` | 처음부터 끝까지 자동 플레이하며 스크린샷 저장 (Playwright 필요, 8765 포트 서버를 먼저 켤 것) |
