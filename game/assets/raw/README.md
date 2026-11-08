# 제미나이 원본 이미지

새 이미지는 이 폴더(`raw/`)에 **이름 그대로** 올리면 된다. Claude가 확인해서 이름을 바꾸고 아래 폴더로 옮긴다.

| 폴더 | 내용 |
|---|---|
| `items/` | 3×3 아이템 시트 원본 (`sheet_01` ~ `sheet_12`) |
| `news/` | 뉴스 컷신 원본 (`news_01_studio` 등) |

게임용으로 바꾸려면 레포 루트에서:

```
python3 game/tools/process_assets.py
```

결과는 `game/assets/items/`(48×48 아이콘), `game/assets/news/`(344×192), `game/assets/manifest.json`에 생긴다.

## 2026-11-06 업로드 정리

| 원래 이름 | 바뀐 이름 |
|---|---|
| Gemini_Generated_Image.jpeg | news/news_03_map.jpeg |
| Gemini_Generated_Image-2.jpeg | news/news_02_breaking.jpeg |
| Gemini_Generated_Image-3.jpeg | news/news_01_studio.jpeg |
| Gemini_Generated_Image-4.jpeg | items/sheet_12.jpeg |
| Gemini_Generated_Image-5.jpeg | items/sheet_11.jpeg |
| Gemini_Generated_Image-6.jpeg | items/sheet_10.jpeg |
| Gemini_Generated_Image-7.jpeg | items/sheet_09.jpeg |
| Gemini_Generated_Image-8.jpeg | items/sheet_08.jpeg |
| Gemini_Generated_Image-9.jpeg | items/sheet_07.jpeg |
| Gemini_Generated_Image-10.jpeg | items/sheet_06.jpeg |
| Gemini_Generated_Image-11.jpeg | items/sheet_05.jpeg |
| Gemini_Generated_Image-12.jpeg | items/sheet_04.jpeg |
| Gemini_Generated_Image-13.jpeg | items/sheet_03.jpeg |
| Gemini_Generated_Image-14.jpeg | items/sheet_02.jpeg |
| Gemini_Generated_Image-15.jpeg | items/sheet_01.jpeg |

아직 없는 것: 뉴스 04 서해, 05 전투기, 06 지하철역, 07 이어폰, 08 신호 끊김(코드로 대체 가능)
