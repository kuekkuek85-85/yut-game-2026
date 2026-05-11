/* =====================================================================
   함께 던지고, 함께 자라다 — Yut Nori Web Game
   ===================================================================== */

/* ───────────────────────────────────────────────
   1. 상수 & 데이터
   ─────────────────────────────────────────────── */

const TEAM_COLORS = [
  '#E53935', // 빨간색
  '#FB6D00', // 주황색
  '#F9C800', // 노란색
  '#2E7D32', // 초록색
  '#1565C0', // 파란색
  '#7B1FA2', // 보라색
  '#E91E8C', // 분홍색
  '#8D6035', // 황토색
  '#29B6F6', // 하늘색
  '#00897B', '#7CB342', '#FFB300',
];

const CELL_COORDS = {
  // 외곽 20칸 — 반시계방향, 균등 104px 간격
  0:  { x:580, y:580 }, 1:  { x:580, y:476 }, 2:  { x:580, y:372 },
  3:  { x:580, y:268 }, 4:  { x:580, y:164 }, 5:  { x:580, y:60  },
  6:  { x:476, y:60  }, 7:  { x:372, y:60  }, 8:  { x:268, y:60  },
  9:  { x:164, y:60  }, 10: { x:60,  y:60  }, 11: { x:60,  y:164 },
  12: { x:60,  y:268 }, 13: { x:60,  y:372 }, 14: { x:60,  y:476 },
  15: { x:60,  y:580 }, 16: { x:164, y:580 }, 17: { x:268, y:580 },
  18: { x:372, y:580 }, 19: { x:476, y:580 },
  // 대각선 — 각 대각 5개 중간 지점 + 공유 중앙(25)
  // 대각1: 5(580,60)→30→27→25→26→31→15(60,580)
  25: { x:320, y:320 }, // 중앙
  30: { x:493, y:147 }, // 5 ~ 27 사이
  27: { x:407, y:233 },
  26: { x:233, y:407 },
  31: { x:147, y:493 }, // 26 ~ 15 사이
  // 대각2: 10(60,60)→32→28→25→29→33→0(580,580)
  32: { x:147, y:147 }, // 10 ~ 28 사이
  28: { x:233, y:233 },
  29: { x:407, y:407 },
  33: { x:493, y:493 }, // 29 ~ 0 사이
};

// 칸 종류 (외곽 칸 0-19, 대각 25-29)
const CORNER_CELLS  = new Set([0, 5, 10, 15]);
const CENTER_CELL   = 25;
const MISSION_CELLS = new Set([3, 8, 13, 18]);
const LUCKY_CELLS   = new Set([2, 6, 9, 12, 16, 19]);
const START_CELL    = 0;

// 미션 목록
const MISSIONS = [
  {
    sel: '자기',
    titleKo: '"나는 ○○한 사람입니다" 한 바퀴',
    titleId: '"Aku adalah orang yang ○○"',
    contentKo: '모둠원이 돌아가며 자신을 한 단어로 표현하세요. 앞 사람이 말한 단어와 겹치지 않게!',
    contentId: 'Setiap anggota menyebutkan satu kata yang menggambarkan diri mereka. Jangan sampai sama dengan yang sudah disebutkan!',
  },
  {
    sel: '대인관계',
    titleKo: '우리 모둠 공통점 1개 외치기',
    titleId: 'Teriakkan 1 kesamaan kelompok!',
    contentKo: '인도네시아 친구 포함 모둠 전원이 30초 안에 공통점 1개를 찾아 크게 외치세요! 단, 앞 모둠이 외친 공통점과 겹치지 않아야 해요.',
    contentId: 'Seluruh anggota termasuk teman Indonesia — temukan 1 kesamaan dalam 30 detik dan teriakkan! Tidak boleh sama dengan kelompok sebelumnya.',
  },
  {
    sel: '대인관계',
    titleKo: '처음 만난 친구에게 뭐라고 말 걸까?',
    titleId: 'Apa yang kamu katakan kepada teman baru?',
    contentKo: '한국에 처음 온 인도네시아 친구에게, 또는 인도네시아에 처음 간 한국 친구에게 — 모둠원이 돌아가면서 말을 걸어 보세요!',
    contentId: 'Kepada teman Indonesia yang baru pertama kali ke Korea, atau teman Korea yang baru pertama kali ke Indonesia — setiap anggota bergantian menyapa!',
  },
  {
    sel: '공동체/마음건강',
    titleKo: '지금 옆 모둠원에게 한 마디',
    titleId: 'Ucapkan satu kalimat untuk teman di sampingmu',
    contentKo: '모둠원이 돌아가며 시계방향으로 옆 사람에게 따뜻한 말 한 마디를 전하세요. 응원·감사·칭찬 무엇이든 OK!',
    contentId: 'Setiap anggota bergantian searah jarum jam — ucapkan satu kalimat hangat kepada teman di samping. Semangat, terima kasih, atau pujian — semuanya boleh!',
  },
];

// 윷 결과 정의 (UI 버튼 레이블용 참조)
const YUT_RESULTS = [
  { name: '백도', nameId: 'Mundur Satu', move: -1, extra: false },
  { name: '도',   nameId: 'Do',          move: 1,  extra: false },
  { name: '개',   nameId: 'Gae',         move: 2,  extra: false },
  { name: '걸',   nameId: 'Geol',        move: 3,  extra: false },
  { name: '윷',   nameId: 'Yut',         move: 4,  extra: true  },
  { name: '모',   nameId: 'Mo',          move: 5,  extra: true  },
];

/* ───────────────────────────────────────────────
   2. 게임 상태
   ─────────────────────────────────────────────── */

let G = {}; // 전체 게임 상태

