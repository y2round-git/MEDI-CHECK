/**
 * MEDI-CHECK Data Module (Enhanced)
 * - 4단계 신뢰도 평가 기준 및 5단계 검증 파이프라인
 * - 전면 노출용 등급 판정 핵심 사유 (Verdict Breakdown) 데이터 포함
 * - 다양한 의학/건강 SNS 인스타그램 사례 데이터셋
 */

const DEFAULT_CRITERIA = {
  stages: [
    {
      id: 1,
      title: "1단계 · 게시물 등록 및 탐지",
      desc: "건강·의료 관련 SNS 게시물 분류 및 메타데이터 수집",
      detail: "인스타그램 URL, 캡션, 해시태그를 감지하여 의료/건강 관련 콘텐츠로 자동 분류합니다."
    },
    {
      id: 2,
      title: "2단계 · AI 사전 분석",
      desc: "주요 주장 추출 및 의학적 근거 대조",
      detail: "자연어 처리 엔진으로 핵심 의학적 주장(Claim)을 추출하고 PubMed, Cochrane, 질병청 등 공인 DB와 1차 대조합니다."
    },
    {
      id: 3,
      title: "3단계 · 전문가 검증",
      desc: "의료 전문가가 근거와 판단 결과 검토",
      detail: "내과·가정의학과·약학 등 전문의 패널 및 팩트체크 위원회가 임상적 유효성과 환자 위해성을 종합 심의합니다."
    },
    {
      id: 4,
      title: "4단계 · MEDI-CHECK 라벨 부착",
      desc: "검증 결과와 근거 자료를 SNS에 표시",
      detail: "최종 산출된 4단계 인증 라벨 배지와 의학적 근거 리포트를 브라우저 및 SNS 인터페이스에 오버레이로 부착합니다."
    },
    {
      id: 5,
      title: "5단계 · 재검증 및 갱신",
      desc: "새로운 연구 결과나 의료 지침 변경 반영",
      detail: "신규 임상시험 결과, 보건당국 가이드라인 업데이트 및 사용자 집단지성 제보를 수렴하여 라벨을 지속 갱신합니다."
    }
  ],
  labels: {
    verified: {
      key: "verified",
      name: "검증 완료",
      color: "#10B981",
      bgColor: "#ECFDF5",
      borderColor: "#A7F3D0",
      icon: "check-circle",
      summary: "과학적 근거가 충분하고, 주요 내용이 공인 전문의 검토를 통과한 정보",
      scoreRange: "80 ~ 100점",
      criteriaPoints: [
        "질병관리청(KDCA), WHO, FDA, 대한의학회 등 공인 보건의료 가이드라인과 일치",
        "무작위 대조 임상시험(RCT) 또는 체계적 문헌고찰(Meta-analysis) 논문 근거 확인",
        "인과관계가 입증된 작용 기전과 안전한 용법/주의사항을 명시",
        "특정 상품의 독점 판매 유도나 공포 마케팅이 없는 객관적 정보 전달"
      ]
    },
    caution: {
      key: "caution",
      name: "추가 확인 필요",
      color: "#F59E0B",
      bgColor: "#FFFBEB",
      borderColor: "#FDE68A",
      icon: "alert-triangle",
      summary: "근거가 부족하거나 아직 의학적으로 충분히 검증되지 않은 정보",
      scoreRange: "50 ~ 79점",
      criteriaPoints: [
        "세포(In vitro) 또는 동물 실험 단계 수준이며 대규모 인체 임상시험 결과 부족",
        "학계 내 이견이 존재하거나 개인 체질·기저질환에 따라 상이한 결과 발생 가능",
        "질환 치료제가 아닌 단순 건강기능식품 수준의 보조적 효능을 과장했을 가능성",
        "의학적 가설 단계의 주장을 단정적으로 표현한 경우"
      ]
    },
    misleading: {
      key: "misleading",
      name: "잘못된 정보 확인",
      color: "#EF4444",
      bgColor: "#FEF2F2",
      borderColor: "#FECACA",
      icon: "x-circle",
      summary: "신뢰할 만한 의학적 근거와 명확하게 배치되는 주장이 확인된 정보",
      scoreRange: "0 ~ 49점",
      criteriaPoints: [
        "정규 의학적 치료(항암치료, 혈압약 복용 등) 거부를 조장하여 신체적 위해 유발",
        "과학적으로 이미 반증된 유사과학, 허위 민간요법 및 사기성 디톡스 주장",
        "'100% 완치', '기적의 약초' 등 자극적인 치료 단정 및 고가 제품 판매 결합",
        "심각한 장기 독성(간독성, 급성 신부전)을 초래할 수 있는 위험 조언"
      ]
    },
    unverified: {
      key: "unverified",
      name: "미검증",
      color: "#6B7280",
      bgColor: "#F3F4F6",
      borderColor: "#E5E7EB",
      icon: "help-circle",
      summary: "아직 검증 절차가 이루어지지 않은 정보. 잘못된 정보라는 의미는 아님",
      scoreRange: "평가 대기 중",
      criteriaPoints: [
        "최근 신규 등록된 게시물로 AI 및 전문의 검증 파이프라인 심의 대기 상태",
        "원문에서 구체적인 성분, 용량, 연구 출처가 제시되지 않아 추가 데이터 수집 필요",
        "신뢰할 수 없는 정보라는 확정이 아니므로 검증 완료 전까지 맹신을 유보할 것을 권고"
      ]
    }
  }
};

