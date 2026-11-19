---
title: "OpenJDK Base64 해독 취약점 Java4Shell, 영향 범위와 대응 방법"
date: 2026-11-20 06:00:00 +0900
description: "OpenJDK 17 이상의 Base64 해독 코드에서 원격 코드 실행으로 이어질 수 있는 취약점 CVE-2026-114938이 고쳐졌습니다. 영향을 받는 조건과 고친 버전, 업그레이드 전 임시 대응, Kafka 같은 Java 서비스의 안내를 정리합니다."
tags: [Java, OpenJDK, Kafka, 보안]
ai_assisted: true
---

OpenJDK 취약점 그룹은 2026년 11월 17일 보안 권고에서 HotSpot 컴파일러 영역의 취약점 CVE-2026-114938을 고쳤다고 밝혔습니다. "Java4Shell"로 불리는 이 취약점은 x86-64 CPU에서 Base64 문자열을 해독하는 코드에 있습니다. 11월 18일과 19일에는 Eclipse Adoptium, AWS, Apache Kafka가 잇따라 고친 버전과 임시 대응 방법을 공개했습니다.

<div class="summary" markdown="1">
**한눈에 보기**

- OpenJDK 권고에 따르면 CVE-2026-114938의 CVSS 3.1 점수는 8.1이고, Java 17, 21, 25, 27에 영향을 줍니다. Java 8과 11은 영향이 없습니다.
- AVX-512 VBMI를 지원하는 x86-64 CPU에서만 문제가 되며, ARM64 서버는 영향이 없습니다.
- 고친 버전은 17.0.21.1, 21.0.13.1, 25.0.5.1, 27.0.1.1입니다. 바로 올릴 수 없다면 JVM 옵션 `-XX:-UseBASE64Intrinsics`로 문제의 코드 경로를 끌 수 있습니다.
</div>

{% include why.html q="Java는 왜 Base64 해독에 CPU 전용 명령어를 쓸까?" a="Apache Kafka 블로그에 따르면 OpenJDK는 x86-64 CPU에서 Base64 해독을 빠르게 하려고 AVX-512 VBMI 명령어를 쓰는 인트린직(intrinsic)을 씁니다. 이번 취약점은 바로 이 코드에 있어서, 같은 Java 버전이라도 CPU가 AVX-512 VBMI를 지원할 때만 문제가 됩니다." %}

## 1. 어떤 취약점인가

AWS 보안 공지에 따르면 이 취약점은 OpenJDK 17.0.6 이후 버전의 Base64 해독 인트린직에 있는 메모리 문제입니다. 신뢰할 수 없는 데이터를 Base64로 해독하는 애플리케이션에 공격자가 조작한 입력을 보내면, 특정 조건에서 메모리 범위를 벗어난 쓰기가 일어날 수 있습니다. 이 공격에는 인증이 필요하지 않습니다. Adoptium은 인증 없는 원격 공격자가 임의 코드를 실행할 수 있는 메모리 손상 취약점이라고 설명합니다.

영향을 받는 CPU는 AVX-512 VBMI를 지원하는 x86-64 프로세서입니다. AWS는 Intel Ice Lake 이후, AMD Zen 4 이후 프로세서를 예로 들었습니다. AWS Graviton 같은 ARM64 환경은 영향이 없습니다. AWS는 이 취약점이 실제 공격에 쓰였다는 증거는 없다고 밝혔습니다.

점수는 공지마다 다릅니다.

| 출처 | 점수 |
| --- | --- |
| OpenJDK 취약점 권고 | CVSS 3.1 기준 8.1 |
| Amazon Linux | CVSS v3 기준 8.8, 등급 Important |

## 2. 영향받는 버전과 고친 버전

Kafka 블로그는 Java 버전별로 영향 범위와 고친 버전을 정리했습니다.

| Java | 영향받는 버전 | 고친 버전 |
| --- | --- | --- |
| 17 | 17.0.6 ~ 17.0.21 | 17.0.21.1 |
| 21 | 21 ~ 21.0.13 | 21.0.13.1 |
| 25 | 25 ~ 25.0.5 | 25.0.5.1 |
| 27 | 27 ~ 27.0.1 | 27.0.1.1 |
| 18~20, 22~24, 26 | 모든 버전 | 업데이트가 끝나 고친 버전 없음 |

