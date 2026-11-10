---
title: "GitHub, 1년간 활동 없는 저장소의 Dependabot 알림을 12월 8일부터 끈다"
date: 2026-11-11 06:00:00 +0900
description: "GitHub가 2026년 12월 8일부터 지난 1년 동안 활동이 없는 저장소 대부분에서 Dependabot 알림을 끄기로 했습니다. 활동으로 치는 기준과 다시 켜는 방법, 예외 조건을 정리합니다."
tags: [GitHub, Dependabot, 보안]
ai_assisted: true
---

오래 손대지 않은 저장소에도 지금까지는 Dependabot 알림이 계속 쌓였습니다. GitHub는 2026년 11월 10일 변경 이력에서 **2026년 12월 8일부터 지난 1년 동안 활동이 없는 저장소 대부분의 Dependabot 알림을 끈다**고 알렸습니다. 꺼진 저장소의 기존 알림은 지워지지 않고 보관되며, 언제든 되살릴 수 있습니다.

<div class="summary" markdown="1">
**한눈에 보기**

- 2026년 12월 8일부터 1년간 활동이 없는 저장소 대부분에서 Dependabot 알림이 꺼집니다. 지금은 예고 단계입니다.
- 저장소에 push하면 알림이 자동으로 다시 켜지고, 보관된 알림도 돌아옵니다.
- 보안 구성을 강제 적용한 저장소와 엔터프라이즈 정책으로 알림 설정을 묶어 둔 저장소는 대상에서 빠집니다.
</div>

{% include why.html q="GitHub는 왜 쓰지 않는 저장소의 보안 알림을 끄기로 했을까?" a="GitHub에 따르면 취약점 발견 건수와 알림 양이 빠르게 늘고 있습니다. 활동 없는 저장소의 알림을 멈추면 실제로 개발 중인 저장소에서 Dependabot이 빠르고 안정적으로 동작하도록 유지할 수 있다는 것이 GitHub의 설명입니다." %}

## 1. Dependabot 알림이 만들어지는 방식

Dependabot 알림은 저장소가 의존하는 패키지에 알려진 취약점이 있을 때 이를 알려 주는 기능입니다. GitHub 문서에 따르면 Dependabot은 저장소 기본 브랜치의 의존성을 GitHub Advisory Database와 비교하고, GitHub가 검토한 권고에 해당하는 의존성을 찾으면 알림을 만듭니다.

알림이 새로 생기는 시점은 두 가지입니다.

- GitHub Advisory Database에 새 취약점이 추가될 때
- 커밋으로 패키지나 버전이 바뀌어 의존성 그래프가 달라질 때

이 중 첫 번째 경우는 저장소에 아무 변화가 없어도 알림을 만듭니다. 코드를 1년 넘게 건드리지 않은 저장소에도 새 권고가 나올 때마다 알림이 생겨 온 이유입니다. 이렇게 만들어진 알림은 저장소의 Security and quality 탭과 의존성 그래프에 표시되고, 영향받는 파일과 심각도, 고친 버전이 있으면 그 버전까지 함께 보여 줍니다. 보관(archive) 처리된 저장소는 원래부터 검사 대상이 아닙니다.

## 2. 무엇이 활동으로 인정되는가

이번 변경에서 기준이 되는 것은 **지난 1년 동안의 활동**입니다. GitHub는 다음 세 가지를 활동으로 봅니다.

| 활동 | 설명 |
| --- | --- |
| push | 어느 브랜치나 태그에 push해도 활동으로 봅니다. |
| 저장소 생성 | 저장소를 만든 것도 활동에 포함됩니다. |
| 알림 켜기 | Dependabot 알림을 켠 것도 활동으로 칩니다. |

이 세 가지가 모두 1년 넘게 없었던 저장소가 12월 8일부터 알림이 꺼지는 대상입니다. 변경 이력은 "대부분의 저장소"라고 표현하는데, 아래에서 다룰 예외 조건에 해당하지 않는 저장소를 가리킵니다.

알림이 꺼진 저장소의 기존 알림은 삭제되지 않고 보관됩니다. GitHub 엔터프라이즈 클라우드의 데이터 레지던시 고객이라면, 보관된 알림은 엔터프라이즈의 다른 데이터와 같은 지역에 저장됩니다.

## 3. 알림을 다시 켜는 방법

꺼진 알림을 되살리는 방법은 두 가지입니다. 첫째는 저장소에 push하는 것으로, 이 경우 알림이 자동으로 다시 켜집니다. 둘째는 저장소 설정에서 직접 켜는 것입니다. GitHub 문서가 안내하는 순서는 다음과 같습니다.

1. 저장소 메인 페이지에서 **Settings**를 누릅니다.
2. 사이드바의 "Security and quality" 항목에서 **Advanced Security**를 엽니다.
3. Dependabot alerts 오른쪽의 **Enable**을 누릅니다.

어느 방법을 쓰든 GitHub가 보관해 둔 알림을 복원하고, 1년을 세는 기준도 처음부터 다시 시작합니다.

## 4. 대상에서 빠지는 저장소와 적용 범위

활동이 없더라도 알림이 계속 유지되는 경우가 두 가지 있습니다.

- **보안 구성을 강제 적용한 저장소:** 조직이 Dependabot 알림을 켜는 보안 구성(security configuration)을 만들고 "Enforce configuration"을 적용했다면 알림이 꺼지지 않습니다. GitHub 문서에 따르면 강제 적용은 구성에서 켜거나 끈 기능을 저장소 소유자가 바꾸지 못하게 막는 설정입니다.
- **엔터프라이즈 정책으로 묶인 저장소:** 엔터프라이즈의 Dependabot 알림 정책이 저장소 관리자가 알림을 켜거나 끄지 못하도록 설정되어 있으면 해당 저장소도 제외됩니다. 이 정책은 엔터프라이즈의 **Policies** → **Advanced Security**에 있는 "Enable or disable Dependabot alerts by repository admins" 항목에서 정합니다.

적용 범위는 다음과 같습니다.

| 환경 | 적용 여부 |
| --- | --- |
| github.com의 모든 요금제 | 적용 |
| 데이터 레지던시를 쓰는 GitHub Enterprise Cloud | 적용 |
| GitHub Enterprise Server | 적용하지 않음 |

이 변경은 2026년 12월 8일부터 시행될 예정이며, 11월 10일 현재는 예고만 나온 상태입니다.

## 참고 자료

- [GitHub Changelog, "Dependabot alerts will pause on inactive repositories" (2026-11-10)](https://github.blog/changelog/2026-11-10-dependabot-alerts-will-pause-on-inactive-repositories)
- [GitHub Docs, About Dependabot alerts](https://docs.github.com/en/code-security/dependabot/dependabot-alerts/about-dependabot-alerts)
- [GitHub Docs, Configuring Dependabot alerts](https://docs.github.com/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/configure-dependabot-alerts)
- [GitHub Docs, Creating a custom security configuration](https://docs.github.com/code-security/how-tos/secure-at-scale/configure-organization-security/establish-complete-coverage/create-custom-configuration)
- [GitHub Docs, Enforcing policies for code security and analysis for your enterprise](https://docs.github.com/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-code-security-and-analysis-for-your-enterprise)