function initGameState(settings) {
  // 이전 게임의 잔류 타이머/오버레이 정리
  if (_missionTimer) { clearInterval(_missionTimer); _missionTimer = null; }
  _missionTeam = null;
  _pendingMove = null;
  document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'));

  const teams = settings.teamNames.map((name, i) => ({
    id: i,
    name,
    color: TEAM_COLORS[i % TEAM_COLORS.length],
    score: 0,
    pieces: Array.from({ length: settings.piecesPerTeam }, (_, j) => ({
      id: `${i}-${j}`,
      position: START_CELL,
      isHome: true,       // 아직 보드에 나오지 않음
      isFinished: false,
      stackedPieceIds: [], // 업고 있는 말 ID 목록
      stackLeader: null,   // 업혀 있는 경우 리더 ID
      pathChoice: null,    // 'diagonal' | 'outer'
      lastPosition: null,  // 백도 후진용 이전 위치
    })),
    pendingYutResults: [],
    extraThrows: 0,
    extraThrowRequired: false,
    hasInputThisTurn: false,   // 이번 차례에 결과를 입력했는가 (추가 던지기 제외)
    finishedCount: 0,
  }));

  _history = [];
  G = {
    settings,
    teams,
    currentTeamIndex: 0,
    turnCount: 0,
    isGameActive: true,
    phase: 'waiting_throw', // waiting_throw | waiting_move | path_choice | animating | mission | game_over
    selectedYutIndex: null,
    selectedPieceId: null,
  };
  saveState();
}

function saveState() {
  try { localStorage.setItem('yutgame_state', JSON.stringify(G)); } catch {}
}

function loadState() {
  try {
    const raw = localStorage.getItem('yutgame_state');
    if (raw) { G = JSON.parse(raw); return true; }
  } catch {}
  return false;
}

/* ───────────────────────────────────────────────
   3. (예약됨 - 윷 시뮬레이션 제거됨)
   실제 윷을 던진 결과를 교사가 직접 입력하는 방식 사용
   ─────────────────────────────────────────────── */

/* ───────────────────────────────────────────────
   4. 이동 경로 계산
   ─────────────────────────────────────────────── */

// 외곽 순서: 0→1→2→3→4→5→6→7→8→9→10→11→12→13→14→15→16→17→18→19→(0=날밭)
const OUTER_PATH = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19];

// 경로 그래프: 각 칸에서 갈 수 있는 다음 칸들
// pathChoice: 모서리에서 'diagonal' | 'outer' 선택에 따라 분기
function getNextCells(pos, pathChoice) {
  // 외곽 경로
  const outerIdx = OUTER_PATH.indexOf(pos);
  if (outerIdx !== -1 && pos !== 5 && pos !== 10 && !isDiagCell(pos)) {
    const nextOuter = outerIdx + 1 < OUTER_PATH.length ? OUTER_PATH[outerIdx + 1] : START_CELL;
    return [nextOuter];
  }
  // 모서리 분기
  if (pos === 5)  return pathChoice === 'diagonal' ? [30] : [6];
  if (pos === 10) return pathChoice === 'diagonal' ? [32] : [11];
  // 대각선 경로 (대각1: 5→30→27→25→26→31→15)
  if (pos === 30) return [27];
  if (pos === 27) return [25];
  if (pos === 26) return [31];
  if (pos === 31) return [15];
  // 대각선 경로 (대각2: 10→32→28→25→29→33→0)
  if (pos === 32) return [28];
  if (pos === 28) return [25];
  if (pos === 29) return [33];
  if (pos === 33) return [START_CELL];
  // 중앙 분기
  if (pos === 25) return pathChoice === 'diagonal_to_15' ? [26] : [29];
  if (pos === 15) return [16];
  if (pos === 20) return [START_CELL];
  // 외곽 나머지
  if (outerIdx !== -1) {
    const nextOuter = outerIdx + 1 < OUTER_PATH.length ? OUTER_PATH[outerIdx + 1] : START_CELL;
    return [nextOuter];
  }
  return [START_CELL];
}

function isDiagCell(pos) { return [25,26,27,28,29,30,31,32,33].includes(pos); }

function getPieceLabel(piece) {
  const parts = piece.id.split('-');
  const teamNum = parseInt(parts[0]) + 1;
  const pieceNum = parseInt(parts[1]) + 1;
  return G.settings && G.settings.piecesPerTeam === 1 ? `${teamNum}` : `${teamNum}-${pieceNum}`;
}

// 말의 현재 경로 맥락을 고려한 단계별 다음 칸 결정
// piece.pathHistory: 지나온 칸 기록으로 경로 판단
function stepForward(piece, pathChoice) {
  const pos = piece.position;
  // 센터(25)에서 분기
  if (pos === 25) return pathChoice === 'outer' ? 29 : 26;
  if (pos === 5)  return pathChoice === 'diagonal' ? 30 : 6;
  if (pos === 10) return pathChoice === 'diagonal' ? 32 : 11;
  if (pos === 30) return 27;
  if (pos === 27) return 25;
  if (pos === 26) return 31;
  if (pos === 31) return 15;
  if (pos === 32) return 28;
  if (pos === 28) return 25;
  if (pos === 29) return 33;
  if (pos === 33) return START_CELL;
  // 외곽
  const outerIdx = OUTER_PATH.indexOf(pos);
  if (outerIdx !== -1) {
    if (outerIdx + 1 < OUTER_PATH.length) return OUTER_PATH[outerIdx + 1];
    return START_CELL; // 마지막 외곽(19) → 날밭(0)
  }
  return START_CELL;
}

// 경로 선택이 필요한 칸인지 확인
function needsPathChoice(pos) {
  return pos === 5 || pos === 10 || pos === 25;
}

// move칸만큼 이동한 최종 위치와 경로 선택이 필요한 지점 반환
// returns { path: [cells], needsChoice: bool, choiceAt: pos | null }
function computePath(piece, move, pathChoices) {
  // pathChoices: { pos: 'diagonal'|'outer' } 미리 결정된 분기
  if (move < 0) {
    if (piece.isHome) return { path: [], needsChoice: false, baekdo_home: true };
    const outerIdx = OUTER_PATH.indexOf(piece.position);
    if (outerIdx > 0) return { path: [OUTER_PATH[outerIdx - 1]], needsChoice: false };
    if (outerIdx === 0) return { path: [], needsChoice: false }; // 출발 칸에서 더 후진 불가
    // 대각선 칸: lastPosition으로 1칸 후진
    if (piece.lastPosition !== null && piece.lastPosition !== undefined) {
      return { path: [piece.lastPosition], needsChoice: false };
    }
    return { path: [], needsChoice: false };
  }

  let path = [];
  let cur = piece.position;
  let choices = Object.assign({}, pathChoices || {});
  let prevPos = null;

  for (let step = 0; step < move; step++) {
    if (needsPathChoice(cur) && !(cur in choices)) {
      if (step === 0) {
        // 말의 출발 위치가 꼭지점 → 경로 선택 필요
        return { path, needsChoice: true, choiceAt: cur };
      }
      // 중앙(25) 경유: 이전 위치로 대각선 방향 자동 결정
      // 27에서 왔으면 → 26(좌하) 방향, 28에서 왔으면 → 29(우하) 방향
      if (cur === 25 && prevPos === 27) {
        choices[cur] = 'diagonal'; // 5→27→25: 계속 대각(26→15)
      } else {
        choices[cur] = 'outer';    // 나머지 꼭지점 경유: 외곽 자동
      }
    }
    prevPos = cur;
    const pc = choices[cur] || 'outer';
    const next = stepForward({ position: cur }, pc);
    path.push(next);
    cur = next;
    if (cur === START_CELL && step < move - 1) {
      // 날밭 도달 → 완주 처리
      break;
    }
  }
  return { path, needsChoice: false, choiceAt: null };
}

