---
title: "S3 Tables, Hive 테이블을 Iceberg로 옮겨 주는 관리형 이전 기능 공개"
date: 2026-11-08 01:00:00 +0900
description: "AWS가 S3 Tables에 Apache Hive 테이블을 Apache Iceberg 테이블로 옮겨 주는 관리형 이전 기능을 추가했습니다. 이전 순서와 CLI 사용법, 지원 범위를 정리합니다."
categories: [소식]
tags: [AWS, S3, Iceberg, 데이터엔지니어링]
ai_assisted: true
---

데이터 레이크에 쌓아 둔 Hive 테이블을 Apache Iceberg로 옮기는 일은 그동안 손이 많이 가는 작업이었습니다. 이전용 인프라를 만들고 데이터 형식을 바꾸는 것은 물론, 문제가 생기면 되돌릴 방법까지 직접 준비해야 했고, AWS에 따르면 이 과정에 몇 주가 걸리기도 했습니다.

이 번거로운 과정을 이제 AWS가 대신 맡아 줍니다. AWS는 2026년 11월 4일 Amazon S3 Tables에 **Hive 테이블을 Iceberg 테이블로 옮겨 주는 관리형 이전 기능**을 추가했습니다. 이 기능은 서비스를 멈추지 않고 검증부터 변환, 복사까지 진행하며, 필요하면 원본으로 되돌릴 수도 있습니다.

<div class="summary" markdown="1">
**한눈에 보기**

- AWS Glue에 등록된 Parquet 형식의 Hive 테이블을 Iceberg 테이블로 옮겨 줍니다.
- 이전하는 동안에도 원본에 계속 쓸 수 있고, 바뀐 부분만 여러 번 동기화할 수 있습니다.
- 옮긴 테이블은 Amazon Athena 등 Iceberg를 지원하는 도구에서 바로 조회할 수 있습니다.
</div>

{% include why.html q="그런데 왜 굳이 Iceberg로 옮길까?" a="AWS에 따르면 Iceberg는 데이터 레이크에 트랜잭션(ACID), 스키마 변경, 과거 시점 조회(time travel)를 더해 줍니다. 기존 Hive 테이블에서 이런 기능을 쓰려면 먼저 테이블을 Iceberg 형식으로 바꿔야 합니다." %}

## 1. Iceberg 테이블이 주는 기능

그렇다면 Iceberg로 옮기면 구체적으로 무엇을 할 수 있을까요? Apache Iceberg는 데이터 레이크에 저장된 대용량 데이터를 위한 오픈 테이블 형식으로, 공식 사이트에서는 주요 기능을 다음과 같이 소개합니다.

| 기능 | 설명 |
| --- | --- |
| 스키마 변경 | 테이블을 다시 쓰지 않고 열을 추가하거나 이름을 바꾸거나 순서를 바꿀 수 있습니다. |
| 숨은 파티셔닝 | 파티션 값을 엔진이 알아서 만들고, 필요 없는 파일은 건너뜁니다. 쿼리에 파티션 조건을 따로 적지 않아도 됩니다. |
| 과거 시점 조회 | 특정 스냅숏이나 시각 기준으로 테이블을 조회할 수 있습니다. |
| 롤백 | 문제가 생기면 테이블을 이전의 정상 상태로 되돌릴 수 있습니다. |
| 데이터 압축 정리 | 작은 파일을 합치거나 정렬해 파일 배치와 크기를 최적화합니다. |

여기에 더해 Spark, Trino, Flink, Hive 같은 여러 엔진이 같은 테이블을 동시에 안전하게 다룰 수 있다는 점도 Iceberg의 특징입니다. 결국 기존 Hive 테이블에서 이런 기능을 누리려면 형식 전환이 먼저인 셈인데, 이번 기능이 바로 그 부분을 해결해 줍니다.

## 2. 관리형 이전의 진행 순서

그럼 실제 이전은 어떻게 진행될까요? 과정은 **시작, 동기화, 완료**의 세 단계로 나뉩니다.