JDK 배포판마다 버전 표기가 조금씩 다릅니다. Amazon Corretto는 27.0.1.1.4, 25.0.5.1.2, 21.0.13.1.2, 17.0.21.1.2에서 고쳤고, Amazon Linux 2와 2023용 패키지도 나와 있습니다. Eclipse Temurin은 27.0.1.1+4, 25.0.5.1+2, 21.0.13.1+2, 17.0.21.1+2에 수정을 담았습니다. Adoptium에 따르면 Temurin 바이너리는 테스트가 끝나는 대로 차례로 공개되고, Docker Hub 이미지는 한 버전의 바이너리가 모두 나온 뒤에 올라옵니다.

업데이트가 끝난 18~20, 22~24, 26을 쓰고 있다면 Kafka 블로그는 지원이 이어지는 LTS 버전으로 옮기라고 안내합니다.

## 3. 올리기 전까지 쓸 수 있는 임시 대응

Adoptium과 AWS, Kafka 모두 고친 버전으로 올리는 것을 근본 대책으로 꼽습니다. 바로 올릴 수 없다면 JVM 시작 옵션에 `-XX:-UseBASE64Intrinsics`를 넣어 Base64 인트린직을 끌 수 있습니다.

이 옵션을 쓸 때 주의할 점은 다음과 같습니다.

- Kafka 블로그에 따르면 이 옵션은 Java 11 이상에만 있습니다. Java 8은 이 옵션을 몰라서 시작하지 못하므로, 영향도 없는 Java 8에는 넣지 않습니다.
- `-XX:UseAVX=2`도 문제의 코드를 피하지만, AVX-512 전체를 끄고 ARM의 JVM은 이 옵션 때문에 시작하지 못합니다. `-XX:-UseBASE64Intrinsics`는 두 아키텍처에서 모두 동작합니다.
- AWS Lambda의 ZIP 패키지 함수라면 함수 설정의 `JAVA_TOOL_OPTIONS`에 이 옵션을 넣습니다.

AWS는 AWS WAF의 KnownBadInputs 관리형 규칙 그룹 1.28에 잘못된 Base64 입력을 막는 규칙을 추가했습니다. AWS는 이 규칙이 일부만 막아 주며, 패치만이 완전한 해결책이라고 덧붙였습니다.

## 4. Kafka와 AWS 서비스의 안내

Apache Kafka는 이 취약점이 Kafka가 아니라 JDK에 있어서 Kafka 자체는 업그레이드나 코드 변경이 필요 없다고 밝혔습니다. 브로커, 컨트롤러, Kafka Connect 워커, Kafka Streams 애플리케이션, 클라이언트 모두 영향받는 Java 버전과 CPU 조건이 겹치면 대상이 됩니다. 브로커와 Connect 워커는 `KAFKA_OPTS` 환경 변수로 옵션을 넘깁니다.

```bash
export KAFKA_OPTS="-XX:-UseBASE64Intrinsics"
bin/kafka-server-start.sh config/server.properties
```

이미 `KAFKA_OPTS`에 JAAS 파일 경로 같은 값을 쓰고 있다면 덮어쓰지 말고 뒤에 덧붙여야 합니다. 공식 `apache/kafka` Docker 이미지는 지금까지 나온 모든 태그에 영향받는 Temurin JRE가 들어 있고, 고친 JRE는 앞으로 나올 이미지에 담길 예정입니다. GraalVM 네이티브 실행 파일로 된 `apache/kafka-native` 이미지는 HotSpot JVM을 쓰지 않아 영향이 없습니다.

AWS 공지에 따르면 Lambda 기본 실행 환경은 영향이 없지만, Lambda Managed Instances는 영향을 받을 수 있습니다. x86-64 기반 EC2와 Fargate 작업은 고객이 직접 JDK를 올려야 합니다. OpenSearch Service의 x86-64 도메인 중 2.7 이상 버전은 AWS가 블루/그린 배포로 완화 조치를 적용하고 있습니다.

## 참고 자료

- [OpenJDK Vulnerability Advisory: 2026/11/17](https://openjdk.org/groups/vulnerability/advisories/2026-11-17)
- [Eclipse Adoptium, "Eclipse Temurin guidance for CVE-2026-114938 "java4shell"" (2026-11-18)](https://adoptium.net/news/2026/11/temurin-november-2026-cspu-java4shell)
- [AWS 보안 공지 2026-189-AWS, CVE-2026-114938 (2026-11-18)](https://aws.amazon.com/security/security-bulletins/2026-189-aws/)
- [Apache Kafka 블로그, "Mitigating CVE-2026-114938 ("Java4Shell") in Apache Kafka deployments" (2026-11-19)](https://kafka.apache.org/blog/2026/11/19/mitigating-cve-2026-114938-java4shell-in-apache-kafka-deployments/)