/* ───────────────────────────────────────────────
   5. SVG 보드 렌더링
   ─────────────────────────────────────────────── */

function renderBoard() {
  const svg = document.getElementById('yut-board');
  svg.innerHTML = '';

  // 배경
  const bg = makeSVG('rect', { x:0, y:0, width:640, height:640, fill:'#F5E6C8' });
  svg.appendChild(bg);

  // 외곽 테두리 선 (정사각형)
  const outerRect = makeSVG('rect', { x:60, y:60, width:520, height:520, fill:'none', stroke:'#8B5E3C', 'stroke-width':3 });
  svg.appendChild(outerRect);

  // 대각선 (점선)
  const lines = [
    [580,580, 60,60],   // 우하→좌상 (5↔15 방향)
    [60,580,  580,60],  // 우상→좌하 (10↔20 방향? 실제론 5→26→25→27→15)
  ];
  // 실제 PRD 기준 대각선: 5↔26↔25↔27↔15  /  10↔28↔25↔29↔0(날밭)
  // 좌표로 그리기
  const diagLines = [
    // 대각1: 5(580,60)→30(493,147)→27(407,233)→25(320,320)→26(233,407)→31(147,493)→15(60,580)
    [[580,60],[493,147],[407,233],[320,320],[233,407],[147,493],[60,580]],
    // 대각2: 10(60,60)→32(147,147)→28(233,233)→25(320,320)→29(407,407)→33(493,493)→0(580,580)
    [[60,60],[147,147],[233,233],[320,320],[407,407],[493,493],[580,580]],
  ];
  diagLines.forEach(pts => {
    const d = 'M ' + pts.map(p => p.join(',')).join(' L ');
    const el = makeSVG('path', { d, fill:'none', stroke:'#8B5E3C', 'stroke-width':2.5, 'stroke-dasharray':'8,4' });
    svg.appendChild(el);
  });

  // 칸 렌더링
  const allCells = [...Array(20).keys(), 25, 26, 27, 28, 29, 30, 31, 32, 33];
  allCells.forEach(id => renderCell(svg, id));

  // 말 렌더링
  renderPieces(svg);
}

function renderCell(svg, id) {
  const coord = CELL_COORDS[id];
  if (!coord) return;
  const { x, y } = coord;

  let r = 18, fill = '#FFFFFF', strokeW = 2;
  let icon = '';

  if (id === START_CELL) {
    r = 26; fill = '#E8F5E9'; strokeW = 3;
  } else if (id === CENTER_CELL) {
    r = 26; fill = '#FFD700'; strokeW = 3;
  } else if (CORNER_CELLS.has(id) && id !== START_CELL) {
    r = 22; fill = '#FFF3CD'; strokeW = 3;
  } else if (MISSION_CELLS.has(id)) {
    fill = '#FFE4E1';
    icon = '?';
  } else if (LUCKY_CELLS.has(id)) {
    fill = '#FFFDE7';
    icon = '★';
  } else if (isDiagCell(id)) {
    r = 16; fill = '#FFF8E1'; strokeW = 2;
  }

  const circle = makeSVG('circle', {
    cx: x, cy: y, r,
    fill, stroke: '#8B5E3C', 'stroke-width': strokeW,
    'data-cell': id, class: 'cell-circle',
  });
  svg.appendChild(circle);

  // 출발 칸 텍스트
  if (id === START_CELL) {
    const t1 = makeSVGText(x, y - 6, '출발', 11, '#3E2723', true);
    const t2 = makeSVGText(x, y + 8, 'Mulai', 9, '#6D4C41', false, true);
    svg.appendChild(t1); svg.appendChild(t2);
  }

  // 아이콘
  if (icon) {
    const ic = makeSVG('text', {
      x, y: y + 5, 'text-anchor':'middle', 'font-size': icon === '?' ? 16 : 13,
      fill: icon === '?' ? '#C62828' : '#FFB300', 'font-weight':'700', class:'cell-icon',
    });
    ic.textContent = icon;
    svg.appendChild(ic);
  }
}