const SAMPLE_POSTS = [
  {
    id: "post-1",
    url: "https://www.instagram.com/p/C9_lemon_detox_cancer_myth/",
    topic: "레몬물 디톡스로 온몸의 독소 배출과 암세포 99% 박멸?!",
    author: {
      username: "miracle_detox_life",
      displayName: "미라클 자연치유 라이프",
      avatar: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=150&q=80",
      verified: false,
      followers: "14.8만"
    },
    label: "misleading",
    credibilityScore: 12,
    badgeText: "잘못된 정보 확인",
    floatingShortReason: "체내 pH 조절 불가 및 표준 항암치료 방해로 치명적 위험",
    postMedia: {
      type: "image",
      url: "https://images.unsplash.com/photo-1587496679742-bad502958fbf?auto=format&fit=crop&w=800&q=80",
      captionHeadline: "🍋 의사들이 절대 안 알려주는 레몬물 항암 기적!",
      subtext: "공복에 레몬즙 한 컵 = 암세포 99% 박멸?!"
    },
    likesCount: "12,492",
    caption: `매일 아침 공복에 따뜻한 레몬즙 한 컵! 🍋✨ 
병원에서 항암치료로 몸 망치지 마세요. 우리 몸을 알칼리성으로 완전히 바꾸어주면 산성 환경에서만 자라는 암세포는 스스로 굶어 죽습니다. 
독일 비밀 연구소 연구 결과 밝혀진 천연 항암 치료법! 
주변 암 환우분들께 널리 공유해서 생명을 살려주세요! 🌿
#레몬물 #자연치유 #암정복 #항암치료거부 #디톡스식단 #건강비법`,
    // 전면에 노출할 등급 판정 핵심 사유 (Verdict Breakdown)
    verdictBreakdown: {
      targetClaim: "공복에 레몬물을 마시면 체내 pH가 알칼리로 바뀌어 암세포가 99% 굶어 죽으므로 항암치료를 대체할 수 있다.",
      whyReasons: [
        {
          tag: "생리학적 기전 허구성",
          text: "인체 혈액 pH는 호흡계(폐)와 신장의 완충 시스템에 의해 7.35~7.45로 엄격히 고정되어 있으며, 어떤 음식물로도 혈중 산도를 바꿀 수 없습니다. (국립암센터 & 미국 암학회 ACS 공식 권고)"
        },
        {
          tag: "치료 골든타임 상실 위험",
          text: "검증된 표준 항암치료를 중단하고 민간요법에 의존할 경우 5년 사망 위험이 유방암 5.68배, 대장암 4.57배 급격히 증가합니다. (JAMA Oncology 게재 논문)"
        },
        {
          tag: "직접적인 신체 손상",
          text: "공복에 고농도 레몬즙(구연산)을 반복 섭취할 경우 심각한 역류성 식도염, 위점막 미란 및 출혈을 유발할 수 있습니다."
        }
      ],
      riskLevel: "매우 높음 (Critical Risk: 환자 생명 직결)",
      doctorSummary: "과학적 근거가 전혀 없는 전형적인 사이비 항암 치료설입니다. 암세포 사멸 기전이 전혀 존재하지 않으며, 항암치료 거부를 유도하여 환자를 사망에 이르게 할 수 있는 매우 위험한 허위정보입니다."
    },
    analysis: {
      targetCategory: "종양학 / 종양치료 보완대체의학",
      extractedClaims: [
        "레몬물을 섭취하면 인체의 체액/혈액이 알칼리성으로 변한다.",
        "암세포는 산성에서만 증식하므로 레몬물을 마시면 암세포가 99% 사멸한다.",
        "병원 항암치료를 대체할 수 있는 자연 치유법이다."
      ],
      medicalEvidence: [
        "【혈중 pH 항상성】 인체의 혈액 산도는 호흡기(폐)와 신장의 정밀한 완충계에 의해 엄격히 조절됩니다.",
        "【산-알칼리 암 기원설의 허구성】 암세포 주변이 산성화되는 것은 암세포 대사의 결과물이지 원인이 아닙니다.",
        "【치료 지연의 위험성】 대체요법 단독 시행 시 생존율이 급감한다는 대규모 임상 연구 결과가 다수 보고되어 있습니다."
      ],
      doctorReview: {
        expertName: "박준혁 교수 (종양내과 전문의 / 서울메디컬센터)",
        date: "2026.10.08 검증",
        comment: "전형적인 사이비 암치료 유사과학입니다. 레몬에 비타민C와 항산화 물질이 소량 포함되어 있을 뿐, 항암제를 대체하거나 체내 pH를 바꾸는 것은 불가능합니다. 절대 치료를 중단하지 마십시오."
      },
      actionGuide: "정규 종양내과 치료를 절대로 중단하지 마시고, 주치의가 처방하지 않은 극단적인 레몬즙 디톡스 요법을 즉각 중단하세요."
    },
    comments: [
      {
        id: "c1-1",
        author: "dr_oncologist_kim",
        authorName: "김민우 (혈액종양내과 전문의)",
        isExpert: true,
        expertRole: "전문의 인증",
        avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=100&q=80",
        text: "외래에서 이런 게시물을 보고 항암 치료를 거부하시다 병이 급격히 악화되어 오시는 환자분들을 뵐 때마다 가슴이 무너집니다. 레몬물은 음료일 뿐, 절대 약이 아닙니다.",
        timestamp: "2시간 전",
        likes: 342
      },
      {
        id: "c1-2",
        author: "pharmacist_lee",
        authorName: "이소연 약사",
        isExpert: true,
        expertRole: "약사 인증",
        avatar: "https://images.unsplash.com/photo-1594824813571-638f02614d3f?auto=format&fit=crop&w=100&q=80",
        text: "특정 경구용 항암제를 복용 중이신 분들이 산도 높은 과즙을 다량 드시면 약물 흡수율에 악영향을 주거나 심한 위장관 출혈을 부를 수 있습니다.",
        timestamp: "4시간 전",
        likes: 189
      }
    ]
  },
  {
    id: "post-2",
    url: "https://www.instagram.com/p/DB_intermittent_fasting_evidence/",
    topic: "간헐적 단식(16:8), 인슐린 저항성 개선과 지방 연소에 실제 도움될까?",
    author: {
      username: "dr_internal_health",
      displayName: "닥터 건강한내과",
      avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=150&q=80",
      verified: true,
      followers: "8.2만"
    },
    label: "verified",
    credibilityScore: 94,
    badgeText: "검증 완료",
    floatingShortReason: "NEJM 등 공인 임상 논문 입증 & 주의사항 균형 제시",
    postMedia: {
      type: "image",
      url: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80",
      captionHeadline: "⏱ 16:8 간헐적 단식, 의학적으로 입증된 효과와 주의점",
      subtext: "인슐린 저항성 개선과 오토파지(자가포식) 활성화"
    },
    likesCount: "8,920",
    caption: `체중 감량을 넘어 혈당 조절에 탁월한 16:8 간헐적 단식의 과학적 원리를 정리해 드립니다. 🩺
16시간 공복 상태가 유지되면 혈중 인슐린 수치가 감소하고 세포 내 '자가포식(Autophagy)' 기전이 가동됩니다.
단, 당뇨약을 복용 중이시거나 임산부, 성장기 청소년은 저혈당 위험이 있으므로 주치의 상담이 필수입니다!
#간헐적단식 #인슐린저항성 #내과의사추천 #혈당관리 #대사증후군`,
    verdictBreakdown: {
      targetClaim: "16시간의 공복 유지는 인슐린 분비를 낮추고 지방 산화 및 자가포식을 촉진하여 대사증후군 개선에 기여한다.",
      whyReasons: [
        {
          tag: "최상위 의학 학술지 검증",
          text: "세계 최고 권위의 NEJM(2019) 논문에서 간헐적 단식의 '대사 스위칭(Metabolic Switching)' 기전을 통한 인슐린 감수성 개선과 염증 수치 저하 효과가 입증되었습니다."
        },
        {
          tag: "당뇨병학회 가이드라인 부합",
          text: "미국 당뇨병학회(ADA) 및 대한비만학회 지침에서 과체중 성인의 체중 감량과 HOMA-IR 지수 개선에 효과적인 전략으로 공식 언급됩니다."
        },
        {
          tag: "기저질환자 금기 명시",
          text: "인슐린이나 설포닐우레아 약물 복용 환자의 저혈당 위험, 임산부 및 청소년 금기사항을 정확히 병기하여 정보의 균형성을 갖추었습니다."
        }
      ],
      riskLevel: "안전 (일반 성인 대상 / 기저질환자 예외 명시됨)",
      doctorSummary: "기전 설명과 임상적 주의사항이 표준 의학 지침과 정확하게 일치하며, 맹신이나 제품 판매 유도 없이 객관적인 근거를 제시하고 있습니다."
    },
    analysis: {
      targetCategory: "내분비대사내과 / 영양학",
      extractedClaims: [
        "16시간 이상의 공복 시간은 인슐린 분비를 낮추어 인슐린 감수성을 개선한다.",
        "지방 산화를 촉진하고 세포 자가포식 활성화에 긍정적인 영향을 준다.",
        "기저 당뇨 환자는 저혈당 위험이 있어 전문가 상담이 필요하다."
      ],
      medicalEvidence: [
        "【NEJM 학술지 게재 논문 (2019)】 대사 스위칭을 통한 세포 저항력 강화 확인.",
        "【미국 당뇨병학회(ADA) 지침】 체중 감량과 대사 지표 개선 유효 식이 전략으로 인정.",
        "【주의사항 명시】 인슐린 주사제 복용 환자는 저혈당 우려로 단독 시행 금지."
      ],
      doctorReview: {
        expertName: "한지은 과장 (내분비내과 전문의 / 메디컬센터)",
        date: "2026.10.09 검증",
        comment: "기전 설명과 주의해야 할 기저질환자 대상 금기사항이 의학 지침과 정확하게 부합합니다."
      },
      actionGuide: "본인의 생활 리듬에 맞춰 서서히 공복 시간을 늘려가되, 식사 시간대 폭식하지 않도록 단백질과 식이섬유 위주 식단을 구성하세요."
    },
    comments: [
      {
        id: "c2-1",
        author: "clinical_dietitian",
        authorName: "정유진 임상영양사",
        isExpert: true,
        expertRole: "영양사 인증",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80",
        text: "단식 시간만 지키고 식사 시간대에 폭식하면 오히려 혈당 스파이크가 옵니다. 양질의 복합 탄수화물과 단백질 배분이 핵심입니다.",
        timestamp: "3시간 전",
        likes: 125
      }
    ]
  },
  {
    id: "post-3",
    url: "https://www.instagram.com/p/C8_hypertension_pill_fake/",
    topic: "고혈압약 한번 먹으면 평생 못 끊고 결국 신장이 망가진다?!",
    author: {
      username: "natural_healing_korea",
      displayName: "자연치유 아카데미",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      verified: false,
      followers: "5.1만"
    },
    label: "misleading",
    credibilityScore: 8,
    badgeText: "잘못된 정보 확인",
    floatingShortReason: "혈압약 중단 시 뇌졸중·투석 위험 급증 & 소금물 음용 치명적",
    postMedia: {
      type: "image",
      url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
      captionHeadline: "💊 혈압약, 한번 먹으면 평생 못 끊고 콩팥 망가진다?!",
      subtext: "제약회사의 음모? 소금차 마시고 혈압약 끊으세요!"
    },
    likesCount: "5,340",
    caption: `혈압약은 혈관을 억지로 늘려놓는 눈속임입니다. 
계속 복용하면 결국 혈관 탄력성이 다 죽고 신장이 망가져서 투석하게 됩니다. 
의사들이 시키는 대로 약 먹지 말고 죽염수와 쑥뜸으로 근본 체질을 고치세요. 
제 피드 프로필 링크에서 '혈압약 중단 특강' 무료 신청 받습니다.
#고혈압탈출 #혈압약부작용 #소금차 #신장투석예방 #자연요법`,
    verdictBreakdown: {
      targetClaim: "혈압약은 혈관 탄력을 파괴해 신장을 망가뜨리므로, 약을 끊고 죽염수(소금물)를 마셔야 근본 치유된다.",
      whyReasons: [
        {
          tag: "원인과 결과의 완전한 왜곡",
          text: "신장을 파괴하여 투석에 이르게 하는 주범은 혈압약이 아니라 '조절되지 않는 높은 혈압'입니다. 혈압약(특히 ARB, ACEI)은 사구체 압력을 낮추는 핵심 신장 보호제입니다."
        },
        {
          tag: "뇌졸중·심근경색 유발 위험",
          text: "혈압약을 자의 중단할 경우 혈압이 180 이상으로 급상승하여 뇌출혈, 심근경색, 대동맥 박리 등 생명을 위협하는 치명적 응급상황을 초래합니다. (대한고혈압학회 2022 진료지침)"
        },
        {
          tag: "고나트륨 소금차의 독성",
          text: "고혈압 환자에게 고농도 소금물을 마시라는 것은 체액량을 급증시켜 급성 고혈압 위기(Hypertensive crisis)를 촉발하는 위험한 살인 행위입니다."
        }
      ],
      riskLevel: "매우 높음 (Critical Risk: 영구적 장기 부전 및 사망 유발)",
      doctorSummary: "의학적 상식에 정면으로 위배되는 치명적인 가짜뉴스입니다. 신장 투석 환자의 60% 이상이 고혈압과 당뇨 관리 실패에서 비롯됩니다. 절대 임의로 약을 끊어서는 안 됩니다."
    },
    analysis: {
      targetCategory: "순환기내과 / 신장내과",
      extractedClaims: [
        "고혈압 약을 복용하면 혈관 탄력성이 사라지고 신장이 망가져 투석을 하게 된다.",
        "혈압약을 중단하고 죽염수를 마셔야 혈압이 근본적으로 치유된다."
      ],
      medicalEvidence: [
        "【신장 보호 효과】 고혈압 약은 사구체 내압을 낮추어 만성 신장질환 진행을 막습니다.",
        "【혈압 미조절의 위험】 혈압을 방치할 경우 뇌출혈, 심근경색, 사구체 경화증이 발생합니다.",
        "【죽염수의 치명성】 고나트륨 용액 섭취는 급성 고혈압 위기로 직결됩니다."
      ],
      doctorReview: {
        expertName: "이성원 교수 (심장내과 전문의)",
        date: "2026.10.07 검증",
        comment: "고혈압 환자에게 약을 끊고 소금물을 마시라는 것은 살인 행위에 준하는 위험천만한 주장입니다."
      },
      actionGuide: "복용 중인 혈압약을 임의로 중단하지 마시고, 불편감이 있다면 주치의와 상의하세요."
    },
    comments: [
      {
        id: "c3-1",
        author: "kidney_doctor_choi",
        authorName: "최동석 (신장내과 분과전문의)",
        isExpert: true,
        expertRole: "전문의 인증",
        avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=100&q=80",
        text: "투석실 환자분들의 1위 원인이 바로 고혈압과 당뇨입니다. 약을 제때 꼬박꼬박 드신 분들이 신장을 지키신 분들입니다.",
        timestamp: "1시간 전",
        likes: 412
      }
    ]
  },
  {
    id: "post-4",
    url: "https://www.instagram.com/p/DA_glutathione_film_caution/",
    topic: "글루타치온 구강필름 미백 효과",
    author: {
      username: "beauty_bio_lab",
      displayName: "뷰티 바이오 랩",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      verified: false,
      followers: "3.4만"
    },
    label: "caution",
    credibilityScore: 64,
    badgeText: "추가 확인 필요",
    floatingShortReason: "소규모 연구 수준 & 단기간 극적 미백 효과 과대광고 주의",
    postMedia: {
      type: "image",
      url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
      captionHeadline: "✨ 입천장에 붙이는 글루타치온 필름! 일주일 만에 백옥 피부?",
      subtext: "구강점막 흡수율 80%라는데... 과연 진실은?"
    },
    likesCount: "3,120",
    caption: `먹는 글루타치온은 위에서 다 분해된다? NO! 
입천장에 붙이는 점막 부착형 필름으로 흡수율을 10배 올렸습니다. 
멜라닌 색소 억제와 간 해독까지 한번에 해결하는 기적의 이너뷰티 아이템!
#글루타치온필름 #이너뷰티 #백옥주사효과 #피부미백 #간해독`,
    verdictBreakdown: {
      targetClaim: "구강 점막 흡수율 80%를 달성하여 일주일 만에 피부 미백과 멜라닌 색소 제거 효과가 나타난다.",
      whyReasons: [
        {
          tag: "인체 적용 임상 규모 한계",
          text: "구강 점막 흡수 기술의 이론적 타당성은 일부 소규모 파일럿 연구에서 확인되었으나, 대규모 무작위 대조 임상시험(RCT) 결과가 여전히 부족합니다."
        },
        {
          tag: "단기간 미백 효과 과장",
          text: "글루타치온 성분의 멜라닌 억제는 보조적 수준이며, 1~2주 만에 피부톤이 드라마틱하게 백옥처럼 변한다는 주장은 과대광고에 해당합니다. (대한피부과의사회 의견)"
        },
        {
          tag: "안전성 및 개인차",
          text: "성분 자체는 항산화 물질로 안전한 편이나, 의약품 수준의 치료 효능을 기대하고 고가 제품에 과다 지출하지 않도록 주의가 필요합니다."
        }
      ],
      riskLevel: "낮음 (영양제 수준 / 과대광고 유의)",
      doctorSummary: "항산화 보조제로서의 섭취는 무방하나, '일주일 백옥 피부'와 같은 자극적인 미백 치료 효능은 과학적 근거가 부족합니다."
    },
    analysis: {
      targetCategory: "피부과 / 임상약리학",
      extractedClaims: [
        "구강 점막을 통한 글루타치온 흡수는 위장 분해를 피해 혈중 농도를 극적으로 높인다.",
        "섭취 일주일 만에 피부 미백 및 멜라닌 색소 개선 효과가 체감된다."
      ],
      medicalEvidence: [
        "【점막 흡수 기전】 점막 흡수 가능성은 일부 파일럿 연구에 국한되며, 대규모 약동학 데이터는 부족합니다.",
        "【미백 효과의 근거 수준】 단기간 드라마틱한 미백 효과는 과대광고 소지가 큽니다."
      ],
      doctorReview: {
        expertName: "송혜린 원장 (피부과 전문의)",
        date: "2026.10.05 검증",
        comment: "항산화 성분으로서 보조적 섭취는 해가 되지 않겠으나, 1~2주 만에 피부톤이 달라진다는 광고 문구는 과장입니다."
      },
      actionGuide: "건강기능식품 수준의 영양 보조제로 인식하시고, 의약품 수준의 즉각적인 효과를 기대하지 마세요."
    },
    comments: [
      {
        id: "c4-1",
        author: "pharma_expert",
        authorName: "강현우 약학박사",
        isExpert: true,
        expertRole: "약학 연구원",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
        text: "필름 제형이 흡수에 유리한 것은 맞지만, 제품마다 점착 기술과 생체이용률 편차가 매우 큽니다.",
        timestamp: "5시간 전",
        likes: 82
      }
    ]
  },
  {
    id: "post-5",
    url: "https://www.instagram.com/p/CZ_amazon_miracle_berry/",
    topic: "신소재 야생 베리 수면 다이어트",
    author: {
      username: "trend_health_global",
      displayName: "글로벌 트렌드 헬스",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
      verified: false,
      followers: "1.9만"
    },
    label: "unverified",
    credibilityScore: 35,
    badgeText: "미검증",
    floatingShortReason: "식약처 미인정 원료 & 인체 임상 논문 검증 큐 대기 중",
    postMedia: {
      type: "image",
      url: "https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=800&q=80",
      captionHeadline: "🌙 수면 중 기초대사량 500kcal 자동 버닝? 아마존 퍼플베리 추출물",
      subtext: "해외 직구로 열풍 부는 신소재 파우더"
    },
    likesCount: "1,450",
    caption: `잠자기 전 한 포만 마시면 깊은 잠을 자는 동안 갈색지방을 깨워 체지방만 쏙 태워줍니다!
아마존 원주민들이 수백 년간 지켜온 비밀의 보라색 열매 추출물 🍇
현재 식약처 허가 진행 중, 한정 수량 선착순 예약 구매 시작!
#수면다이어트 #기초대사량증가 #신소재추출물 #해외직구다이어트`,
    verdictBreakdown: {
      targetClaim: "섭취 후 수면 시 갈색지방 활성화로 500kcal를 자동 소비하여 운동 없이 주당 2kg 체지방을 감량한다.",
      whyReasons: [
        {
          tag: "식약처 기능성 원료 미인정",
          text: "국내 식품의약품안전처 건강기능식품 개별인정형 기능성 원료 목록에 등재되어 있지 않은 신규 미검증 원료입니다."
        },
        {
          tag: "인체 적용 시험 부재",
          text: "국제 공인 SCI급 의학 학술지에 게재된 무작위 대조 인체 임상시험(RCT) 데이터가 전무합니다."
        },
        {
          tag: "해외 직구 안전성 미확보",
          text: "해외 직구 다이어트 원료는 부정물질(시부트라민, 센노사이드 등) 혼입 우려가 있어 정밀 성분 분석 전까지 섭취를 유보해야 합니다."
        }
      ],
      riskLevel: "보통 (신원료 안전성 미확인 상태)",
      doctorSummary: "현재 1차 검증 큐에 대기 중인 [미검증] 상태입니다. '잘못된 정보'라는 확정은 아니지만, 성분 안전성과 임상 유효성이 확인될 때까지 맹신을 피해야 합니다."
    },
    analysis: {
      targetCategory: "가정의학과 / 비만치료",
      extractedClaims: [
        "수면 중 갈색지방을 선택적으로 활성화하여 500kcal를 추가 소비한다.",
        "식단 조절이나 운동 없이 섭취만으로 주당 2kg 체지방 감량이 가능하다."
      ],
      medicalEvidence: [
        "【원료 미검증】 식약처 건강기능식품 기능성 원료 미등록 상태입니다.",
        "【안전성 미확보】 해외 직구 원료의 안전성 검증이 완료되기 전 섭취는 위험할 수 있습니다."
      ],
      doctorReview: {
        expertName: "MEDI-CHECK 시스템 알림",
        date: "2026.10.10 상태",
        comment: "현재 전문의 패널 및 팩트체크 위원회에 심의 대기 중인 [미검증] 상태입니다."
      },
      actionGuide: "국내 공인 인증 마크(건강기능식품 마크)가 확인되기 전까지 섭취를 유보하세요."
    },
    comments: [
      {
        id: "c5-1",
        author: "safe_food_inspector",
        authorName: "식품안전모니터",
        isExpert: false,
        avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=100&q=80",
        text: "식약처 식품안전나라에서 검색해 보니 아직 안전성 평가도 안 끝난 원료네요.",
        timestamp: "12시간 전",
        likes: 45
      }
    ]
  }
];

// 로컬 스토리지 키 정의
const STORAGE_KEYS = {
  CRITERIA: "medicheck_custom_criteria_v1",
  COMMENTS: "medicheck_custom_comments_v1",
  HISTORY: "medicheck_search_history_v1"
};
