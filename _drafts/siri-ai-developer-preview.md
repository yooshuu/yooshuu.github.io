---
title: "Siri AI 개발자 프리뷰: 내 앱 기능을 Siri의 도구로 여는 법"
date: 2026-11-04 09:00:00 +0900
description: "Apple이 Siri AI 개발자 프리뷰를 공개했습니다. App Intents로 앱의 고유 기능을 연결하는 방법과 아직 출시할 수 없는 이유를 정리합니다."
tags: [AI, Apple, Siri, AppIntents]
ai_assisted: true
---

음성 비서가 앱 기능을 대신 실행하려면, 먼저 그 앱이 무엇을 할 수 있는지 알아야 합니다. 정해진 범주에 맞는 기능만 연결할 수 있다면, 그 앱만의 고유한 기능은 음성 비서가 쓸 수 없습니다.

Apple이 2026년 11월 3일 공개한 **Siri AI 개발자 프리뷰**는 이 범위를 넓힙니다. 시스템이 정의한 스키마에 맞는 기능뿐 아니라 앱의 고유한 동작과 콘텐츠까지 Siri AI에 연결할 수 있습니다. 다만 아직은 미리 만들어 보는 단계이고, 일반 사용자에게 출시할 수는 없습니다.

> 이 글은 Apple의 개발자 공지와 공식 문서를 바탕으로 작성했습니다. 프리뷰 기간에는 API와 Siri의 동작이 바뀔 수 있으니, 실제로 개발할 때는 최신 문서를 확인해야 합니다.

## 1. 이번에 공개된 것

프리뷰는 iOS·iPadOS·macOS·visionOS 27.3 베타에서, Apple Intelligence를 지원하는 기기로 쓸 수 있습니다. 별도 권한(entitlement)을 받거나 새 프로그램에 가입할 필요는 없습니다.

- **도구로 쓰는 App Intents:** 앱의 고유 동작을 Siri가 호출할 수 있는 도구로 엽니다.
- **app skills:** 여러 동작이 필요한 복잡한 요청을 처리하도록 Siri에 설명을 제공합니다.
- **Spotlight 검색 확대:** 기존 스키마에 맞지 않는 항목도 Siri AI가 찾아 줄 수 있습니다.
- **검증 도구:** Xcode의 Siri Integration Advisor가 개선점을 알려 주고, Siri Evaluations 프레임워크로 Siri의 처리 결과를 측정할 수 있습니다.

## 2. 시작은 매크로 한 줄이다

기존 App Intent에 `@AppIntent(.tool)` 매크로를 붙이면 Siri가 쓸 수 있는 도구가 됩니다. 아래는 Apple 문서의 형태를 따라 만든 배송 조회 예시입니다.

```swift
@AppIntent(.tool)
struct CheckDelivery: AppIntent {
    static let title: LocalizedStringResource = "배송 조회"
    static let description = IntentDescription(
        LocalizedStringResource("주문한 상품의 배송 상태를 확인합니다.")
    )

    @Parameter(title: "주문 번호", description: LocalizedStringResource("조회할 주문의 번호"))
    var orderNumber: String

    func perform() async throws -> some IntentResult {
        // 실제 배송 조회 로직
        return .result()
    }
}
```

눈여겨볼 부분은 제목과 설명입니다. Siri는 이 정보로 어떤 기능인지 파악하고, 비슷한 기능과 구분하며, 필요한 값을 채웁니다. 코드뿐 아니라 **설명 문구까지 인터페이스의 일부**가 되는 셈입니다.

Siri는 앱이 명시적으로 연 기능과 콘텐츠만 사용할 수 있습니다. 또 Siri를 지원하는 스키마를 이미 쓰고 있다면 이 매크로를 추가하지 않아도 됩니다. 메시지 앱의 `sendMessage` 스키마가 그런 경우입니다.

## 3. 복잡한 요청은 app skills로 안내한다

"내 취향에 맞는 세일 신발을 비교해 줘" 같은 요청은 도구 하나로 끝나지 않습니다. 이럴 때 `Skills.skillsbundle` 안에 스킬별 `SKILL.md` 파일을 넣어, 도구들이 어떻게 이어지는지와 피해야 할 동작, 앱 고유의 지식을 자연어로 설명합니다.

주의할 점은 **스킬이 정해진 순서를 강제하는 워크플로가 아니라는 것**입니다. Apple 문서도 스킬로 동작을 결정론적으로 만들 수 없고, Siri가 나열된 도구를 순서대로 실행하지도 않는다고 설명합니다. 반드시 지켜야 하는 절차라면 앱 코드에서 보장해야 합니다.

## 4. 앱 이름을 꼭 말해야 할까

상황에 따라 다릅니다.

| 상황 | 앱 이름 언급 |
| --- | --- |
| 앱이 화면 앞에 떠 있을 때 | 필요 없음 |
| Live Activity가 실행 중일 때 | 필요 없음 |
| Siri 앱에서 그 앱이 언급된 대화를 이어 갈 때 | 필요 없음 |
| 앱이 백그라운드에 있을 때 | 필요함 |

한 앱의 콘텐츠를 찾아 다른 앱으로 넘기는 요청도 가능합니다. 문서에는 즐겨찾기한 신발 정보를 메시지 앱으로 보내는 예시가 나옵니다.

## 5. 지금 되는 것과 아직 안 되는 것

| 항목 | 현재 상태 |
| --- | --- |
| Xcode로 빌드해 내 기기에서 테스트 | 가능 |
| TestFlight 내부 테스터 배포 | 가능 |
| TestFlight 외부 테스터 배포 | 불가 |
| App Store 버전에서 동작 | 불가 |
| App Store 제출 | 봄부터 가능 예정 |
| 일반 사용자 제공 | 몇 달 뒤 예정 |
| 약관과 사용 정책 | 추후 안내 예정 |

## 6. 만들기 전에 확인할 점

- **민감한 정보:** 앱 엔티티는 기본적으로 인증 없이 표시될 수 있습니다. 금융 정보처럼 민감한 내용은 `IntentAuthenticationPolicy`로 인증을 요구해야 합니다.
- **지역 제한:** EU에서는 현재 iOS·iPadOS·watchOS용 Siri AI를 쓸 수 없습니다. 한국어는 지원 언어에 포함돼 있습니다.
- **사용량 제한:** 서버 모델을 쓰는 기능에는 일일 사용 한도가 있고, 추가 사용은 앞으로 유료로 제공될 예정입니다.

## 결론

이번 프리뷰의 핵심은 앱의 기능을 화면뿐 아니라 **AI가 호출하는 도구**로도 설계해야 한다는 점입니다. 약관과 정책이 아직 나오지 않아 지금 출시 계획을 확정하기는 어렵지만, 내 앱에서 어떤 기능을 열지 고르고 설명을 다듬어 보는 정도는 지금 시작해 볼 만해 보입니다.

## 참고 자료

- [Apple Developer News, "Siri AI is now open to all developers" (2026-11-03)](https://developer.apple.com/news/)
- [Apple Developer Documentation, "Siri AI Developer Preview"](https://developer.apple.com/documentation/appintents/siri-ai-developer-preview)
- [Apple Developer Documentation, "Bringing custom actions and content to Siri"](https://developer.apple.com/documentation/appintents/bringing-custom-actions-and-content-to-siri)
- [Apple Developer Documentation, "Orchestrating complex actions with app skills"](https://developer.apple.com/documentation/appintents/orchestrating-complex-actions-with-app-skills)