function renderPieces(svg) {
  if (!G.teams) return;
  // 위치별로 말 그룹화 (홈 말은 START_CELL에 표시)
  const cellGroups = {};
  G.teams.forEach(team => {
    team.pieces.forEach(piece => {
      if (piece.isFinished || piece.stackLeader) return;
      const key = piece.isHome ? START_CELL : piece.position;
      if (!cellGroups[key]) cellGroups[key] = [];
      cellGroups[key].push({ team, piece });
    });
  });

  Object.entries(cellGroups).forEach(([pos, entries]) => {
    const coord = CELL_COORDS[parseInt(pos)];
    if (!coord) return;

    // 홈 말과 보드 말 분리
    const homeEntries   = entries.filter(e => e.piece.isHome);
    const boardEntries  = entries.filter(e => !e.piece.isHome);

    // 보드 위 말 렌더링
    boardEntries.forEach((entry, i) => {
      const offset = boardEntries.length > 1 ? (i - (boardEntries.length - 1) / 2) * 14 : 0;
      const cx = coord.x + offset;
      const cy = coord.y;
      const stackCount = entry.piece.stackedPieceIds.length + 1;
      const r = stackCount > 1 ? 14 : 11;
      const isActive = entry.team.id === G.teams[G.currentTeamIndex].id && G.phase !== 'animating';
      const c = makeSVG('circle', {
        cx, cy, r,
        fill: entry.team.color, stroke: '#FFFFFF', 'stroke-width': 2.5,
        class: 'piece-circle' + (isActive ? ' piece-active' : ''),
        'data-piece': entry.piece.id,
      });
      c.addEventListener('click', () => onPieceClick(entry.piece.id));
      svg.appendChild(c);
      {
        const label = stackCount > 1 ? `×${stackCount}` : getPieceLabel(entry.piece);
        const fontSize = stackCount > 1 ? 10 : (G.settings.piecesPerTeam === 1 ? 9 : 7);
        const t = makeSVG('text', { x:cx, y:cy+1, 'text-anchor':'middle', 'dominant-baseline':'central', fill:'#FFFFFF', 'font-size':fontSize, 'font-weight':'700' });
        t.textContent = label;
        svg.appendChild(t);
      }
    });

    // 홈 말: 팀별로 묶어서 출발 칸 주변 소형 표시
    if (homeEntries.length > 0) {
      // 팀별 그룹화
      const byTeam = {};
      homeEntries.forEach(e => {
        if (!byTeam[e.team.id]) byTeam[e.team.id] = { team: e.team, pieces: [] };
        byTeam[e.team.id].pieces.push(e.piece);
      });
      const teamList = Object.values(byTeam);
      const total = teamList.length;
      teamList.forEach((tg, i) => {
        const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
        const dist = total === 1 ? 0 : 22;
        const cx = coord.x + Math.cos(angle) * dist;
        const cy = coord.y + Math.sin(angle) * dist;
        const firstPiece = tg.pieces[0];
        const isHomeActive = tg.team.id === G.teams[G.currentTeamIndex].id && G.phase !== 'animating';
        const c = makeSVG('circle', {
          cx, cy, r: 9,
          fill: tg.team.color, stroke: '#FFFFFF', 'stroke-width': 1.5, opacity: 0.55,
          class: 'piece-circle' + (isHomeActive ? ' piece-active' : ''),
          'data-piece': firstPiece.id,
        });
        c.addEventListener('click', () => onPieceClick(firstPiece.id));
        svg.appendChild(c);
        {
          const teamNum = tg.team.id + 1;
          const label = tg.pieces.length > 1 ? `${teamNum}(${tg.pieces.length})` : `${teamNum}`;
          const t = makeSVG('text', { x:cx, y:cy+1, 'text-anchor':'middle', 'dominant-baseline':'central', fill:'#FFFFFF', 'font-size':7, 'font-weight':'700' });
          t.textContent = label;
          svg.appendChild(t);
        }
      });
    }
  });
}

function makeSVG(tag, attrs) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}
function makeSVGText(x, y, text, size, fill, bold, italic) {
  const el = makeSVG('text', {
    x, y, 'text-anchor':'middle', 'font-size': size, fill,
    'font-weight': bold ? '700' : '400',
    'font-style': italic ? 'italic' : 'normal',
    'font-family': 'Gowun Batang, serif',
  });
  el.textContent = text;
  return el;
}

/* ───────────────────────────────────────────────
   6. 점수판 렌더링
   ─────────────────────────────────────────────── */

function renderScoreboard() {
  if (!G.teams) return;

  // 사이드바: 현재 팀 점수만 표시
  const cur = document.getElementById('current-team-score');
  if (cur) {
    const team = G.teams[G.currentTeamIndex];
    const finished = team.pieces.filter(p => p.isFinished).length;
    cur.innerHTML = `
      <div class="score-dot" style="background:${team.color}"></div>
      <div class="score-name">${team.name}</div>
      <div class="score-value">${team.score}점</div>
      <div class="score-pieces" style="font-size:0.72rem;color:#888;margin-left:auto;">완주 ${finished}/${team.pieces.length}</div>
    `;
  }

  // 팝업 열려 있으면 동기화
  const popup = document.getElementById('scores-overlay');
  if (popup && !popup.classList.contains('hidden')) {
    renderScoresPopup();
  }
}

function renderScoresPopup() {
  const list = document.getElementById('scores-full-list');
  if (!list || !G.teams) return;
  const sorted = [...G.teams].sort((a, b) => b.score - a.score);
  list.innerHTML = '';
  sorted.forEach((team) => {
    const isCurrentTurn = team.id === G.teams[G.currentTeamIndex].id;
    const div = document.createElement('div');
    div.className = 'score-item' + (isCurrentTurn ? ' current-turn' : '');
    const onBoard = team.pieces.filter(p => !p.isHome && !p.isFinished).length;
    const finished = team.pieces.filter(p => p.isFinished).length;
    div.innerHTML = `
      <div class="score-dot" style="background:${team.color}"></div>
      <div class="score-name">${team.name}</div>
      <div style="margin-left:auto;text-align:right;">
        <div class="score-value">${team.score}점</div>
        <div class="score-pieces" style="font-size:0.72rem;color:#888;">보드:${onBoard} 완주:${finished}</div>
      </div>
    `;
    list.appendChild(div);
  });
}

function renderCurrentTurn() {
  const el = document.getElementById('current-team-display');
  if (!el || !G.teams) return;
  const team = G.teams[G.currentTeamIndex];
  el.textContent = team.name;
  el.style.color = team.color;

  const hint = document.getElementById('phase-hint');
  if (!hint) return;
  const hintMap = {
    waiting_throw: { cls: 'throw', text: '🎯 윷을 던지고 결과를 입력하세요 / Lempar yut!' },
    waiting_move:  { cls: 'move',  text: '♟ 결과 칩을 선택 후 말을 클릭하세요 / Pilih bidak!' },
    animating:     { cls: 'move',  text: '⏳ 이동 중… / Bergerak…' },
  };
  const h = hintMap[G.phase];
  if (h) {
    hint.className = `phase-hint visible ${h.cls}`;
    hint.textContent = h.text;
  } else {
    hint.className = 'phase-hint';
  }
}

function renderPendingResults() {
  const container = document.getElementById('pending-results');
  if (!container || !G.teams) return;
  container.innerHTML = '';
  const team = G.teams[G.currentTeamIndex];
  team.pendingYutResults.forEach((result, i) => {
    const chip = document.createElement('div');
    chip.className = 'pending-chip' + (G.selectedYutIndex === i ? ' selected' : '');
    chip.textContent = `${result.name} ${result.move > 0 ? '+' : ''}${result.move}칸`;
    chip.addEventListener('click', () => selectYutResult(i));
    container.appendChild(chip);
  });
}

