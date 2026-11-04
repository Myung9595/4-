// 아이템 정의. size = 가방 칸 수
// use: 사용 시 수치 변화 / special: 특수 처리 키 / once: 하루 한 번만 효과

export const ITEMS = {
  water500: { name: '생수 500ml', size: 1, kind: '음료', desc: '편의점 생수. 지금은 무엇보다 비싸다.', use: { thirst: 24 }, useText: '물을 마셨다.' },
  water2l: { name: '생수 2L', size: 2, kind: '음료', desc: '무겁다. 대신 네 번은 마실 수 있다.', use: { thirst: 22 }, charges: 4, useText: '몇 모금 아껴 마셨다.' },
  ionDrink: { name: '이온음료', size: 1, kind: '음료', desc: '달다. 목이 덜 마르다.', use: { thirst: 18, hunger: 3 }, useText: '이온음료를 마셨다.' },
  kimbap: { name: '삼각김밥', size: 1, kind: '식량', desc: '참치마요. 유통기한 06:00.', use: { hunger: 16 }, useText: '삼각김밥을 먹었다. 포장을 뜯는 순서가 손에 익어 있다.' },
  cupRamen: { name: '컵라면', size: 1, kind: '식량', desc: '뜨거운 물이 없다. 부숴서 스프를 뿌려 먹는다.', use: { hunger: 20, thirst: -6 }, useText: '컵라면을 부숴 먹었다. 짜다.' },
  ramen: { name: '봉지라면', size: 1, kind: '식량', desc: '끓일 수 없으면 과자다.', use: { hunger: 15, thirst: -5 }, useText: '봉지라면을 부숴 먹었다.' },
  chocobar: { name: '초코바', size: 1, kind: '식량', desc: '작고 단단하다. 기분이 조금 나아진다.', use: { hunger: 10, mental: 3 }, useText: '초코바를 먹었다.' },
  tuna: { name: '참치 통조림', size: 1, kind: '식량', desc: '따개가 달려 있다. 오래 간다.', use: { hunger: 22 }, useText: '참치를 먹었다. 기름까지 마셨다.' },
  chocopie: { name: '초코파이 두 개', size: 1, kind: '식량', desc: '라즈가 준 것. 공장에서 간식으로 받았다고 했다.', use: { hunger: 12, mental: 6 }, useText: '초코파이를 먹었다. 생각보다 오래 씹었다.' },
  stew: { name: '도준이 끓인 김치찌개', size: 1, kind: '식량', desc: '냉동실에서 녹고 있었다. 오늘 안에 먹어야 한다.', use: { hunger: 30, mental: 12 }, useText: '차가운 찌개를 먹었다. 짜다. 도준이 끓인 건 늘 짰다.' },
  rice: { name: '쌀 1kg', size: 2, kind: '식량', desc: '익힐 방법이 생기면 가장 든든한 식량이다.', special: 'rice' },
  medicine: { name: '상비약 키트', size: 1, kind: '의약품', desc: '진통제, 소독약, 밴드.', use: { hp: 25 }, useText: '진통제를 삼키고 상처를 소독했다.' },
  flashlight: { name: '손전등', size: 1, kind: '도구', desc: 'F 키로 켜고 끈다. 건전지를 쓴다.', special: 'flashlight' },
  battery: { name: '건전지 AA', size: 1, kind: '도구', desc: '손전등을 다시 밝힌다.', special: 'battery' },
  powerbank: { name: '보조배터리', size: 1, kind: '도구', desc: '휴대폰을 한 번 충전할 수 있다.', special: 'powerbank' },
  raincoat: { name: '일회용 우비', size: 1, kind: '방호', desc: '낙진이 옷에 닿지 않게 막는다. 밖에 나갈 때 필요해질 것이다.', special: 'passive' },
  mask: { name: '마스크', size: 1, kind: '방호', desc: 'KF94. 재를 마시지 않게 해 준다.', special: 'passive' },
  handwarmer: { name: '핫팩', size: 1, kind: '도구', desc: '11월의 지하는 춥다.', use: { mental: 3 }, useText: '핫팩을 흔들어 손에 쥐었다.' },
  lighter: { name: '라이터', size: 1, kind: '도구', desc: '불은 언젠가 필요하다.', special: 'passive' },
  cigarettes: { name: '담배 한 보루', size: 1, kind: '교환', desc: '도일은 피우지 않는다. 그래서 챙겼다.', special: 'passive' },
  blanket: { name: '담요', size: 2, kind: '생활', desc: '잠잘 때 멘탈이 더 회복된다.', special: 'passive' },
  padding: { name: '롱패딩', size: 2, kind: '생활', desc: '겨울이 오고 있다.', special: 'passive' },
  photo: { name: '형제 사진', size: 1, kind: '기억', desc: '도준이 입대하던 날 훈련소 앞에서 찍은 사진. 둘 다 웃고 있지 않다.', use: { mental: 12 }, once: true, useText: '사진을 오래 들여다봤다.' },
  earphones: { name: '도준의 이어폰', size: 1, kind: '기억', desc: '음악은 없다. 그래도 귀에 꽂으면 세상이 조금 조용해진다.', use: { mental: 5 }, once: true, useText: '이어폰을 꽂았다. 아무 소리도 나지 않았다.' },
};

// 컨테이너(선반·서랍)의 초기 내용물
export const CONTAINERS = {
  store_drinks: { water500: 4, water2l: 2, ionDrink: 2 },
  store_food: { kimbap: 3, tuna: 2 },
  store_snack: { chocobar: 4 },
  store_ramen: { cupRamen: 4 },
  store_goods: { flashlight: 1, battery: 4, raincoat: 2, mask: 3, handwarmer: 3, lighter: 2 },
  store_counter: { medicine: 1, powerbank: 1, cigarettes: 1 },
  home_kitchen: { ramen: 3, tuna: 2, rice: 1, water500: 4 },
  home_fridge: { stew: 1 },
  home_closet: { blanket: 1, padding: 1 },
  home_desk: { photo: 1, earphones: 1 },
};