1. **시작:** S3 Tables가 원본 테이블을 검증하고 호환성 보고서를 만든 뒤 데이터 복사를 시작합니다. 이 단계에서 대상 테이블은 읽기 전용으로 유지됩니다.
2. **동기화:** 복사가 진행되는 동안에도 원본에는 계속 데이터를 쓸 수 있습니다. 그래서 동기화를 실행할 때마다 그사이 바뀐 부분만 대상 테이블로 옮기며, 필요한 만큼 여러 번 실행해도 됩니다.
3. **완료:** 준비가 끝나면 이전을 마무리합니다. 이때 원본 쓰기는 최종 전환 동안 몇 분만 멈추면 되고, 완료 후 대상 테이블은 읽기·쓰기 상태로 바뀝니다.

이렇게 데이터를 옮기는 동안 저장 방식도 함께 정리됩니다. Snappy로 압축된 테이블은 Zstandard로 다시 압축하고 파일을 합쳐 저장 공간과 객체 수를 줄여 줍니다. 원본 객체가 S3 Intelligent-Tiering에 있다면 지금의 접근 계층도 그대로 유지됩니다.

## 3. CLI와 AI 에이전트로 이전하기

이 세 단계는 콘솔에서 하나씩 진행해도 되고, AWS CLI나 API로 진행해도 됩니다. CLI를 쓴다면 설정 JSON 파일을 넘겨 이전을 시작합니다.

```bash
aws s3tables start-table-migration --cli-input-json file://start-migration.json
```

이때 넘기는 설정 파일에는 다음 항목이 들어갑니다.

- `roleARN`: 이전에 사용할 IAM 역할
- `sourceType`, `source`: 원본의 종류와 위치
- `destinationTable`: 대상 테이블
- `dataMigration`: 데이터 이전 방식
- `reviewMigrationPlan`: 이전 계획 검토 여부
- `migrationOutput`: 결과 출력

이전을 시작한 뒤 원본에서 바뀐 부분을 반영하고 싶다면 `sync-table-migration` 명령을 사용하면 됩니다.

명령어를 직접 입력하지 않는 방법도 있습니다. AWS는 이 작업을 위한 에이전트 스킬을 Agent Toolkit for AWS에 함께 공개했는데, AI 에이전트가 이전 과정을 스스로 진행하도록 만든 것입니다. 자세한 내용은 GitHub의 [agent-toolkit-for-aws 저장소](https://github.com/aws/agent-toolkit-for-aws/tree/main/skills/specialized-skills/analytics-skills/migrating-hive-tables-to-s3-tables)에서 확인할 수 있습니다.

## 4. 지원 범위와 제약

다만 모든 Hive 테이블을 바로 옮길 수 있는 것은 아닙니다. 출시 시점의 지원 범위는 다음과 같습니다.

| 항목 | 내용 |
| --- | --- |
| 원본 테이블 | AWS Glue에 등록된 Parquet 형식의 Hive 테이블 |
| 이전 범위 | 같은 AWS 계정, 같은 리전 안 |
| 출시 리전 | 미국(버지니아 북부, 오하이오, 오리건), 아시아 태평양(뭄바이, 싱가포르, 시드니, 도쿄), 유럽(프랑크푸르트, 아일랜드, 스톡홀름) |
| 조회 도구 | Amazon Athena, SageMaker Unified Studio, Iceberg REST API를 지원하는 도구 |

표에서 보듯 출시 리전에 서울은 아직 포함되지 않았습니다. 또 원본이 Parquet 형식이 아니거나 Glue에 등록되지 않은 Hive 테이블이라면, 이번 기능으로는 바로 옮길 수 없습니다.

## 참고 자료

- [AWS What's New, "Amazon S3 Tables now provide a simple, cost-effective path for data lake modernization" (2026-11-04)](https://aws.amazon.com/about-aws/whats-new/2026/11/amazon-s3-tables-managed-migration-hive-to-iceberg/)
- [AWS News Blog, "Amazon S3 Tables now offer managed migration of Apache Hive tables to Apache Iceberg"](https://aws.amazon.com/blogs/aws/amazon-s3-tables-now-offer-managed-migration-of-apache-hive-tables-to-apache-iceberg/)
- [Apache Iceberg 공식 사이트](https://iceberg.apache.org/)