/* ───────────────────────────────────────────────
   7. 게임 이벤트 핸들러
   ─────────────────────────────────────────────── */

// 전체 점수 팝업
document.getElementById('btn-show-scores').addEventListener('click', () => {
  renderScoresPopup();
  document.getElementById('scores-overlay').classList.remove('hidden');
});
document.getElementById('btn-close-scores').addEventListener('click', () => {
  document.getElementById('scores-overlay').classList.add('hidden');
});

// 결과 입력 버튼
document.getElementById('btn-throw').addEventListener('click', openThrowOverlay);
document.getElementById('btn-close-throw').addEventListener('click', () => {
  document.getElementById('throw-overlay').classList.add('hidden');
});
// 결과 선택 버튼들
document.querySelectorAll('.btn-yut-result').forEach(btn => {
  btn.addEventListener('click', () => {
    const move    = parseInt(btn.dataset.move);
    const name    = btn.dataset.name;
    const nameId  = btn.dataset.nameId;
    const extra   = move >= 4; // 윷(4) 또는 모(5)
    selectYutResult_input({ name, nameId, move, extra });
  });
});

// 이전으로 (간단 구현)
document.getElementById('btn-undo').addEventListener('click', () => {
  if (_history.length === 0) { alert('되돌릴 기록이 없습니다.'); return; }
  if (!confirm('마지막 동작을 취소하시겠습니까?')) return;
  G = JSON.parse(_history.pop());
  saveState();
  renderAll();
  updateActionButtons();
});

// 게임 종료
document.getElementById('btn-end-game').addEventListener('click', () => {
  if (!confirm('수업을 마치시겠습니까?\nAkhiri pelajaran?')) return;
  showResultScreen();
});

// 다시 시작
document.getElementById('btn-restart').addEventListener('click', () => {
  switchScreen('screen-setup');
});

// 설정 버튼
document.getElementById('btn-settings').addEventListener('click', () => {
  if (!confirm('설정 화면으로 돌아가면 현재 게임이 초기화됩니다. 계속하시겠습니까?')) return;
  switchScreen('screen-setup');
});

// 경로 선택 버튼
document.getElementById('btn-path-diagonal').addEventListener('click', () => onPathChoice('diagonal'));
document.getElementById('btn-path-outer').addEventListener('click', () => onPathChoice('outer'));

// 업기 다이얼로그
document.getElementById('btn-stack-yes').addEventListener('click', () => onStackChoice(true));
document.getElementById('btn-stack-no').addEventListener('click', () => onStackChoice(false));

// 미션 버튼
document.getElementById('btn-mission-success').addEventListener('click', () => onMissionResult('success'));
document.getElementById('btn-mission-fail').addEventListener('click', () => onMissionResult('fail'));
document.getElementById('btn-mission-skip').addEventListener('click', () => onMissionResult('skip'));

/* ───────────────────────────────────────────────
   8. 윷 결과 입력
   ─────────────────────────────────────────────── */

function openThrowOverlay() {
  document.getElementById('throw-overlay').classList.remove('hidden');
}

function selectYutResult_input(result) {
  document.getElementById('throw-overlay').classList.add('hidden');

  pushHistory();
  const team = G.teams[G.currentTeamIndex];
  team.pendingYutResults.push(result);

  // 방금 추가한 결과를 자동 선택, 추가 던지기 완료 처리
  G.selectedYutIndex = team.pendingYutResults.length - 1;
  team.extraThrowRequired = false;
  team.hasInputThisTurn = true;

  if (result.extra) {
    showToast(`${result.name}! 이동 후 한 번 더 입력하세요. (Lempar Lagi)`, 'positive');
  } else {
    showToast(`${result.name} (${result.nameId}) — ${result.move > 0 ? '+' : ''}${result.move}칸`, 'positive');
  }

  G.phase = 'waiting_move';
  saveState();
  renderAll();
  updateActionButtons();

  // 이동 가능한 말이 1개이면 자동 이동
  const movable = team.pieces.filter(p => !p.isFinished && !p.stackLeader);
  if (movable.length === 1) {
    setTimeout(() => onPieceClick(movable[0].id), 500);
  }
}

/* ───────────────────────────────────────────────
   9. 말 이동 처리
   ─────────────────────────────────────────────── */

let _pendingMove = null; // { pieceId, result, yutIndex, pathChoices }
let _history = [];      // undo 스택 (G 외부에 보관 — G.history에 넣으면 직렬화 시 지수 증가)

function selectYutResult(index) {
  G.selectedYutIndex = index;
  renderPendingResults();
  updateActionButtons();
}

function onPieceClick(pieceId) {
  if (G.phase !== 'waiting_move') return;
  if (G.selectedYutIndex === null) {
    showMessage('먼저 던진 결과 칩을 선택하세요.');
    return;
  }
  const team = G.teams[G.currentTeamIndex];
  const result = team.pendingYutResults[G.selectedYutIndex];
  const piece = findPiece(pieceId);
  if (!piece) return;
  // 다른 팀 말은 선택 불가
  if (!team.pieces.find(p => p.id === pieceId)) return;
  // 완주/업혀있는 말 선택 불가
  if (piece.isFinished || piece.stackLeader) return;

  _pendingMove = { pieceId, result, yutIndex: G.selectedYutIndex, pathChoices: {} };
  processMoveStep();
}

async function processMoveStep() {
  const pm = _pendingMove;
  if (!pm) return;
  const piece = findPiece(pm.pieceId);
  const result = computePath(piece, pm.result.move, pm.pathChoices);

  if (result.needsChoice) {
    G.phase = 'path_choice';
    window._pathChoicePos = result.choiceAt;
    const labels     = { 5:'우상 모서리 (칸5)', 10:'좌상 모서리 (칸10)', 25:'중앙 (칸25)' };
    const diagLabels = { 5:'↙ 대각선으로', 10:'↘ 대각선으로', 25:'↙ 좌하 모서리로' };
    const outerLabels= { 5:'← 외곽으로 (칸6)', 10:'↓ 외곽으로 (칸11)', 25:'↘ 출발 방향으로' };
    document.getElementById('path-corner-info').textContent = `현재 위치: ${labels[result.choiceAt] || result.choiceAt}`;
    document.getElementById('btn-path-diagonal').childNodes[0].textContent = diagLabels[result.choiceAt] || '대각선으로';
    document.getElementById('btn-path-outer').childNodes[0].textContent = outerLabels[result.choiceAt] || '외곽으로';
    document.getElementById('path-dialog').classList.remove('hidden');
    return;
  }

  await applyMove(pm.pieceId, result.path, result.baekdo_home);
}

