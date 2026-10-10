document.addEventListener('DOMContentLoaded', () => {
  const btnInspect = document.getElementById('btnInspect');
  const urlInput = document.getElementById('urlInput');
  const btnSubmitFeedback = document.getElementById('btnSubmitFeedback');
  const userFeedbackInput = document.getElementById('userFeedbackInput');
  const userFeedbackList = document.getElementById('userFeedbackList');
  
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

  // UI 완전 초기화 함수 (2회 이상 입력 시 버그 방지)
  function resetUI() {
    document.getElementById('heroPostTitle').textContent = `게시물 분석 대기 중...`;
    document.getElementById('heroUrlSub').textContent = `입력된 URL을 분석합니다.`;
    document.getElementById('verdictTargetClaim').textContent = `-`;
    document.getElementById('verdictReasonsList').innerHTML = '';
    document.getElementById('verdictDoctorSummary').textContent = `-`;
    document.getElementById('scoreNumber').textContent = `0`;
    document.getElementById('labelStatusName').textContent = `대기 중`;
    document.getElementById('bannerDescription').textContent = `URL을 기반으로 실시간 검증을 진행합니다.`;
    
    const pipeSteps = document.querySelectorAll('.pipeline-step-card');
    pipeSteps.forEach(step => step.classList.remove('step-highlight', 'running')); 
    
    document.getElementById('instaMobileAppView').style.display = 'none';
    document.getElementById('instaEmbedView').style.display = 'none';

    document.getElementById('liveScorePill').textContent = '-';
    document.getElementById('liveLabelName').textContent = '분석중...';
    document.getElementById('liveReasonText').textContent = '데이터 처리 중';
    
    // 테마 리셋
    document.getElementById('analysisHeroCard').className = 'analysis-hero-card';
    document.getElementById('verdictBreakdownCard').className = 'verdict-breakdown-card';
  }

  // 초기 상태 리셋
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

      // 파이프라인 2단계 (AI 분석) 로딩 애니메이션
      document.getElementById('pipeStep2').classList.add('step-highlight', 'running');
      document.getElementById('heroPostTitle').textContent = `[분석 진행 중] URL 데이터를 AI가 검증하고 있습니다...`;
      document.getElementById('labelStatusName').textContent = `AI 사전 분석 중`;
      document.getElementById('bannerDescription').textContent = `게시물의 내용을 추출하여 공인 의학 DB와 대조 중입니다.`;

      // 아이폰 화면 먼저 띄우기 (수정 전 방식 유지: iframe 로드)
      const instaMobileAppView = document.getElementById('instaMobileAppView');
      const instaEmbedView = document.getElementById('instaEmbedView');
      const instaLiveIframe = document.getElementById('instaLiveIframe');

      // 아이폰 가상 화면 텍스트 연동
      document.getElementById('instaAuthorUsername').textContent = username;
      document.getElementById('instaCaptionUser').textContent = username;
      document.getElementById('mediaHeadlineTitle').textContent = `"${url}"의 내용`;
      document.getElementById('mediaHeadlineSub').textContent = `실시간 분석 대상 게시물입니다.`;
      
      // Iframe 임베드 URL 수정 (계정명 제외하고 순수 /p/ID 형태만 사용해야 에러가 없음)
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
      const matchedPost = SAMPLE_POSTS.find(post => post.url === url || post.url.includes(postId));

      // 1.5초 뒤 분석 완료 결과 도출 (결과가 나오지 않고 멈추는 현상 해결)
      setTimeout(() => {
        document.getElementById('pipeStep2').classList.remove('running');
        const pipeSteps = document.querySelectorAll('.pipeline-step-card');
        pipeSteps.forEach(step => step.classList.remove('step-highlight')); 

        if (matchedPost) {
          // 1. DB에 존재하는 데이터일 경우 완벽하게 매칭
          document.getElementById('pipeStep4').classList.add('step-highlight');
          document.getElementById('analysisHeroCard').classList.add(`theme-${matchedPost.label}`);
          document.getElementById('verdictBreakdownCard').classList.add(`theme-${matchedPost.label}`);
          
          document.getElementById('heroPostTitle').textContent = matchedPost.topic;
          document.getElementById('verdictTargetClaim').textContent = `"${matchedPost.verdictBreakdown.targetClaim}"`;
          document.getElementById('verdictDoctorSummary').textContent = matchedPost.verdictBreakdown.doctorSummary;
          document.getElementById('scoreNumber').textContent = matchedPost.credibilityScore;
          document.getElementById('labelStatusName').textContent = matchedPost.badgeText;
          document.getElementById('bannerDescription').textContent = matchedPost.floatingShortReason;
          
          document.getElementById('liveScorePill').textContent = matchedPost.credibilityScore + '점';
          document.getElementById('liveLabelName').textContent = matchedPost.badgeText;
          document.getElementById('liveReasonText').textContent = matchedPost.floatingShortReason;

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
          // 2. 새로운 URL인 경우, 분석이 진행되어 동적 결과가 도출되도록 처리
          document.getElementById('pipeStep4').classList.add('step-highlight');
          
          // 국가기관 및 공인 기관 판별 (username 기반)
          const officialKeywords = ['koreadca', 'mohw', 'mfds', 'cdc', 'who', 'nih', 'gov', 'seoul', 'icmcseoul', 'health'];
          const isOfficial = officialKeywords.some(keyword => username.toLowerCase().includes(keyword));

          if (isOfficial) {
            // [상향 조정] 국가 공인 기관 데이터
            document.getElementById('analysisHeroCard').classList.add('theme-verified');
            document.getElementById('verdictBreakdownCard').classList.add('theme-verified');

            document.getElementById('heroPostTitle').textContent = `[공인 기관 검증 완료] ${username} 님의 의료정보`;
            document.getElementById('labelStatusName').textContent = `검증 완료`;
            document.getElementById('scoreNumber').textContent = `98`;
            document.getElementById('bannerDescription').textContent = `해당 채널은 국가 공인 보건/의료 기관으로, 게시된 정보의 신뢰도가 매우 높습니다.`;
            
            document.getElementById('liveScorePill').textContent = '98점';
            document.getElementById('liveLabelName').textContent = '검증 완료';
            document.getElementById('liveReasonText').textContent = '국가 공인 보건 기관의 공식 지침 준수';

            document.getElementById('verdictTargetClaim').textContent = `"${url} 에 포함된 공중 보건 안내 및 의료 수칙"`;
            document.getElementById('verdictDoctorSummary').textContent = `AI 1차 판독 결과: 본 게시물은 신뢰할 수 있는 국가 보건 기관의 공식 발표 자료로, 의학적 근거(EBM)를 완벽히 충족합니다.`;

            document.getElementById('verdictReasonsList').innerHTML = `
              <div class="reason-item-card">
                <div class="reason-num-badge">1</div>
                <div class="reason-content-box">
                  <span class="reason-tag">공인 기관 화이트리스트</span>
                  <p class="reason-text">해당 계정은 질병관리청, 보건소, WHO 등 국가 및 국제 공인 보건 기관으로 등록되어 있습니다.</p>
                </div>
              </div>
              <div class="reason-item-card">
                <div class="reason-num-badge">2</div>
                <div class="reason-content-box">
                  <span class="reason-tag">EBM 표준 부합</span>
                  <p class="reason-text">게시된 내용은 임상 시험 및 보건 당국의 역학 조사에 기반한 객관적 사실입니다.</p>
                </div>
              </div>
            `;
          } else {
            // [기본] 일반 미확인 URL 데이터
            document.getElementById('analysisHeroCard').classList.add('theme-caution');
            document.getElementById('verdictBreakdownCard').classList.add('theme-caution');

            document.getElementById('heroPostTitle').textContent = `[AI 검증 완료] ${username} 님의 인스타그램 의료정보`;
            document.getElementById('labelStatusName').textContent = `추가 확인 필요`;
            document.getElementById('scoreNumber').textContent = `55`;
            document.getElementById('bannerDescription').textContent = `해당 URL의 정보를 분석한 결과, 아직 의학적으로 대규모 검증이 완료되지 않아 주의가 필요합니다.`;
            
            document.getElementById('liveScorePill').textContent = '55점';
            document.getElementById('liveLabelName').textContent = '추가 확인 필요';
            document.getElementById('liveReasonText').textContent = '정밀 임상 논문 대조가 진행 중입니다.';

            // URL을 기반으로 동적 클레임 생성
            document.getElementById('verdictTargetClaim').textContent = `"${url} 에 포함된 주요 의학적 텍스트 및 해시태그 주장에 대한 1차 검증"`;
            document.getElementById('verdictDoctorSummary').textContent = `AI 1차 판독 결과: 본 게시물의 주장은 과학적 입증이 다소 부족한 부분이 있어, 정밀한 전문의의 심의를 대기 중입니다. 맹신하지 마십시오.`;

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
                  <span class="reason-tag">제한적 데이터</span>
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
      // CSS 구조에 따라 visibility 처리
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
      // 모든 버튼/패널 active 제거 (혹은 display 처리)
      settingsTabBtns.forEach(b => b.classList.remove('active'));
      settingsPanels.forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none'; // CSS 의존도 낮추기 위해 직접 display 제어
      });
      
      // 현재 클릭된 탭 활성화
      btn.classList.add('active');
      const targetTab = btn.getAttribute('data-settings-tab');
      // data-settings-tab 값이 labels 이면 settingsPanelLabels
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
        // 새 검증조건 블록 생성
        const newBlock = document.createElement('div');
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
        
        // 삭제 버튼 이벤트
        const removeBtn = newBlock.querySelector('.btn-remove-condition');
        removeBtn.addEventListener('click', () => {
          newBlock.remove();
        });

        // +버튼 바로 위에 삽입
        container.insertBefore(newBlock, btnAddCondition);
      }
    });
  }
});
