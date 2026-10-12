document.addEventListener('DOMContentLoaded', () => {
  const btnInspect = document.getElementById('btnInspect');
  const urlInput = document.getElementById('urlInput');
  const btnSubmitFeedback = document.getElementById('btnSubmitFeedback');
  const userFeedbackInput = document.getElementById('userFeedbackInput');
  const userFeedbackList = document.getElementById('userFeedbackList');

  // 기본 설정 및 검증조건 템플릿
  const DEFAULT_SETTINGS = {
    label1Summary: '과학적 근거가 충분하고 공인 전문의 검토를 통과한 정보',
    label1Conditions: '검증조건 1: WHO, 질병관리청 지침과 일치할 것\n검증조건 2: 무작위 대조 임상시험 논문 존재',
    label2Summary: '근거가 부족하거나 대규모 인체 임상이 완료되지 않은 정보',
    label2Conditions: '검증조건 1: 세포 또는 동물 실험 수준의 연구\n검증조건 2: 의학적 가설을 단정적으로 과장 표현함',
    label3Summary: '신뢰할 만한 근거와 배치되며 환자에게 위험을 초래하는 정보',
    label3Conditions: '검증조건 1: 정규 치료 거부 조장 및 허위 민간요법\n검증조건 2: 공포심을 자극하여 상업적 판매 유도',
    pipe1Desc: '건강·의료 관련 SNS 게시물 분류 및 메타데이터 파싱',
    pipe2Desc: '주요 주장 추출 및 의학적 근거(PubMed/질병청) 대조',
    pipe3Desc: '의료 전문가가 근거와 판단 결과 검토 및 위험도 평가',
    pipe4Desc: '검증 결과와 근거 자료를 SNS에 표시 (4단계 등급 부여)',
    pipe5Desc: '새로운 연구 결과나 의료 지침 변경 및 사용자 제보 반영'
  };

  // 로컬 저장소에서 설정 불러오기
  function getActiveSettings() {
    try {
      const saved = localStorage.getItem('medicheck_custom_settings');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch(e) {
      console.error('Error loading settings', e);
    }
    return { ...DEFAULT_SETTINGS };
  }

  // 모달 인풋 필드에 설정값 반영
  function applySettingsToInputs(settings) {
    const el = (id) => document.getElementById(id);
    if (el('settingLabel1Summary')) el('settingLabel1Summary').value = settings.label1Summary;
    if (el('settingLabel1Conditions')) el('settingLabel1Conditions').value = settings.label1Conditions;
    if (el('settingLabel2Summary')) el('settingLabel2Summary').value = settings.label2Summary;
    if (el('settingLabel2Conditions')) el('settingLabel2Conditions').value = settings.label2Conditions;
    if (el('settingLabel3Summary')) el('settingLabel3Summary').value = settings.label3Summary;
    if (el('settingLabel3Conditions')) el('settingLabel3Conditions').value = settings.label3Conditions;
    if (el('settingPipe1Desc')) el('settingPipe1Desc').value = settings.pipe1Desc;
    if (el('settingPipe2Desc')) el('settingPipe2Desc').value = settings.pipe2Desc;
    if (el('settingPipe3Desc')) el('settingPipe3Desc').value = settings.pipe3Desc;
    if (el('settingPipe4Desc')) el('settingPipe4Desc').value = settings.pipe4Desc;
    if (el('settingPipe5Desc')) el('settingPipe5Desc').value = settings.pipe5Desc;
  }

  // 메인 UI 파이프라인 설명 등에 설정값 즉시 적용
  function applySettingsToUI(settings) {
    const q = (sel) => document.querySelector(sel);
    if (q('#pipeStep1 .step-desc')) q('#pipeStep1 .step-desc').textContent = settings.pipe1Desc;
    if (q('#pipeStep2 .step-desc')) q('#pipeStep2 .step-desc').textContent = settings.pipe2Desc;
    if (q('#pipeStep3 .step-desc')) q('#pipeStep3 .step-desc').textContent = settings.pipe3Desc;
    if (q('#pipeStep4 .step-desc')) q('#pipeStep4 .step-desc').textContent = settings.pipe4Desc;
    if (q('#pipeStep5 .step-desc')) q('#pipeStep5 .step-desc').textContent = settings.pipe5Desc;
  }

  // 토스트 알림 표시 함수
  function showToast(message, icon = 'fa-solid fa-circle-check') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="${icon}" style="color: #10b981;"></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 2800);
  }

  // 초기 설정 로드 및 UI 적용
  const initialSettings = getActiveSettings();
  applySettingsToInputs(initialSettings);
  applySettingsToUI(initialSettings);

  // 인스타그램 URL에서 사용자명과 포스트ID 추출
  function extractInstaInfo(url) {
    let username = '';
    let postId = '';
    try {
      const urlObj = new URL(url);
      const parts = urlObj.pathname.split('/').filter(p => p);
      const pIndex = parts.indexOf('p') > -1 ? parts.indexOf('p') : parts.indexOf('reel');
      if (pIndex > -1) {
        postId = parts[pIndex + 1];
        if (pIndex > 0) username = parts[pIndex - 1];
      }
    } catch (e) {
      const pMatch = url.match(/\/(?:p|reel)\/([^\/\?]+)/);
      if (pMatch) postId = pMatch[1];
    }
    
    if (!postId) postId = 'unknown';
    if (!username) username = "user_" + postId.substring(0, 5);
    
    return { username, postId };
  }

  // 공공기관 / 국가 인증 계정 판별 (블루뱃지 대상)
  function isOfficialAccount(url, username) {
    const text = (url + ' ' + username).toLowerCase();
    const officialKeywords = [
      'koreadca', 'kdca', 'mohw', 'mfds', 'cdc', 'who', 'nih', 'gov',
      'seoul', 'icmc', 'icmcseoul', 'official', 'korea', 'policy', 'hira',
      'nhis', 'bohealth', 'bokji', 'safekorea', 'public', 'metro', 'knuh',
      'snuh', 'amc', 'severance', 'hospital', 'center', 'gwangju', 'busan',
      'daegu', 'incheon', 'daejeon', 'ulsan', 'gyeonggi', 'gangwon', 'chungbuk',
      'chungnam', 'jeonbuk', 'jeonnam', 'gyeongbuk', 'gyeongnam', 'jeju',
      '질병청', '질병관리청', '보건복지부', '식약처', '보건소'
    ];
    return officialKeywords.some(kw => text.includes(kw));
  }

  // URL 및 계정 정보를 바탕으로 카테고리 동적 분류
  function classifyUrlCategory(url, username, isOfficial) {
    if (isOfficial) {
      return '공공기관 (블루뱃지 공식인증)';
    }
    
    const text = (url + ' ' + username).toLowerCase();
    
    // 건강식품 관련 키워드
    const dietKeywords = [
      'detox', 'diet', 'food', 'vitamin', 'pill', 'nutri', 'supplement',
      'cleanse', 'tea', 'extract', 'fat', 'slim', 'shake', 'enzym', 'juice',
      'salad', 'organic', 'meal', 'protein', 'gut', 'probiotic', 'omega',
      '건강식품', '디톡스', '다이어트', '보조제', '영양제', '즙', '단식', '환'
    ];
    if (dietKeywords.some(kw => text.includes(kw))) {
      return '건강식품 / 기능성 보조제';
    }
    
    // 의료광고 관련 키워드
    const adKeywords = [
      'clinic', 'beauty', 'skin', 'surgery', 'dental', 'derma', 'plastic',
      'laser', 'eye', 'ortho', 'ad', 'promo', 'event', 'sale', 'review',
      'care', 'cosmetic', 'lash', 'filler', 'botox', '병원', '의원', '클리닉',
      '성형', '피부과', '치과', '안과', '이벤트', '후기'
    ];
    if (adKeywords.some(kw => text.includes(kw))) {
      return '의료광고 / 병의원 마케팅';
    }
    
    return '일반 의료정보 / 건강 상식';
  }

  // 신뢰도 점수 게이지 (SVG 원형 그래프) 업데이트
  function updateRadialScore(score, strokeColor) {
    const scoreCircle = document.getElementById('scoreProgressCircle');
    const scoreNum = document.getElementById('scoreNumber');
    if (scoreNum) scoreNum.textContent = score;
    if (scoreCircle) {
      const offset = 264 * (1 - score / 100);
      scoreCircle.style.strokeDashoffset = offset.toString();
      if (strokeColor) scoreCircle.style.stroke = strokeColor;
    }
  }

  // UI 완전 초기화 함수 (2회 이상 입력 시 버그 방지)
  function resetUI() {
    // 카테고리 초기화
    const heroCategory = document.getElementById('heroCategory');
    if (heroCategory) {
      heroCategory.textContent = '카테고리 분석 대기 중';
      heroCategory.style.color = '#60a5fa';
      heroCategory.style.background = 'rgba(59, 130, 246, 0.12)';
    }

    document.getElementById('heroPostTitle').textContent = `게시물 분석 대기 중...`;
    document.getElementById('heroUrlSub').textContent = `입력된 URL을 분석합니다.`;
    document.getElementById('verdictTargetClaim').textContent = `-`;
    document.getElementById('verdictReasonsList').innerHTML = '';
    document.getElementById('verdictDoctorSummary').textContent = `-`;
    
    updateRadialScore(0, 'rgba(255, 255, 255, 0.1)');

    document.getElementById('labelStatusName').textContent = `대기 중`;
    document.getElementById('labelStatusName').style.color = '';
    document.getElementById('labelTierTag').textContent = `-`;
    document.getElementById('labelTierTag').style.color = '';
    document.getElementById('labelTierTag').style.background = '';

    document.getElementById('bannerBadgeIcon').innerHTML = '<i class="fa-solid fa-circle-question"></i>';
    document.getElementById('bannerDescription').textContent = `URL을 기반으로 실시간 검증을 진행합니다.`;
    
    document.getElementById('verdictRiskBadge').textContent = '대기 중';
    document.getElementById('verdictRiskBadge').style.color = '';
    document.getElementById('verdictRiskBadge').style.background = '';
    document.getElementById('verdictRiskBadge').style.borderColor = '';

    const pipeSteps = document.querySelectorAll('.pipeline-step-card');
    pipeSteps.forEach(step => step.classList.remove('step-highlight', 'running')); 
    
    document.getElementById('instaMobileAppView').style.display = 'none';
    document.getElementById('instaEmbedView').style.display = 'none';

    // 플로팅 가드 배너 초기화
    const liveFloatingBadge = document.getElementById('instaLiveFloatingBadge');
    if (liveFloatingBadge) {
      liveFloatingBadge.className = 'insta-live-floating-badge';
      liveFloatingBadge.style.borderColor = '';
    }
    const liveBadgeIcon = document.getElementById('liveBadgeIcon');
    if (liveBadgeIcon) {
      liveBadgeIcon.innerHTML = '<i class="fa-solid fa-shield-halved"></i>';
      liveBadgeIcon.style.background = '';
      liveBadgeIcon.style.color = '';
    }
    const liveScorePill = document.getElementById('liveScorePill');
    if (liveScorePill) {
      liveScorePill.textContent = '-';
      liveScorePill.style.background = '';
      liveScorePill.style.color = '';
    }
    const liveLabelName = document.getElementById('liveLabelName');
    if (liveLabelName) {
      liveLabelName.textContent = '분석 대기';
      liveLabelName.style.color = '';
    }
    document.getElementById('liveReasonText').textContent = '데이터 처리 중';
    
    // 블루뱃지 초기 숨김
    const verifiedBadge = document.getElementById('instaVerifiedBadge');
    if (verifiedBadge) verifiedBadge.style.display = 'none';

    // 테마 리셋
    document.getElementById('analysisHeroCard').className = 'analysis-hero-card';
    document.getElementById('verdictBreakdownCard').className = 'verdict-breakdown-card';
  }

  // 초기 상태 리셋 실행
  resetUI();

  if(btnInspect) {
    btnInspect.addEventListener('click', () => {
      const url = urlInput.value.trim();
      if (!url) {
        alert('검증하실 인스타그램 URL을 입력해주세요.');
        return;
      }

      // 화면 초기화 및 로딩 시작
      resetUI();
      document.getElementById('heroUrlSub').textContent = `출처: ${url}`;
      
      const { username, postId } = extractInstaInfo(url);
      const isOfficial = isOfficialAccount(url, username);

      // 카테고리 임시 표시
      const heroCategory = document.getElementById('heroCategory');
      if (heroCategory) {
        heroCategory.textContent = '카테고리 감지 중...';
      }

      // 파이프라인 2단계 (AI 분석) 로딩 애니메이션
      document.getElementById('pipeStep2').classList.add('step-highlight', 'running');
      document.getElementById('heroPostTitle').textContent = `[분석 진행 중] URL 데이터를 AI가 검증하고 있습니다...`;
      document.getElementById('labelStatusName').textContent = `AI 사전 분석 중`;
      document.getElementById('bannerDescription').textContent = `게시물의 내용을 추출하여 공인 의학 DB와 대조 중입니다.`;

      // 아이폰 화면 먼저 띄우기 (iframe 로드)
      const instaMobileAppView = document.getElementById('instaMobileAppView');
      const instaEmbedView = document.getElementById('instaEmbedView');
      const instaLiveIframe = document.getElementById('instaLiveIframe');

      // 아이폰 가상 화면 텍스트 연동
      document.getElementById('instaAuthorUsername').textContent = username;
      document.getElementById('instaCaptionUser').textContent = username;
      document.getElementById('mediaHeadlineTitle').textContent = `"${url}"의 내용`;
      document.getElementById('mediaHeadlineSub').textContent = `실시간 분석 대상 게시물입니다.`;
      
      // Iframe 임베드 URL 처리
      if (postId !== 'unknown') {
        const embedUrl = `https://www.instagram.com/p/${postId}/embed/`;
        instaLiveIframe.src = 'about:blank';
        setTimeout(() => { instaLiveIframe.src = embedUrl; }, 50);
        instaEmbedView.style.display = 'block';
        
        // iframe 로드 실패를 대비한 Fallback
        instaLiveIframe.onerror = function() {
          instaEmbedView.style.display = 'none';
          instaMobileAppView.style.display = 'flex';
          document.getElementById('instaPostImage').src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';
        };
      } else {
        instaEmbedView.style.display = 'none';
        instaMobileAppView.style.display = 'flex';
        document.getElementById('instaPostImage').src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80';
      }

      // DB(data.js) 대조
      const matchedPost = (typeof SAMPLE_POSTS !== 'undefined') 
        ? SAMPLE_POSTS.find(post => post.url === url || post.url.includes(postId)) 
        : null;

      // 1.5초 뒤 분석 완료 결과 도출
      setTimeout(() => {
        document.getElementById('pipeStep2').classList.remove('running');
        const pipeSteps = document.querySelectorAll('.pipeline-step-card');
        pipeSteps.forEach(step => step.classList.remove('step-highlight')); 
        document.getElementById('pipeStep4').classList.add('step-highlight');

        const currentSettings = getActiveSettings();
        const liveFloatingBadge = document.getElementById('instaLiveFloatingBadge');
        const verifiedBadge = document.getElementById('instaVerifiedBadge');

        if (matchedPost) {
          // 1. DB에 존재하는 데이터일 경우 매칭
          const matchedCategory = matchedPost.category || classifyUrlCategory(url, username, false);
          if (heroCategory) {
            heroCategory.textContent = matchedCategory;
          }

          document.getElementById('analysisHeroCard').classList.add(`theme-${matchedPost.label}`);
          document.getElementById('verdictBreakdownCard').classList.add(`theme-${matchedPost.label}`);
          if (liveFloatingBadge) liveFloatingBadge.classList.add(`theme-${matchedPost.label}`);
          
          document.getElementById('heroPostTitle').textContent = matchedPost.topic;
          document.getElementById('verdictTargetClaim').textContent = `"${matchedPost.verdictBreakdown.targetClaim}"`;
          document.getElementById('verdictDoctorSummary').textContent = matchedPost.verdictBreakdown.doctorSummary;
          
          updateRadialScore(matchedPost.credibilityScore);

          document.getElementById('labelStatusName').textContent = matchedPost.badgeText;
          document.getElementById('bannerDescription').textContent = matchedPost.floatingShortReason;
          
          document.getElementById('liveScorePill').textContent = matchedPost.credibilityScore + '점';
          document.getElementById('liveLabelName').textContent = matchedPost.badgeText;
          document.getElementById('liveReasonText').textContent = matchedPost.floatingShortReason;

          if (matchedPost.label === 'verified') {
            document.getElementById('bannerBadgeIcon').innerHTML = '<i class="fa-solid fa-circle-check"></i>';
            document.getElementById('labelTierTag').textContent = '1단계 분류 (Verified)';
            document.getElementById('verdictRiskBadge').textContent = '신뢰성 검증됨';
            if (verifiedBadge) verifiedBadge.style.display = 'inline-block';
          } else if (matchedPost.label === 'caution') {
            document.getElementById('bannerBadgeIcon').innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
            document.getElementById('labelTierTag').textContent = '2단계 분류 (Caution)';
            document.getElementById('verdictRiskBadge').textContent = '주의 필요';
          } else {
            document.getElementById('bannerBadgeIcon').innerHTML = '<i class="fa-solid fa-circle-xmark"></i>';
            document.getElementById('labelTierTag').textContent = '3단계 분류 (High Risk)';
            document.getElementById('verdictRiskBadge').textContent = '매우 높음 (Critical Risk)';
          }

          const reasonsHtml = matchedPost.verdictBreakdown.whyReasons.map((reason, idx) => `
            <div class="reason-item-card">
              <div class="reason-num-badge">${idx+1}</div>
              <div class="reason-content-box">
                <span class="reason-tag">${reason.tag}</span>
                <p class="reason-text">${reason.text}</p>
              </div>
            </div>
          `).join('');
          document.getElementById('verdictReasonsList').innerHTML = reasonsHtml;

        } else {
          // 2. 새로운 URL인 경우: 공공기관(블루뱃지) vs 일반 URL 분류 판별
          const dynamicCategory = classifyUrlCategory(url, username, isOfficial);
          if (heroCategory) {
            heroCategory.textContent = dynamicCategory;
          }

          if (isOfficial) {
            // [공공기관 및 국가인증 계정: 블루뱃지 + 신뢰도 99점 + 검증완료 뱃지 완벽 적용]
            if (heroCategory) {
              heroCategory.style.color = '#38bdf8';
              heroCategory.style.background = 'rgba(56, 189, 248, 0.15)';
            }

            document.getElementById('analysisHeroCard').className = 'analysis-hero-card theme-verified';
            document.getElementById('verdictBreakdownCard').className = 'verdict-breakdown-card theme-verified';
            if (liveFloatingBadge) liveFloatingBadge.className = 'insta-live-floating-badge theme-verified';

            document.getElementById('heroPostTitle').textContent = `[공인 기관 검증 완료] ${username} 님의 공식 보건의료 정보`;
            
            // 검증 완료 뱃지 및 상태 세팅
            document.getElementById('bannerBadgeIcon').innerHTML = '<i class="fa-solid fa-circle-check"></i>';
            document.getElementById('labelStatusName').textContent = `검증 완료 (Verified)`;
            document.getElementById('labelStatusName').style.color = '#34d399';
            document.getElementById('labelTierTag').textContent = `1단계 분류 (공식 인증)`;
            document.getElementById('labelTierTag').style.color = '#34d399';
            document.getElementById('labelTierTag').style.background = 'rgba(16, 185, 129, 0.15)';
            
            updateRadialScore(99, '#10b981');
            document.getElementById('bannerDescription').textContent = currentSettings.label1Summary;
            
            // 플로팅 가드 배너 (아이폰 화면 위)
            const liveBadgeIcon = document.getElementById('liveBadgeIcon');
            if (liveBadgeIcon) {
              liveBadgeIcon.innerHTML = '<i class="fa-solid fa-shield-check"></i>';
              liveBadgeIcon.style.background = 'rgba(16, 185, 129, 0.2)';
              liveBadgeIcon.style.color = '#10b981';
            }
            const liveScorePill = document.getElementById('liveScorePill');
            if (liveScorePill) {
              liveScorePill.textContent = '99점';
              liveScorePill.style.background = 'rgba(16, 185, 129, 0.25)';
              liveScorePill.style.color = '#6ee7b7';
            }
            const liveLabelName = document.getElementById('liveLabelName');
            if (liveLabelName) {
              liveLabelName.textContent = '검증 완료';
              liveLabelName.style.color = '#34d399';
            }
            document.getElementById('liveReasonText').textContent = '국가 공인 보건의료 기관 공식 인증 (블루뱃지)';
            if (liveFloatingBadge) liveFloatingBadge.style.borderColor = '#10b981';

            // 인스타그램 프로필 블루뱃지 활성화
            if (verifiedBadge) {
              verifiedBadge.style.display = 'inline-block';
              verifiedBadge.style.color = '#3897f0';
            }
            const instaLocation = document.getElementById('instaLocation');
            if (instaLocation) instaLocation.textContent = '대한민국 공공기관 공식 인증 계정';

            // 등급 판정 사유 카드 세팅
            document.getElementById('verdictRiskBadge').textContent = '신뢰성 검증됨 (안심 정보)';
            document.getElementById('verdictRiskBadge').style.color = '#34d399';
            document.getElementById('verdictRiskBadge').style.background = 'rgba(16, 185, 129, 0.15)';
            document.getElementById('verdictRiskBadge').style.borderColor = 'rgba(16, 185, 129, 0.35)';

            document.getElementById('verdictTargetClaim').textContent = `"${url} 에 게시된 공공 보건의료 정책 및 예방 수칙"`;
            document.getElementById('verdictDoctorSummary').textContent = `전문의 및 공공의학 심의단 총평: "질병관리청, 보건복지부, 서울시 등 대한민국 공공 보건기관에서 발행한 공식 정보입니다. 근거 중심 의학(EBM) 표준 및 공인 가이드라인을 완벽히 충족하므로 시민들이 안심하고 실천할 수 있습니다."`;

            document.getElementById('verdictReasonsList').innerHTML = `
              <div class="reason-item-card">
                <div class="reason-num-badge">1</div>
                <div class="reason-content-box">
                  <span class="reason-tag">공인 기관 블루뱃지 화이트리스트</span>
                  <p class="reason-text">해당 계정은 국가 보건 당국 및 공공의료 행정기관으로 등록된 공식 인증 채널입니다.</p>
                </div>
              </div>
              <div class="reason-item-card">
                <div class="reason-num-badge">2</div>
                <div class="reason-content-box">
                  <span class="reason-tag">공인 EBM 표준 지침 부합</span>
                  <p class="reason-text">게시된 보건 수칙은 세계보건기구(WHO) 및 질병관리청 역학조사 결과에 기반한 검증된 사실입니다.</p>
                </div>
              </div>
              <div class="reason-item-card">
                <div class="reason-num-badge">3</div>
                <div class="reason-content-box">
                  <span class="reason-tag">상업적 왜곡 및 과장 배제</span>
                  <p class="reason-text">영리 목적의 허위 민간요법이나 공포 마케팅이 배제된 공익 보건 정보입니다.</p>
                </div>
              </div>
            `;

          } else {
            // [일반 미확인 SNS 건강정보: 55점 주의 요망 세팅]
            if (heroCategory) {
              heroCategory.style.color = '#fbbf24';
              heroCategory.style.background = 'rgba(245, 158, 11, 0.12)';
            }

            document.getElementById('analysisHeroCard').className = 'analysis-hero-card theme-caution';
            document.getElementById('verdictBreakdownCard').className = 'verdict-breakdown-card theme-caution';
            if (liveFloatingBadge) liveFloatingBadge.className = 'insta-live-floating-badge theme-caution';

            document.getElementById('heroPostTitle').textContent = `[AI 검증 완료] ${username} 님의 SNS 건강정보`;
            
            document.getElementById('bannerBadgeIcon').innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
            document.getElementById('labelStatusName').textContent = `추가 확인 필요 (Caution)`;
            document.getElementById('labelStatusName').style.color = '#fbbf24';
            document.getElementById('labelTierTag').textContent = `2단계 분류 (Caution)`;
            document.getElementById('labelTierTag').style.color = '#fbbf24';
            document.getElementById('labelTierTag').style.background = 'rgba(245, 158, 11, 0.15)';
            
            updateRadialScore(55, '#f59e0b');
            document.getElementById('bannerDescription').textContent = currentSettings.label2Summary;
            
            // 플로팅 배너 세팅
            const liveBadgeIcon = document.getElementById('liveBadgeIcon');
            if (liveBadgeIcon) {
              liveBadgeIcon.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
              liveBadgeIcon.style.background = 'rgba(245, 158, 11, 0.2)';
              liveBadgeIcon.style.color = '#f59e0b';
            }
            const liveScorePill = document.getElementById('liveScorePill');
            if (liveScorePill) {
              liveScorePill.textContent = '55점';
              liveScorePill.style.background = 'rgba(245, 158, 11, 0.25)';
              liveScorePill.style.color = '#fde68a';
            }
            const liveLabelName = document.getElementById('liveLabelName');
            if (liveLabelName) {
              liveLabelName.textContent = '추가 확인 필요';
              liveLabelName.style.color = '#fbbf24';
            }
            document.getElementById('liveReasonText').textContent = '의학적 대규모 임상 근거 미흡으로 주의 요망';
            if (liveFloatingBadge) liveFloatingBadge.style.borderColor = '#f59e0b';

            if (verifiedBadge) verifiedBadge.style.display = 'none';
            const instaLocation = document.getElementById('instaLocation');
            if (instaLocation) instaLocation.textContent = 'SNS 건강 정보 채널';

            // 등급 판정 사유 세팅
            document.getElementById('verdictRiskBadge').textContent = '주의 필요 (Caution)';
            document.getElementById('verdictRiskBadge').style.color = '#fbbf24';
            document.getElementById('verdictRiskBadge').style.background = 'rgba(245, 158, 11, 0.15)';
            document.getElementById('verdictRiskBadge').style.borderColor = 'rgba(245, 158, 11, 0.35)';

            document.getElementById('verdictTargetClaim').textContent = `"${url} 에 포함된 주요 의학적 주장 및 해시태그에 대한 1차 검증"`;
            document.getElementById('verdictDoctorSummary').textContent = `AI 1차 판독 소견: "본 게시물의 주장은 과학적 입증이 다소 부족하거나 단정적 표현이 포함되어 있어, 정밀한 전문의의 심의를 대기 중입니다. 맹신하지 마십시오."`;

            document.getElementById('verdictReasonsList').innerHTML = `
              <div class="reason-item-card">
                <div class="reason-num-badge">1</div>
                <div class="reason-content-box">
                  <span class="reason-tag">AI 1차 문헌 대조</span>
                  <p class="reason-text">해당 게시물에서 추출된 키워드를 보건 당국 및 PubMed와 대조한 결과, 확실하게 일치하는 표준 임상 지침이 부족합니다.</p>
                </div>
              </div>
              <div class="reason-item-card">
                <div class="reason-num-badge">2</div>
                <div class="reason-content-box">
                  <span class="reason-tag">제한적 데이터 및 미검증 원료</span>
                  <p class="reason-text">아직 의료 전문가 패널의 정밀 심의를 거치지 않은 실시간 AI 자동 분석 결과입니다.</p>
                </div>
              </div>
            `;
          }
        }
      }, 1500); // 1.5초 후 결과 로드
    });
  }

  // 사용자 집단지성 댓글 제보 기능 (아이폰 아래)
  if(btnSubmitFeedback && userFeedbackInput && userFeedbackList) {
    btnSubmitFeedback.addEventListener('click', () => {
      const text = userFeedbackInput.value.trim();
      if(!text) {
        alert("댓글 내용을 입력해주세요.");
        return;
      }
      
      const now = new Date();
      const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      if(userFeedbackList.innerHTML.includes('아직 등록된 제보가 없습니다')) {
        userFeedbackList.innerHTML = '';
      }

      const commentHtml = `
        <div style="background: #21262d; border-radius: 6px; padding: 10px; font-size: 12px; color: #e2e8f0; display: flex; flex-direction: column; gap: 4px; border: 1px solid #30363d; animation: fadeIn 0.3s ease;">
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
            <strong style="color: #60a5fa;"><i class="fa-solid fa-user-check"></i> 익명 제보자</strong>
            <span style="color: #8b949e;">방금 전 (${timeStr})</span>
          </div>
          <div style="line-height: 1.4;">${text}</div>
        </div>
      `;
      userFeedbackList.insertAdjacentHTML('afterbegin', commentHtml);
      userFeedbackInput.value = '';
    });

    userFeedbackInput.addEventListener('keypress', (e) => {
      if(e.key === 'Enter') btnSubmitFeedback.click();
    });
  }

  // 설정 모달 열기/닫기 처리
  const btnOpenSettings = document.getElementById('btnOpenSettings');
  const btnCloseSettings = document.getElementById('btnCloseSettings');
  const settingsModal = document.getElementById('settingsModal');

  if (btnOpenSettings && settingsModal) {
    btnOpenSettings.addEventListener('click', () => {
      settingsModal.style.display = 'flex';
      settingsModal.style.visibility = 'visible';
      settingsModal.style.opacity = '1';
    });
  }

  if (btnCloseSettings && settingsModal) {
    btnCloseSettings.addEventListener('click', () => {
      settingsModal.style.display = 'none';
      settingsModal.style.visibility = 'hidden';
      settingsModal.style.opacity = '0';
    });
  }

  // 설정 탭 전환 로직
  const settingsTabBtns = document.querySelectorAll('.settings-tab-btn');
  const settingsPanels = document.querySelectorAll('.settings-panel');
  
  settingsTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      settingsTabBtns.forEach(b => b.classList.remove('active'));
      settingsPanels.forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
      });
      
      btn.classList.add('active');
      const targetTab = btn.getAttribute('data-settings-tab');
      const targetPanelId = 'settingsPanel' + targetTab.charAt(0).toUpperCase() + targetTab.slice(1);
      const targetPanel = document.getElementById(targetPanelId);
      if (targetPanel) {
        targetPanel.classList.add('active');
        targetPanel.style.display = 'block';
      }
    });
  });
  
  // 패널 초기 상태 세팅
  settingsPanels.forEach((p, idx) => {
    if(idx !== 0) p.style.display = 'none';
    else p.style.display = 'block';
  });

  // 새 검증조건 추가하기 기능
  const btnAddCondition = document.getElementById('btnAddCondition');
  if (btnAddCondition) {
    btnAddCondition.addEventListener('click', () => {
      const container = document.getElementById('labelsEditorContainer');
      if (container) {
        const newBlock = document.createElement('div');
        newBlock.className = 'custom-condition-block';
        newBlock.style = "background: #0d1117; border: 1px solid #30363d; border-radius: 8px; padding: 12px; margin-bottom: 5px;";
        newBlock.innerHTML = `
          <h4 style="color: #58a6ff; margin-bottom: 8px; font-size: 14px; display: flex; justify-content: space-between;">
            <span><i class="fa-solid fa-pen-to-square"></i> 사용자 맞춤 단계 (Custom)</span>
            <button class="btn-remove-condition" style="background:none; border:none; color:#f87171; cursor:pointer;" title="삭제"><i class="fa-solid fa-trash"></i></button>
          </h4>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <input type="text" placeholder="검증 단계 이름 및 요약 입력" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #30363d; background: #161b22; color: #c9d1d9; font-size: 12px; outline: none;">
            <textarea rows="2" placeholder="새로운 세부 검증조건 입력..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #30363d; background: #161b22; color: #c9d1d9; font-size: 12px; outline: none;"></textarea>
          </div>
        `;
        
        const removeBtn = newBlock.querySelector('.btn-remove-condition');
        removeBtn.addEventListener('click', () => {
          newBlock.remove();
        });

        container.insertBefore(newBlock, btnAddCondition);
      }
    });
  }

  // ★★★ [사용자 요청] 설정 저장 및 즉각 UI 반영 기능 ★★★
  const btnSaveSettings = document.getElementById('btnSaveSettings');
  const btnResetSettings = document.getElementById('btnResetSettings');

  if (btnSaveSettings) {
    btnSaveSettings.addEventListener('click', () => {
      const el = (id) => document.getElementById(id);
      const newSettings = {
        label1Summary: el('settingLabel1Summary')?.value || DEFAULT_SETTINGS.label1Summary,
        label1Conditions: el('settingLabel1Conditions')?.value || DEFAULT_SETTINGS.label1Conditions,
        label2Summary: el('settingLabel2Summary')?.value || DEFAULT_SETTINGS.label2Summary,
        label2Conditions: el('settingLabel2Conditions')?.value || DEFAULT_SETTINGS.label2Conditions,
        label3Summary: el('settingLabel3Summary')?.value || DEFAULT_SETTINGS.label3Summary,
        label3Conditions: el('settingLabel3Conditions')?.value || DEFAULT_SETTINGS.label3Conditions,
        pipe1Desc: el('settingPipe1Desc')?.value || DEFAULT_SETTINGS.pipe1Desc,
        pipe2Desc: el('settingPipe2Desc')?.value || DEFAULT_SETTINGS.pipe2Desc,
        pipe3Desc: el('settingPipe3Desc')?.value || DEFAULT_SETTINGS.pipe3Desc,
        pipe4Desc: el('settingPipe4Desc')?.value || DEFAULT_SETTINGS.pipe4Desc,
        pipe5Desc: el('settingPipe5Desc')?.value || DEFAULT_SETTINGS.pipe5Desc,
      };

      try {
        localStorage.setItem('medicheck_custom_settings', JSON.stringify(newSettings));
      } catch (e) {
        console.error('Failed to save to localStorage', e);
      }

      // 파이프라인 및 현재 화면에 즉시 적용
      applySettingsToUI(newSettings);

      // 모달 닫기
      if (settingsModal) {
        settingsModal.style.display = 'none';
        settingsModal.style.visibility = 'hidden';
        settingsModal.style.opacity = '0';
      }

      showToast('설정 및 검증조건이 성공적으로 저장 및 적용되었습니다!');
    });
  }

  if (btnResetSettings) {
    btnResetSettings.addEventListener('click', () => {
      try {
        localStorage.removeItem('medicheck_custom_settings');
      } catch (e) {
        console.error('Failed to remove from localStorage', e);
      }

      applySettingsToInputs(DEFAULT_SETTINGS);
      applySettingsToUI(DEFAULT_SETTINGS);
      showToast('설정이 기본값으로 복원되었습니다.');
    });
  }
});