async function onPathChoice(choice) {
  document.getElementById('path-dialog').classList.add('hidden');
  G.phase = 'waiting_move';
  const pos = window._pathChoicePos;
  _pendingMove.pathChoices[pos] = choice;
  // 센터(25)에서 분기: diagonal_to_15 vs outer(29)
  if (pos === 25) {
    _pendingMove.pathChoices[25] = choice === 'diagonal' ? 'diagonal' : 'outer';
  }
  await processMoveStep();
}

async function applyMove(pieceId, path, isBaekdoHome) {
  if (isBaekdoHome) {
    showToast('백도 — 출발 전 말은 내보내지 않습니다 (Mundur Satu)', 'negative');
    removeUsedYutResult();
    _pendingMove = null;
    const remB = G.teams[G.currentTeamIndex].pendingYutResults.length;
    G.phase = remB > 0 ? 'waiting_move' : 'waiting_throw';
    saveState(); renderAll(); updateActionButtons();
    checkAutoNextTurn();
    return;
  }
  if (!path || path.length === 0) {
    removeUsedYutResult();
    _pendingMove = null;
    const remE = G.teams[G.currentTeamIndex].pendingYutResults.length;
    G.phase = remE > 0 ? 'waiting_move' : 'waiting_throw';
    saveState(); renderAll(); updateActionButtons();
    checkAutoNextTurn();
    return;
  }

  pushHistory();
  const piece = findPiece(pieceId);
  const team  = G.teams[G.currentTeamIndex];
  const finalPos = path[path.length - 1];
  const wasHome  = piece.isHome;
  const allMovingIds = [pieceId, ...piece.stackedPieceIds];

  // ── 칸 단위 이동 애니메이션 ──────────────────────────
  G.phase = 'animating';
  updateActionButtons();
  for (const nextPos of path) {
    allMovingIds.forEach(pid => {
      const p = findPiece(pid);
      if (p) { p.lastPosition = p.position; p.position = nextPos; }
    });
    piece.isHome = false;
    renderBoard();
    await new Promise(r => setTimeout(r, 300));
  }

  // ── 날밭 완주 ──────────────────────────────────────
  const isBaekdoMove = _pendingMove && _pendingMove.result && _pendingMove.result.move < 0;
  if (finalPos === START_CELL && !wasHome && !isBaekdoMove) {
    allMovingIds.forEach(pid => {
      const p = findPiece(pid);
      if (p) { p.isFinished = true; p.stackLeader = null; p.stackedPieceIds = []; }
    });
    team.finishedCount = (team.finishedCount || 0) + allMovingIds.length;
    team.score += G.settings.completionBonus;
    showToast(`🎉 완주! +${G.settings.completionBonus}점 (Selesai!)`, 'positive');
    removeUsedYutResult();
    _pendingMove = null;
    team.extraThrowRequired = false;
    const afterFinish = team.pendingYutResults.length;
    G.phase = afterFinish > 0 ? 'waiting_move' : 'waiting_throw';
    saveState(); renderAll(); updateActionButtons();
    checkGameOver();
    checkAutoNextTurn();
    return;
  }

  // ── 잡기 확인 ──────────────────────────────────────
  const captureInfo = checkCapture(piece, team);
  if (captureInfo) {
    // PRD: 윷·모로 잡은 경우 추가 던지기는 1번만 (윷·모 extra가 이미 있으므로 추가 안 함)
    const resultWasExtra = _pendingMove && _pendingMove.result && _pendingMove.result.extra;
    showToast(
      `🎯 잡았습니다! ${captureInfo.capturedTeamName} 말 ${captureInfo.count}개 → 출발로! 한 번 더! (Tangkap!)`,
      'positive'
    );
    const captureEvent = checkCellEvent(finalPos, team);
    removeUsedYutResult();
    _pendingMove = null;
    // 잡기 → 추가 던지기 (윷/모로 잡아도 1번 추가)
    team.extraThrowRequired = true;
    team.hasInputThisTurn = false;
    if (captureEvent !== 'mission') {
      G.phase = 'waiting_throw';
      setTimeout(() => openThrowOverlay(), 600);
    }
    saveState(); renderAll(); updateActionButtons();
    return;
  }

  // ── 업기 확인 ──────────────────────────────────────
  const stackable = checkStackable(piece, team);
  if (stackable.length > 0) {
    G.phase = 'path_choice';
    window._stackPendingPieceId = pieceId;
    removeUsedYutResult();
    saveState(); renderAll();
    document.getElementById('stack-dialog').classList.remove('hidden');
    return;
  }

  // ── 칸 이벤트 (미션·행운) ──────────────────────────
  const cellEvent = checkCellEvent(finalPos, team);

  const wasExtra = _pendingMove && _pendingMove.result && _pendingMove.result.extra;
  removeUsedYutResult();
  _pendingMove = null;
  // 미션 팝업이 열린 경우 phase는 showMission이 관리
  if (cellEvent !== 'mission') {
    const remaining = G.teams[G.currentTeamIndex].pendingYutResults.length;
    G.phase = remaining > 0 ? 'waiting_move' : 'waiting_throw';
    // 윷/모 이동 완료 → 추가 던지기 필요
    if (wasExtra) { team.extraThrowRequired = true; team.hasInputThisTurn = false; }
  }
  saveState(); renderAll(); updateActionButtons();
  checkAutoNextTurn();
}

function removeUsedYutResult() {
  const team = G.teams[G.currentTeamIndex];
  // Prefer index captured at piece-click time; fall back to current selection
  const idx = (_pendingMove && _pendingMove.yutIndex !== null && _pendingMove.yutIndex !== undefined)
    ? _pendingMove.yutIndex
    : G.selectedYutIndex;
  if (idx !== null && idx !== undefined) {
    team.pendingYutResults.splice(idx, 1);
  }
  G.selectedYutIndex = null;
}

