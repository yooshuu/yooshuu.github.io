---
title: "Kubernetes, kube-proxy IPVS 모드를 1.40부터 기본으로 끄고 없애는 일정 공개"
date: 2026-11-18 06:00:00 +0900
description: "Kubernetes SIG Network가 kube-proxy의 ipvs 백엔드를 없애는 일정을 밝혔습니다. 폐기 이유와 버전별 단계, nftables나 iptables로 옮기는 방법을 정리합니다."
tags: [Kubernetes, kube-proxy, nftables]
ai_assisted: true
---

kube-proxy는 Kubernetes 노드마다 돌면서 Service로 들어온 트래픽을 실제 파드로 보내 주는 구성 요소입니다. Kubernetes 블로그는 2026년 11월 16일 kube-proxy의 `ipvs` 백엔드를 없애는 일정을 공개했습니다. 1.35에서 폐기 예정(deprecated)이 된 이 모드는 지금도 경고와 함께 쓸 수 있지만, SIG Network는 1.40에서 이를 없애겠다고 밝히고 모든 `ipvs` 사용자에게 `nftables`나 `iptables`로 옮길 준비를 하라고 안내합니다.

<div class="summary" markdown="1">
**한눈에 보기**

- `ipvs` 모드는 1.35부터 폐기 예정이고, 1.37에 `KubeProxyIPVS` 기능 게이트가 생겼습니다. 이 게이트는 1.40에서 기본값이 꺼집니다.
- KEP-5495에 따르면 1.43에서 IPVS 코드가 저장소에서 빠지고, 1.46에서 기능 게이트까지 사라집니다.
- 1.36 이상, 리눅스 커널 5.13 이상이면 `nftables` 모드로 옮기기를 권하며, 설정의 `mode` 값을 바꾸고 kube-proxy를 다시 시작하면 됩니다.
</div>

{% include why.html q="성능이 좋다던 IPVS 모드를 Kubernetes는 왜 없애려고 할까?" a="Kubernetes 블로그에 따르면 커널의 IPVS API는 Kubernetes Service API와 잘 맞지 않아, `ipvs` 백엔드는 Service의 세세한 경우를 끝내 모두 올바르게 구현하지 못했습니다. 다른 두 백엔드와 구조가 크게 달라 유지 보수 부담도 컸습니다. 1.29에 나온 `nftables` 백엔드는 처음부터 `iptables`와 `ipvs`를 모두 대신하려는 계획으로 만들어졌고, 1.33에서 정식(GA)이 되었습니다." %}

## 1. IPVS 백엔드가 생긴 이유와 한계

블로그는 `ipvs` 백엔드가 예전 `iptables` 백엔드의 두 가지 성능 문제를 풀려고 만들어졌다고 설명합니다.

| 문제 | iptables의 상황 | ipvs의 해결 방식 |
| --- | --- | --- |
| 데이터 플레인 지연 | Service IP마다 규칙을 따로 써서, 새 연결이 규칙 목록을 처음부터 차례로 훑어야 했습니다. | 커널 IPVS가 해시 테이블로 찾습니다. |
| 컨트롤 플레인 지연 | Service나 엔드포인트가 하나만 바뀌어도 전체 규칙을 다시 썼습니다. 아주 큰 클러스터에서는 CPU 한 개를 늘 100% 썼습니다. | 바뀐 부분만 고칩니다. |

클러스터가 커지면서 `ipvs` 백엔드 자체의 확장 문제도 드러났습니다. IPVS API에는 한꺼번에 고치는 일괄 갱신 기능이 없어서, 변경이 적을 때는 `iptables`보다 빨라도 변경이 많을 때는 오히려 느려질 수 있었습니다. IPVS API로 할 수 있는 일이 제한적이라, Service의 여러 기능은 결국 `iptables`로 처리해야 했습니다. 이 구조 때문에 `ipvs` 모드는 `iptables` 모드의 확장 문제 일부를 그대로 안게 되었습니다. Red Hat은 RHEL에서 iptables API를 완전히 없앨 계획이어서, `iptables`에 기대는 `ipvs` 모드도 RHEL에서는 쓸 수 없게 됩니다.

IPVS의 여러 스케줄러를 고를 수 있다는 점도 기대만큼 쓸모가 없었습니다. kube-proxy는 노드마다 따로 돌고, 노드끼리 스케줄러 상태를 나누지 않습니다. 블로그에 따르면 그래서 분산 환경용 스케줄러도 kube-proxy 안에서는 무작위 선택보다 나은 결과를 내지 못합니다. Maglev Hashing을 쓰는 `mh` 스케줄러 역시 특정한 2계층 부하 분산 구조에서만 효율이 나는데, kube-proxy는 그 어느 계층도 맡을 수 없는 구조입니다.

## 2. 버전별 제거 단계

블로그는 1.40을 제거 시점으로 밝혔고, 세부 단계는 KEP-5495에 정리되어 있습니다.

