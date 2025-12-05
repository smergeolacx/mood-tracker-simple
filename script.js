/* script.js - Year Mood Tracker (updated: profile is separate page)
   - Profile page moved to profile.html (link from header icon).
   - This file keeps mosaic/month/emotion/poem + download features.
*/

(() => {
  // -- CONFIG --
  const EMOTION_WHEEL = {
    joy: { label: 'Joy', color: '#a8e06e', children: { optimistic:{label:'Optimistic',color:'#b8e87e'}, proud:{label:'Proud',color:'#a8e06e'}, cheerful:{label:'Cheerful',color:'#98d85e'}, happy:{label:'Happy',color:'#88d04e'}, content:{label:'Content',color:'#b8e87e'}, amused:{label:'Amused',color:'#a8e06e'}, delighted:{label:'Delighted',color:'#98d85e'}, joyful:{label:'Joyful',color:'#88d04e'} } },
    love: { label: 'Love', color: '#e8e86e', children: { affectionate:{label:'Affectionate',color:'#e8e86e'}, longing:{label:'Longing',color:'#f0f07e'}, desire:{label:'Desire',color:'#e0e060'}, tenderness:{label:'Tenderness',color:'#d8d850'}, compassionate:{label:'Compassionate',color:'#e8e86e'}, caring:{label:'Caring',color:'#f0f07e'}, romantic:{label:'Romantic',color:'#e0e060'}, sentimental:{label:'Sentimental',color:'#d8d850'} } },
    surprise: { label: 'Surprise', color: '#7dd4d4', children: { stunned:{label:'Stunned',color:'#7dd4d4'}, confused:{label:'Confused',color:'#8ddce4'}, amazed:{label:'Amazed',color:'#6dc4c4'}, overcome:{label:'Overcome',color:'#7dd4d4'}, moved:{label:'Moved',color:'#8ddce4'}, astonished:{label:'Astonished',color:'#6dc4c4'}, speechless:{label:'Speechless',color:'#7dd4d4'}, astounded:{label:'Astounded',color:'#8ddce4'} } },
    sadness: { label: 'Sadness', color: '#a8c4e8', children: { disappointed:{label:'Disappointed',color:'#a8c4e8'}, shameful:{label:'Shameful',color:'#b8d4f8'}, neglected:{label:'Neglected',color:'#98b4d8'}, despair:{label:'Despair',color:'#88a4c8'}, lonely:{label:'Lonely',color:'#a8c4e8'}, isolated:{label:'Isolated',color:'#b8d4f8'}, guilty:{label:'Guilty',color:'#98b4d8'}, depressed:{label:'Depressed',color:'#88a4c8'} } },
    anger: { label: 'Anger', color: '#d88cd8', children: { irritable:{label:'Irritable',color:'#d88cd8'}, envy:{label:'Envy',color:'#e09ce8'}, disgust:{label:'Disgust',color:'#c87cc8'}, exasperated:{label:'Exasperated',color:'#d88cd8'}, annoyed:{label:'Annoyed',color:'#e09ce8'}, frustrated:{label:'Frustrated',color:'#c87cc8'}, jealous:{label:'Jealous',color:'#d88cd8'}, resentful:{label:'Resentful',color:'#e09ce8'} } },
    fear: { label: 'Fear', color: '#f4a8a8', children: { scared:{label:'Scared',color:'#f4a8a8'}, terrified:{label:'Terrified',color:'#fcb8b8'}, insecure:{label:'Insecure',color:'#ec9898'}, nervous:{label:'Nervous',color:'#e48888'}, horrified:{label:'Horrified',color:'#f4a8a8'}, anxious:{label:'Anxious',color:'#fcb8b8'}, worried:{label:'Worried',color:'#ec9898'}, inadequate:{label:'Inadequate',color:'#e48888'} } },
  };

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const STORAGE_KEY = 'mood-tracker-data';
  const PROFILE_KEY = 'mood-tracker-profile';
  const FALLBACK_POEMS = [{ id:'fallback-1', title:'Fallback Calm', author:'System', text:'A gentle fallback poem that keeps the app running.', moodTags:['calm','content'] }];

  // state
  let currentYear = new Date().getFullYear();
  let currentMonth = new Date().getMonth();
  let moodData = {};   // persisted map
  let poemsDB = [];
  let selectedDate = null;
  let viewMode = 'mosaic';

  // DOM cache
  const mainContent = document.getElementById('mainContent');
  const yearTitle = document.getElementById('yearTitle');
  const prevYearBtn = document.getElementById('prevYearBtn');
  const nextYearBtn = document.getElementById('nextYearBtn');
  const mosaicViewBtn = document.getElementById('mosaicViewBtn');
  const monthViewBtn = document.getElementById('monthViewBtn');

  // emotion modal
  const emotionModal = document.getElementById('emotionModal');
  const emotionModalTitle = document.getElementById('emotionModalTitle');
  const emotionModalClose = document.getElementById('emotionModalClose');
  const primaryEmotionGrid = document.getElementById('primaryEmotionGrid');
  const secondaryWrapper = document.getElementById('secondaryWrapper');
  const secondaryEmotionGrid = document.getElementById('secondaryEmotionGrid');
  const backToPrimary = document.getElementById('backToPrimary');

  // poem modal
  const poemModal = document.getElementById('poemModal');
  const poemBadge = document.getElementById('poemBadge');
  const poemTitle = document.getElementById('poemTitle');
  const poemAuthor = document.getElementById('poemAuthor');
  const poemText = document.getElementById('poemText');
  const editEntryBtn = document.getElementById('editEntryBtn');
  const deleteEntryBtn = document.getElementById('deleteEntryBtn');
  const closePoemBtn = document.getElementById('closePoemBtn');

  // new control: download button
  const downloadBtn = document.getElementById('downloadMosaicBtn');

  // utilities
  function formatDate(year, month, day) {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  }
  function getDaysInMonth(year, month){ return new Date(year, month + 1, 0).getDate(); }
  function getFirstDayOfMonth(year, month){ return new Date(year, month, 1).getDay(); }

  function loadFromStorage(){ try { const raw = localStorage.getItem(STORAGE_KEY); if(raw) moodData = JSON.parse(raw); } catch(e){ console.error('loadFromStorage', e); } }
  function saveToStorage(){ try { localStorage.setItem(STORAGE_KEY, JSON.stringify(moodData)); } catch(e){ console.error('saveToStorage', e); } }

  // poems DB
  function loadPoemsDB(){
    return fetch('poems.json', { cache: 'no-store' })
      .then(resp => { if(!resp.ok) throw new Error('HTTP ' + resp.status); return resp.json(); })
      .then(json => { if(!Array.isArray(json)) throw new Error('poems.json must be an array'); poemsDB = json; })
      .catch(err => { console.warn('Could not load poems.json — using fallback poems. Error:', err); poemsDB = FALLBACK_POEMS.slice(); });
  }

  function selectRandomPoemForMood(mood){
    if(!Array.isArray(poemsDB) || poemsDB.length === 0) return FALLBACK_POEMS[0];
    const tagsToMatch = [];
    if(mood.primaryEmotion) tagsToMatch.push(mood.primaryEmotion.toLowerCase());
    if(mood.emotion) tagsToMatch.push(mood.emotion.toLowerCase());
    const matches = poemsDB.filter(p => Array.isArray(p.moodTags) && p.moodTags.some(t => tagsToMatch.includes(String(t).toLowerCase())));
    const pool = matches.length > 0 ? matches : poemsDB;
    const idx = Math.floor(Math.random() * pool.length);
    return pool[idx];
  }

  // rendering
  function getCellColor(month, day, year = currentYear){
    const date = formatDate(year, month, day);
    return moodData[date]?.color || '#ffffff';
  }

  function renderMosaicView(){
    const container = document.createElement('div');
    container.className = 'mosaic-grid';
    for(let i=0;i<12;i++){ const h = document.createElement('div'); h.className='mosaic-header'; h.textContent = MONTHS[i].slice(0,3); container.appendChild(h); }
    for(let dayIdx=0; dayIdx<31; dayIdx++){
      for(let monthIdx=0; monthIdx<12; monthIdx++){
        const daysInMonth = getDaysInMonth(currentYear, monthIdx);
        const isValid = dayIdx + 1 <= daysInMonth;
        const cell = document.createElement('div');
        cell.className = 'mosaic-cell' + (isValid ? '' : ' invalid');
        if(isValid){
          const color = getCellColor(monthIdx, dayIdx+1);
          cell.style.backgroundColor = color;
          cell.addEventListener('click', () => handleCellClick(monthIdx, dayIdx+1));
        }
        container.appendChild(cell);
      }
    }
    mainContent.innerHTML = '';
    mainContent.appendChild(container);
  }

  function renderMonthView(){
    const wrapper = document.createElement('div'); wrapper.className='month-wrap';
    const card = document.createElement('div'); card.className='calendar card';
    const header = document.createElement('div'); header.className='calendar-header';
    const prevBtn = document.createElement('button'); prevBtn.className='btn'; prevBtn.textContent='← Previous'; prevBtn.addEventListener('click', () => { if(currentMonth === 0){ currentMonth = 11; currentYear--; } else currentMonth--; updateUI(); });
    const title = document.createElement('h2'); title.style.margin='0'; title.style.fontWeight='300'; title.textContent = `${MONTHS[currentMonth]} ${currentYear}`;
    const nextBtn = document.createElement('button'); nextBtn.className='btn'; nextBtn.textContent='Next →'; nextBtn.addEventListener('click', () => { if(currentMonth === 11){ currentMonth = 0; currentYear++; } else currentMonth++; updateUI(); });
    header.appendChild(prevBtn); header.appendChild(title); header.appendChild(nextBtn);

    const grid = document.createElement('div'); grid.className = 'calendar-grid';
    const weekLabel = document.createElement('div'); weekLabel.className = 'calendar-week'; weekLabel.textContent='Week'; grid.appendChild(weekLabel);
    ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].forEach(d => { const label = document.createElement('div'); label.className='calendar-week'; label.textContent=d; grid.appendChild(label); });

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const weeks = Math.ceil((daysInMonth + firstDay) / 7);

    for(let w=0; w<weeks; w++){
      const weekNum = document.createElement('div'); weekNum.className = 'calendar-week'; weekNum.textContent = `W${w+1}`; grid.appendChild(weekNum);
      for(let d=0; d<7; d++){
        const dayNumber = w*7 + d - firstDay + 1;
        const isValid = dayNumber > 0 && dayNumber <= daysInMonth;
        const cell = document.createElement('div'); cell.className = 'calendar-day' + (isValid ? '' : ' invalid');
        if(isValid){
          cell.textContent = dayNumber;
          cell.style.backgroundColor = getCellColor(currentMonth, dayNumber);
          cell.addEventListener('click', () => handleCellClick(currentMonth, dayNumber));
          cell.addEventListener('mouseenter', () => cell.style.borderColor = '#999');
          cell.addEventListener('mouseleave', () => cell.style.borderColor = '#e5e5e5');
        }
        grid.appendChild(cell);
      }
    }

    card.appendChild(header); card.appendChild(grid); wrapper.appendChild(card);
    mainContent.innerHTML=''; mainContent.appendChild(wrapper);
  }

  // handlers
  function handleCellClick(month, day, forceEdit = false){
    const date = formatDate(currentYear, month, day);
    const existing = moodData[date];

    if(existing && !forceEdit){
      let poem = null;
      if(existing.poemId) poem = poemsDB.find(p => p.id === existing.poemId) || null;
      if(!poem){
        poem = selectRandomPoemForMood(existing);
        existing.poemId = poem.id;
        moodData[date] = existing;
        saveToStorage();
      }
      showPoemPanel({ date, mood: existing, poem });
    } else {
      selectedDate = { date, month, day };
      openEmotionModal();
    }
  }

  function openEmotionModal(){ renderPrimaryGrid(); secondaryWrapper.classList.add('hidden'); primaryEmotionGrid.classList.remove('hidden'); emotionModalTitle.textContent = 'How are you feeling?'; emotionModal.classList.remove('hidden'); }
  function closeEmotionModal(){ emotionModal.classList.add('hidden'); selectedDate = null; }
  function renderPrimaryGrid(){ primaryEmotionGrid.innerHTML=''; Object.entries(EMOTION_WHEEL).forEach(([key,e]) => { const btn = document.createElement('button'); btn.className='emotion-btn'; btn.style.backgroundColor=e.color; btn.textContent=e.label; btn.addEventListener('click', () => renderSecondaryGrid(key)); primaryEmotionGrid.appendChild(btn); }); }
  function renderSecondaryGrid(primaryKey){ const primary = EMOTION_WHEEL[primaryKey]; emotionModalTitle.textContent='Choose a specific emotion'; primaryEmotionGrid.classList.add('hidden'); secondaryWrapper.classList.remove('hidden'); secondaryEmotionGrid.innerHTML=''; Object.entries(primary.children).forEach(([secKey,e]) => { const btn = document.createElement('button'); btn.className='emotion-btn'; btn.style.backgroundColor=e.color; btn.textContent=e.label; btn.addEventListener('click', () => saveEmotionSelection(primaryKey, secKey)); secondaryEmotionGrid.appendChild(btn); }); }

  function saveEmotionSelection(primaryKey, secondaryKey){
    if(!selectedDate) return;
    const emotionObj = EMOTION_WHEEL[primaryKey].children[secondaryKey];
    const moodRecord = { emotion: secondaryKey, primaryEmotion: primaryKey, color: emotionObj.color, poemId: null };
    const selectedPoem = selectRandomPoemForMood(moodRecord);
    moodRecord.poemId = selectedPoem?.id ?? null;
    moodData[selectedDate.date] = moodRecord;
    saveToStorage();
    closeEmotionModal();
    updateUI();
  }

  function showPoemPanel({ date, mood, poem }){
    const label = EMOTION_WHEEL[mood.primaryEmotion]?.children?.[mood.emotion]?.label || mood.emotion || 'Mood';
    poemBadge.textContent = label;
    poemBadge.style.backgroundColor = mood.color || '#eee';
    poemTitle.textContent = poem.title || 'Untitled';
    poemAuthor.textContent = poem.author ? `by ${poem.author}` : '';
    poemText.textContent = poem.text || '';

    editEntryBtn.onclick = () => { poemModal.classList.add('hidden'); const parts = date.split('-'); const month = parseInt(parts[1],10) - 1; const day = parseInt(parts[2],10); selectedDate = { date, month, day }; openEmotionModal(); };
    deleteEntryBtn.onclick = () => { delete moodData[date]; saveToStorage(); poemModal.classList.add('hidden'); updateUI(); };
    closePoemBtn.onclick = () => poemModal.classList.add('hidden');

    poemModal.classList.remove('hidden');
  }

  // UI wiring
  function updateUI(){ yearTitle.textContent = currentYear; if(viewMode === 'mosaic'){ renderMosaicView(); document.querySelectorAll('.mosaic-only').forEach(el => el.style.display=''); } else { renderMonthView(); document.querySelectorAll('.mosaic-only').forEach(el => el.style.display='none'); } }

  prevYearBtn.addEventListener('click', () => { currentYear--; updateUI(); });
  nextYearBtn.addEventListener('click', () => { currentYear++; updateUI(); });
  mosaicViewBtn.addEventListener('click', () => { viewMode='mosaic'; mosaicViewBtn.classList.add('active'); monthViewBtn.classList.remove('active'); updateUI(); });
  monthViewBtn.addEventListener('click', () => { viewMode='month'; monthViewBtn.classList.add('active'); mosaicViewBtn.classList.remove('active'); updateUI(); });

  emotionModalClose.addEventListener('click', () => closeEmotionModal());
  emotionModal.addEventListener('click', (e) => { if(e.target === emotionModal) closeEmotionModal(); });
  backToPrimary.addEventListener('click', () => { secondaryWrapper.classList.add('hidden'); primaryEmotionGrid.classList.remove('hidden'); emotionModalTitle.textContent='How are you feeling?'; });
  poemModal.addEventListener('click', (e) => { if(e.target === poemModal) poemModal.classList.add('hidden'); });

  // Download mosaic code (same as earlier)
  function downloadMosaicImage(targetWidth = 3840, targetHeight = 2160) {
    const cols = 12; const rows = 31;
    const cellW = Math.floor(targetWidth / cols); const cellH = Math.floor(targetHeight / rows);
    const cellSize = Math.min(cellW, cellH);
    const canvasW = cellSize * cols; const canvasH = cellSize * rows;
    const canvas = document.createElement('canvas'); canvas.width = canvasW; canvas.height = canvasH;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f5f5f5'; ctx.fillRect(0,0,canvasW,canvasH);

    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        const day = r + 1; const month = c;
        const daysInMonth = getDaysInMonth(currentYear, month); const isValid = day <= daysInMonth;
        const x = c * cellSize; const y = r * cellSize;
        if(isValid){
          const color = getCellColor(month, day, currentYear) || '#ffffff';
          ctx.fillStyle = color;
          const gap = Math.max(1, Math.round(cellSize * 0.03));
          ctx.fillRect(x + gap, y + gap, cellSize - gap*2, cellSize - gap*2);
        } else {
          ctx.fillStyle = '#fafafa'; ctx.fillRect(x, y, cellSize, cellSize);
        }
      }
    }

    // month labels
    ctx.fillStyle = '#333';
    ctx.font = `${Math.max(12, Math.round(cellSize * 0.14))}px sans-serif`;
    ctx.textAlign = 'center';
    for(let c=0;c<cols;c++){
      const label = MONTHS[c].slice(0,3); const x = c * cellSize + cellSize/2;
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(c*cellSize, 2, cellSize, Math.round(cellSize*0.18));
      ctx.fillStyle = '#333'; ctx.fillText(label, x, Math.round(cellSize*0.14 + 8));
    }

    canvas.toBlob(function(blob){
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `mosaic-${currentYear}.png`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href);
    }, 'image/png');
  }

  if(downloadBtn){
    downloadBtn.addEventListener('click', () => {
      downloadMosaicImage(3840, 2160);
    });
  }

  // keep profile helpers (profile page uses these)
  function loadProfile(){
    try{ const raw = localStorage.getItem(PROFILE_KEY); return raw ? JSON.parse(raw) : { name:'', avatar:'' }; } catch(e){ return { name:'', avatar:'' }; }
  }
  function saveProfile(profile){ try{ localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch(e){ console.warn('failed to save profile', e); } }

  // startup
  function startApp(){ loadPoemsDB().finally(() => { loadFromStorage(); updateUI(); }); }

  window.__moodTracker = { getState: () => ({ currentYear, currentMonth, moodData, poemsDB, profile: loadProfile() }), clearAll: () => { moodData = {}; saveToStorage(); updateUI(); } };

  startApp();
})();