// 잡기: 상대 말(리더만) 검색 → 잡기 실행 후 정보 반환 (없으면 null)
function checkCapture(piece, team) {
  const pos = piece.position;
  for (const otherTeam of G.teams) {
    if (otherTeam.id === team.id) continue;
    // stackLeader가 없는 말(리더·단독)만 확인 → 업힌 follower는 리더를 통해 처리
    const leaders = otherTeam.pieces.filter(p =>
      p.position === pos && !p.isHome && !p.isFinished && !p.stackLeader
    );
    if (leaders.length === 0) continue;

    // 잡힌 말 ID 수집 (리더 + 업힌 말 전부)
    const capturedIds = [];
    leaders.forEach(leader => {
      capturedIds.push(leader.id, ...leader.stackedPieceIds);
    });

    // 출발로 되돌리기
    capturedIds.forEach(cid => {
      const cp = findPiece(cid);
      if (cp) {
        cp.position = START_CELL;
        cp.isHome = true;
        cp.stackLeader = null;
        cp.stackedPieceIds = [];
      }
    });

    return { capturedTeamName: otherTeam.name, count: capturedIds.length };
  }
  return null;
}

// 업기: 같은 팀 리더 말 목록 반환
function checkStackable(piece, team) {
  const pos = piece.position;
  return team.pieces.filter(p =>
    p.id !== piece.id &&
    p.position === pos &&
    !p.isHome &&
    !p.isFinished &&
    !p.stackLeader
  );
}

function onStackChoice(doStack) {
  document.getElementById('stack-dialog').classList.add('hidden');
  G.phase = 'waiting_move';
  const pieceId = window._stackPendingPieceId;
  const piece   = findPiece(pieceId);
  const team    = G.teams[G.currentTeamIndex];

  if (doStack) {
    // 같은 칸의 리더 말들을 이 말 아래로 업기
    const stackable = checkStackable(piece, team);
    stackable.forEach(other => {
      // other의 업힌 말들도 함께 흡수
      piece.stackedPieceIds.push(other.id, ...other.stackedPieceIds);
      other.stackLeader = pieceId;
      other.stackedPieceIds = [];
    });
    const total = piece.stackedPieceIds.length + 1;
    showToast(`업었습니다! 말 ${total}개 함께 이동 (Tumpuk!)`, 'positive');
  }

  // 업기 후 칸 이벤트 확인
  const stackCellEvent = checkCellEvent(piece.position, team);
  _pendingMove = null;
  saveState(); renderAll(); updateActionButtons();
  if (stackCellEvent !== 'mission') checkAutoNextTurn();
}

function checkCellEvent(pos, team) {
  if (MISSION_CELLS.has(pos)) {
    showMission(team);
    return 'mission';
  }
  if (LUCKY_CELLS.has(pos)) {
    const bonus = 5;
    team.score += bonus;
    showToast(`행운! +${bonus}점 ★`, 'positive');
    saveState(); renderScoreboard();
    return 'lucky';
  }
  return null;
}

/* ───────────────────────────────────────────────
   10. 미션 팝업
   ─────────────────────────────────────────────── */

let _missionTimer = null;
let _missionTeam = null;

function showMission(team) {
  _missionTeam = team;
  G.phase = 'mission';
  const mission = MISSIONS[Math.floor(Math.random() * MISSIONS.length)];
  const selColors = { '자기':'#E3F2FD', '대인관계':'#E8F5E9', '공동체':'#FFF3E0', '마음건강':'#FCE4EC' };

  document.getElementById('mission-sel-tag').textContent = `${mission.sel} (SEL)`;
  document.getElementById('mission-sel-tag').style.background = selColors[mission.sel] || '#FFF3CD';
  document.getElementById('mission-title-ko').textContent = mission.titleKo;
  document.getElementById('mission-title-id').textContent = mission.titleId;
  document.getElementById('mission-content-ko').textContent = mission.contentKo;
  document.getElementById('mission-content-id').textContent = mission.contentId;

  // 타이머
  let sec = 180;
  const bar = document.getElementById('mission-timer-bar');
  const txt = document.getElementById('mission-timer-text');
  bar.style.width = '100%';
  bar.className = 'mission-timer-bar';
  txt.textContent = sec;

  if (_missionTimer) clearInterval(_missionTimer);
  _missionTimer = setInterval(() => {
    sec--;
    const pct = (sec / 180) * 100;
    bar.style.width = `${pct}%`;
    txt.textContent = sec;
    if (sec <= 10) bar.className = 'mission-timer-bar danger';
    else if (sec <= 30) bar.className = 'mission-timer-bar warning';
    if (sec <= 0) {
      clearInterval(_missionTimer);
      onMissionResult('fail');
    }
  }, 1000);

  document.getElementById('mission-overlay').classList.remove('hidden');
}

function onMissionResult(result) {
  if (_missionTimer) clearInterval(_missionTimer);
  document.getElementById('mission-overlay').classList.add('hidden');

  if (!_missionTeam) return;
  const team = _missionTeam;

  if (result === 'success') {
    team.score += G.settings.missionSuccessScore;
    showToast(`미션 성공! +${G.settings.missionSuccessScore}점`, 'positive');
  } else if (result === 'fail') {
    team.score += G.settings.missionFailScore;
    showToast(`미션 실패 ${G.settings.missionFailScore}점`, 'negative');
  }

  // 잡기 후 미션이었다면 추가 던지기 필요 → 결과 입력 창 자동 오픈
  const needsExtraThrow = team.extraThrowRequired;
  const remaining = team.pendingYutResults.length;
  G.phase = needsExtraThrow ? 'waiting_throw' : (remaining > 0 ? 'waiting_move' : 'waiting_throw');

  _missionTeam = null;
  saveState(); renderAll(); updateActionButtons();

  if (needsExtraThrow) {
    setTimeout(() => openThrowOverlay(), 400);
  } else {
    checkAutoNextTurn();
  }
}

/* ───────────────────────────────────────────────
   11. 차례 전환
   ─────────────────────────────────────────────── */

