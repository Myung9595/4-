// 아이템 정의. size = 가방 칸 수, icon = assets/items/<icon>.png (없으면 id)
// use: 사용 시 수치 변화 / special: 특수 처리 키 / once: 하루 한 번만 효과(소모되지 않음)

export const ITEMS = {
  water500: { name: '생수 500ml', size: 1, kind: '음료', desc: '편의점 생수. 지금은 무엇보다 비싸다.', use: { thirst: 24 }, useText: '물을 마셨다.' },
  water2l: { name: '생수 2L', size: 2, kind: '음료', desc: '무겁다. 대신 네 번은 마실 수 있다.', use: { thirst: 22 }, charges: 4, useText: '몇 모금 아껴 마셨다.' },
  kimbap: { name: '삼각김밥', size: 1, kind: '식량', desc: '폐기 삼각김밥. 참치마요. 5년째 같은 아침밥.', use: { hunger: 16 }, useText: '삼각김밥을 먹었다. 포장을 뜯는 순서가 손에 익어 있다.' },
  cupRamen: { name: '컵라면', size: 1, kind: '식량', desc: '뜨거운 물이 없다. 부숴서 스프를 뿌려 먹는다.', use: { hunger: 20, thirst: -6 }, useText: '컵라면을 부숴 먹었다. 짜다.' },
  ramen: { name: '봉지라면', size: 1, kind: '식량', desc: '끓일 수 없으면 과자다.', use: { hunger: 15, thirst: -5 }, useText: '봉지라면을 부숴 먹었다.' },
  tuna: { name: '참치캔', size: 1, kind: '식량', desc: '따개가 달려 있다. 오래 간다.', use: { hunger: 22 }, useText: '참치를 먹었다. 기름까지 마셨다.' },
  spam: { name: '햄 통조림', size: 1, kind: '식량', desc: '김치와 라면이 있으면 부대찌개가 된다. 언젠가는.', use: { hunger: 25 }, useText: '햄을 썰지도 않고 먹었다.' },
  hetbahn: { name: '즉석밥', size: 1, kind: '식량', desc: '데우지 못하면 딱딱하다. 그래도 밥이다.', use: { hunger: 16 }, useText: '차가운 밥을 꼭꼭 씹었다.' },
  kimchi: { name: '김치 (반찬통)', size: 2, kind: '식량', desc: '엄마 김치 맛을 흉내 낸 도준의 김치. 시어 가고 있다.', use: { hunger: 8, mental: 3 }, useText: '김치를 집어 먹었다. 시었다.' },
  chocopie: { name: '초코파이 두 개', size: 1, kind: '식량', desc: '라즈가 준 것. 공장에서 간식으로 받았다고 했다.', use: { hunger: 12, mental: 6 }, useText: '초코파이를 먹었다. 생각보다 오래 씹었다.' },
  stew: { name: '도준이 끓인 김치찌개', icon: 'budae', size: 1, kind: '식량', desc: '냉동실에서 녹고 있었다. 오늘 안에 먹어야 한다.', use: { hunger: 30, mental: 12 }, useText: '차가운 찌개를 먹었다. 짜다. 도준이 끓인 건 늘 짰다.' },
  rice: { name: '쌀 1kg', size: 2, kind: '식량', desc: '익힐 방법이 생기면 가장 든든한 식량이다.', special: 'rice' },
  peach: { name: '황도 통조림', size: 1, kind: '식량', desc: '아플 때 먹는 거라고, 누군가 그랬다.', use: { hunger: 10, thirst: 8, mental: 8 }, useText: '황도를 먹었다. 어릴 때 감기에 걸리면 엄마가 따 주던 맛.' },
  mixCoffee: { name: '믹스커피', size: 1, kind: '음료', desc: '뜨거운 물이 있으면 좋겠다.', use: { mental: 3 }, useText: '가루를 그냥 털어 넣었다. 달다.' },
  medkit: { name: '상비약 키트', size: 1, kind: '의약품', desc: '진통제, 소독약, 밴드.', use: { hp: 25 }, useText: '진통제를 삼키고 상처를 소독했다.' },
  flashlight: { name: '손전등', size: 1, kind: '도구', desc: 'F 키(휴대폰은 「손전등」 버튼)로 켜고 끈다. 건전지를 쓴다.', special: 'flashlight' },
  battery: { name: '건전지 AA', size: 1, kind: '도구', desc: '손전등을 다시 밝힌다.', special: 'battery' },
  powerbank: { name: '보조배터리', size: 1, kind: '도구', desc: '휴대폰을 한 번 충전할 수 있다.', special: 'powerbank' },
  raincoat: { name: '일회용 우비', size: 1, kind: '방호', desc: '낙진이 옷에 닿지 않게 막는다. 밖에 나갈 때 필요해질 것이다.', special: 'passive' },
  mask: { name: 'KF94 마스크', size: 1, kind: '방호', desc: '재를 마시지 않게 해 준다.', special: 'passive' },
  handwarmer: { name: '핫팩', size: 1, kind: '도구', desc: '11월의 지하는 춥다. 누군가에게 건넬 수도 있다.', use: { mental: 3 }, useText: '핫팩을 흔들어 손에 쥐었다.' },
  workGloves: { name: '목장갑', size: 1, kind: '도구', desc: '유리와 철물을 만질 때 다치지 않게 해 준다.', special: 'passive' },
  blanket: { name: '담요', size: 2, kind: '생활', desc: '잠잘 때 멘탈이 더 회복된다. 나눌 수도 있다.', special: 'passive' },
  padding: { name: '롱패딩', size: 2, kind: '생활', desc: '겨울이 오고 있다.', special: 'passive' },
  photo: { name: '형제 사진', size: 1, kind: '기억', desc: '도준이 입대하던 날 훈련소 앞에서 찍은 사진. 둘 다 웃고 있지 않다.', use: { mental: 12 }, once: true, useText: '사진을 오래 들여다봤다.' },
  earphones: { name: '도준의 이어폰', size: 1, kind: '기억', desc: '음악은 없다. 그래도 귀에 꽂으면 세상이 조금 조용해진다.', use: { mental: 5 }, once: true, useText: '이어폰을 꽂았다. 아무 소리도 나지 않았다.' },
  letter: { name: '훈련소 편지', size: 1, kind: '기억', desc: '도준이 훈련소에서 쓴 손편지. 도일은 한 번 읽고 서랍에 넣었다.', use: { mental: 15 }, once: true, special: 'letter' },
};

// 편의점 손님이 사는 물건 (계산대 미니게임용, 가방에는 들어오지 않음)
export const POS_GOODS = {
  water500: 1000, hetbahn: 1800, cupRamen: 1500, kimbap: 1400, peach: 2800, mixCoffee: 300, powerbank: 15900, tuna: 3200,
};

// 컨테이너(선반·서랍)의 초기 내용물
export const CONTAINERS = {
  home_kitchen: { ramen: 3, tuna: 2, spam: 1, rice: 1, water500: 3 },
  home_fridge: { stew: 1, kimchi: 1 },
  home_closet: { blanket: 1, padding: 1, workGloves: 1 },
  home_desk: { photo: 1, earphones: 1 },
  home_drawer: { letter: 1 },
};

export const iconOf = (id) => (ITEMS[id] && ITEMS[id].icon) || id;