| 버전 | 내용 | 상태 |
| --- | --- | --- |
| 1.35 | 문서에 폐기 예정을 알리고, `ipvs` 모드로 켜면 경고를 남깁니다. | 완료 |
| 1.37 | `KubeProxyIPVS` 기능 게이트를 추가했습니다. 기본값은 켜짐입니다. | 완료 |
| 1.40 | 기능 게이트 기본값을 끔으로 바꿉니다. | 예정 |
| 1.43 | 기능 게이트를 기본값에 고정하고 `pkg/proxy/ipvs` 코드를 지웁니다. | 예정 |
| 1.46 | 기능 게이트 자체를 지웁니다. | 예정 |

Kubernetes 기능 게이트 문서에도 `KubeProxyIPVS`가 1.37부터 기본값 `true`, 단계 `Deprecated`로 올라 있습니다. KEP에 따르면 1.40부터는 기능 게이트를 따로 켜지 않고 `ipvs` 모드로 kube-proxy를 시작하면, kube-proxy가 쓸 수 있는 모드인 `iptables`와 `nftables`를 알려 주며 오류로 종료합니다.

SIG Network는 IPVS 코드를 별도 저장소로 옮기는 방안도 검토했습니다. KEP는 그 저장소를 관리하거나 보안 수정을 할 계획이 없어서, 저장소를 만들자마자 보관 처리하는 것과 다르지 않다고 적었습니다. 결국 코드는 다른 곳으로 옮기지 않고 그대로 지웁니다. KEP는 kube-proxy의 `nftables` 모드를 쓰기에 너무 오래된 커널이 2026년 말이면 모두 LTS 지원 기간을 벗어난다는 점도 근거로 들었습니다.

## 3. nftables로 옮기기

블로그는 다음 조건을 모두 갖췄다면 `nftables` 모드로 옮기라고 권합니다.

- Kubernetes 1.36 이상
- 노드의 리눅스 커널 5.13 이상
- 현재 `ipvs` 프록시 모드 사용

`nftables` 백엔드는 1.33부터 GA이지만, 1.36보다 앞선 버전에는 성능과 확장 관련 수정 일부가 백포트되지 않았습니다. 블로그는 `nftables` 백엔드가 완전히 지원되고 기능도 빠짐없이 갖췄으며, 성능도 `ipvs`보다 아주 조금 낫다고 밝힙니다. 함께 실린 연결 지연 그래프는 `nftables`가 눈에 띄게 빠르다는 뜻이 아니라, `iptables`와 달리 `ipvs`보다 느리지 않다는 점을 보여 준다고 덧붙였습니다.

옮기는 방법은 kube-proxy 설정을 바꾸고 다시 시작하는 것입니다. kubeadm으로 만든 클러스터라면 kube-proxy ConfigMap의 `mode: ipvs`를 `mode: nftables`로 고치고 kube-proxy 파드를 재시작합니다. 다른 `ipvs` 전용 설정을 덮어쓰고 있었다면, 그 옵션도 대응하는 `nftables` 옵션으로 바꿔야 합니다.

## 4. iptables로 옮기기

Kubernetes 버전이나 리눅스 배포판이 오래되어 `nftables`를 쓸 수 없다면 `iptables` 모드가 대안입니다. 블로그에 따르면 `iptables` 백엔드는 2017년 `ipvs` 백엔드가 처음 나온 뒤 크게 나아졌습니다.

- 중복되거나 필요 없는 규칙을 빼서 데이터 플레인 지연을 줄였습니다.
- 규칙을 만드는 코드의 메모리 할당과 중복 계산을 줄여, 재동기화 때 CPU와 메모리 사용을 낮췄습니다.
- 현재 규칙을 먼저 읽지 않고 새 상태로 바로 갱신한 뒤, 실패할 때만 현재 상태를 확인합니다. 큰 클러스터에서는 규칙을 읽는 일 자체가 매우 느리기 때문입니다.
- KEP-3453에 따라 지난 동기화 이후 바뀐 Service와 엔드포인트의 규칙만 갱신합니다.

블로그는 2026년의 `iptables` 백엔드가 `ipvs`만큼은 아니어도 2017년보다 훨씬 나아졌다고 설명합니다. `iptables`로 옮길 때도 kube-proxy 설정을 바꾸면 되지만, 이 경우에는 kube-proxy만 재시작하지 말고 설정을 바꾼 뒤 노드를 하나씩 재부팅하라고 권합니다.

## 참고 자료

- [Kubernetes 블로그, "Scheduling the removal of the kube-proxy IPVS backend" (2026-11-16)](https://kubernetes.io/blog/2026/11/16/ipvs-removal/)
- [KEP-5495, "Deprecate ipvs mode in kube-proxy"](https://github.com/kubernetes/enhancements/blob/master/keps/sig-network/5495-deprecate-ipvs-mode-in-kube-proxy/README.md)
- [Kubernetes 문서, Feature Gates](https://kubernetes.io/docs/reference/command-line-tools-reference/feature-gates/)