function nextTurn() {
  if (G.phase === 'animating') return;
  const team = G.teams[G.currentTeamIndex];
  if (team.extraThrowRequired) return; // 버튼 비활성 중이지만 방어적 처리

  // 미사용 결과 경고
  if (team.pendingYutResults.length > 0) {
    if (!confirm(`미사용 결과(${team.pendingYutResults.map(r=>r.name).join(', ')})가 있습니다. 넘기시겠습니까?\nAda hasil yang belum digunakan. Lanjutkan?`)) return;
    team.pendingYutResults = [];
  }

  team.extraThrowRequired = false;
  pushHistory();

  // 완주한 팀 건너뛰기
  let nextIdx = (G.currentTeamIndex + 1) % G.teams.length;
  let skips = 0;
  while (G.teams[nextIdx].pieces.every(p => p.isFinished) && skips < G.teams.length) {
    nextIdx = (nextIdx + 1) % G.teams.length;
    skips++;
  }
  G.currentTeamIndex = nextIdx;
  G.turnCount++;
  G.phase = 'waiting_throw';
  G.selectedYutIndex = null;

  const nextTeam = G.teams[G.currentTeamIndex];
  nextTeam.hasInputThisTurn = false;
  showToast(`${nextTeam.name} 차례입니다! (Giliran ${nextTeam.name})`, 'positive');
  saveState(); renderAll(); updateActionButtons();
}

/* ───────────────────────────────────────────────
   12. 게임 종료
   ─────────────────────────────────────────────── */

function checkGameOver() {
  const allDone = G.teams.every(t => t.pieces.every(p => p.isFinished));
  if (allDone) {
    G.isGameActive = false;
    G.phase = 'game_over';
    saveState();
    setTimeout(showResultScreen, 1200);
  }
}

function showResultScreen() {
  const sorted = [...G.teams].sort((a, b) => b.score - a.score);
  const list = document.getElementById('result-list');
  list.innerHTML = '';
  sorted.forEach((team, i) => {
    const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
    const rankEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}`;
    const finished = team.pieces.filter(p => p.isFinished).length;
    const total = team.pieces.length;
    const finishedLabel = finished === total
      ? '완주 🎉'
      : finished > 0 ? `완주 ${finished}/${total}개` : '';
    const item = document.createElement('div');
    item.className = 'result-item';
    item.innerHTML = `
      <div class="result-rank ${rankClass}">${rankEmoji}</div>
      <div class="result-dot" style="background:${team.color}"></div>
      <div class="result-name">${team.name}</div>
      <div class="result-score">${team.score}점</div>
      ${finishedLabel ? `<div class="result-finished">${finishedLabel}</div>` : ''}
    `;
    list.appendChild(item);
  });
  switchScreen('screen-result');
}

/* ───────────────────────────────────────────────
   13. 유틸
   ─────────────────────────────────────────────── */

function findPiece(pieceId) {
  for (const team of G.teams) {
    const p = team.pieces.find(p => p.id === pieceId);
    if (p) return p;
  }
  return null;
}

function pushHistory() {
  _history.push(JSON.stringify(G));
  if (_history.length > 20) _history.shift();
}

function switchScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showToast(msg, type) {
  const el = document.getElementById('score-toast');
  el.textContent = msg;
  el.className = `score-toast ${type}`;
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => { el.classList.add('hidden'); }, 2200);
}

function showMessage(msg) {
  // 간단한 인라인 메시지 (추후 개선 가능)
  console.info(msg);
}

function updateActionButtons() {
  const team = G.teams ? G.teams[G.currentTeamIndex] : null;
  const isAnimating = G.phase === 'animating';
  const mustThrowAgain = !!(team && team.extraThrowRequired);
  const hasInputThisTurn = !!(team && team.hasInputThisTurn);
  const canThrow = !isAnimating && (!hasInputThisTurn || mustThrowAgain);
  const throwBtn = document.getElementById('btn-throw');
  const undoBtn  = document.getElementById('btn-undo');

  throwBtn.disabled = !canThrow;
  undoBtn.disabled  = isAnimating;
}

function checkAutoNextTurn() {
  if (G.phase !== 'waiting_throw') return;
  const team = G.teams[G.currentTeamIndex];
  if (team.hasInputThisTurn && !team.extraThrowRequired && team.pendingYutResults.length === 0) {
    setTimeout(nextTurn, 1500);
  }
}

function renderAll() {
  renderBoard();
  renderScoreboard();
  renderCurrentTurn();
  renderPendingResults();
}

/* ───────────────────────────────────────────────
   14. 설정 화면 로직
   ─────────────────────────────────────────────── */

let setupTeamCount = 9;
let setupPieceCount = 1;

function updateTeamCount(delta) {
  setupTeamCount = Math.min(12, Math.max(2, setupTeamCount + delta));
  document.getElementById('teams-count').textContent = setupTeamCount;
  buildTeamNameInputs();
}

function updatePieceCount(delta) {
  setupPieceCount = Math.min(4, Math.max(1, setupPieceCount + delta));
  document.getElementById('pieces-count').textContent = setupPieceCount;
}

function buildTeamNameInputs() {
  // 팀명 고정 (입력 없음)
}

document.getElementById('btn-teams-minus').addEventListener('click', () => updateTeamCount(-1));
document.getElementById('btn-teams-plus').addEventListener('click', () => updateTeamCount(1));
document.getElementById('btn-pieces-minus').addEventListener('click', () => updatePieceCount(-1));
document.getElementById('btn-pieces-plus').addEventListener('click', () => updatePieceCount(1));

document.getElementById('btn-start').addEventListener('click', () => {
  const teamNames = Array.from({ length: setupTeamCount }, (_, i) => `팀 ${i + 1}`);
  const settings = {
    teamCount: setupTeamCount,
    piecesPerTeam: setupPieceCount,
    missionSuccessScore: parseInt(document.getElementById('score-success').value) || 10,
    missionFailScore: parseInt(document.getElementById('score-fail').value) || -5,
    completionBonus: parseInt(document.getElementById('score-bonus').value) || 20,
    teamNames,
  };
  initGameState(settings);
  switchScreen('screen-game');
  renderAll();
  updateActionButtons();
});

/* ───────────────────────────────────────────────
   15. 초기화
   ─────────────────────────────────────────────── */

(function init() {
  buildTeamNameInputs();

  // 저장된 상태 복구 시도
  if (loadState() && G.isGameActive) {
    switchScreen('screen-game');
    renderAll();
    updateActionButtons();
  } else {
    switchScreen('screen-setup');
  }
})();
