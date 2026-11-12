---
title: "AWS, 계정 없이 로컬에서 AWS API를 흉내 내는 AWS Emulator 공개"
date: 2026-11-13 06:00:00 +0900
description: "AWS가 내 컴퓨터나 CI에서 AWS SDK와 CLI 호출을 받아 주는 로컬 에뮬레이터 AWS Emulator를 공개했습니다. 동작 방식과 연결 방법, 실제 AWS와 얼마나 같은지 재는 기준, 제약을 정리합니다."
tags: [AWS, AWS Emulator, 테스트]
ai_assisted: true
---

AWS를 쓰는 코드를 테스트하려면 지금까지는 실제 계정에 리소스를 만들거나, 직접 만든 목(mock)으로 응답을 흉내 내야 했습니다. AWS는 2026년 11월 11일 **AWS Emulator**를 공개했습니다. 내 컴퓨터나 CI 환경에서 AWS SDK와 CLI 호출을 받아 실제 AWS처럼 응답하는 로컬 프로그램으로, AWS 계정이 필요 없고 별도 서비스 요금도 없습니다.

<div class="summary" markdown="1">
**한눈에 보기**

- 기존 AWS SDK·CLI 코드를 그대로 둔 채 환경 변수만 바꾸면 요청이 AWS 대신 에뮬레이터로 갑니다.
- 리소스는 메모리에만 저장되고, 에뮬레이터를 끄면 모두 사라집니다.
- 서비스별로 실제 AWS와 얼마나 같은지를 "충실도 점수"로 공개하며, 아직 구현하지 않은 API는 HTTP 501을 돌려줍니다.
</div>

{% include why.html q="실제 AWS나 직접 만든 목 대신 로컬 에뮬레이터로 테스트하는 이유는 무엇일까?" a="AWS에 따르면 직접 만든 목은 시간이 지나며 실제 AWS 동작과 어긋날 수 있습니다. 에뮬레이터는 올바른 호출에는 AWS와 같은 결과를, 잘못된 호출에는 같은 오류를 돌려주고 호출 사이의 상태도 유지합니다. 계정에 닿지 않으므로 CI에서 브랜치마다 계정이나 저장된 자격 증명을 둘 필요가 없고, AI 코딩 에이전트도 실제 계정을 건드리지 않고 리소스를 만들어 보며 오류를 고칠 수 있다는 것이 AWS의 설명입니다." %}

## 1. 서버 모드와 임베디드 모드

AWS Emulator는 화면 없이 AWS API 엔드포인트 하나를 제공하는 프로그램이며, Rust로 작성되었습니다. 실행 방식은 두 가지입니다.

| 방식 | 설명 |
| --- | --- |
| 서버 모드 | Linux에서는 x86_64·aarch64용 RPM 또는 Debian 패키지를 설치하고 `aws-emulator` 명령으로 실행합니다. macOS와 Windows에서는 AWS가 제공하는 Dockerfile로 이미지를 만들어 컨테이너로 실행합니다. |
| 임베디드 모드 | AWS SDK for Rust로 쓴 테스트 안에서 에뮬레이터를 직접 띄웁니다. 테스트마다 독립된 인스턴스가 생기고, 엔드포인트나 인증서를 설정할 필요가 없습니다. |

서버 모드의 기본 주소는 `https://127.0.0.1:9297`이고 내 컴퓨터에서만 접근할 수 있습니다. `-p` 옵션으로 포트를 바꾸면 여러 에뮬레이터를 나란히 띄울 수 있으며, 각 에뮬레이터는 자기 포트와 키, 메모리 상태를 따로 가집니다. 대기 상태에서 쓰는 메모리는 약 160MiB입니다.

## 2. SDK와 CLI를 에뮬레이터에 연결하기

에뮬레이터는 시작할 때마다 새 액세스 키와 SDK용 `config` 파일, 자체 서명 인증서를 `~/.aws/emulator/<포트>/` 폴더에 만듭니다. 사용자 가이드가 안내하는 주요 환경 변수는 다음과 같습니다.

```bash
export AWS_ENDPOINT_URL=https://127.0.0.1:9297
export AWS_SHARED_CREDENTIALS_FILE=~/.aws/emulator/9297/emulator_credentials
export AWS_CONFIG_FILE=~/.aws/emulator/9297/config
export AWS_CA_BUNDLE=~/.aws/emulator/9297/ca.pem
export AWS_EC2_METADATA_DISABLED=true
export AWS_DISABLE_HOST_PREFIX_INJECTION=true
export AWS_REGION=us-east-1
```

`AWS_ACCESS_KEY_ID` 같은 실제 자격 증명 변수는 지워야 합니다. 환경 변수가 자격 증명 파일보다 우선하기 때문에, 남아 있으면 SDK가 실제 키로 서명하고 에뮬레이터는 그 요청을 거부합니다. 연결이 맞는지는 `aws sts get-caller-identity`로 확인하며, 계정이 `000000000000`으로 나오면 에뮬레이터에 닿은 것입니다.

인증서를 읽는 방법은 SDK마다 다릅니다. AWS CLI, Boto3, Go SDK는 `AWS_CA_BUNDLE`을 읽고, Node.js는 `NODE_EXTRA_CA_CERTS`, Rust와 .NET은 `SSL_CERT_FILE`을 씁니다. Java는 `ca.pem` 대신 함께 생성되는 `truststore.p12`를 `JAVA_TOOL_OPTIONS`로 지정합니다.

S3 요청은 주소를 `127.0.0.1`로 유지해야 버킷 이름이 경로에 들어가 에뮬레이터에 도착합니다. S3 Control 요청은 SDK가 호스트 이름에 계정 ID를 넣어 보내므로 에뮬레이터에 닿지 않습니다.

## 3. 충실도 점수로 보는 지원 범위

AWS Emulator는 AWS가 SDK용으로 공개하는 API 모델을 바탕으로 서비스를 만듭니다. 실제 AWS와 얼마나 같은지는 **충실도(fidelity)**라는 이름으로 측정합니다.

- **충실도 테스트:** SDK로 하나의 작업 흐름을 실행해 결과, 이후 상태, 잘못된 호출의 정확한 오류까지 AWS와 같은지 확인하는 짧은 프로그램입니다. 미국 서부(오리건) 리전에서 만들고 검증하며, 전역 서비스는 미국 동부(버지니아 북부)에서 검증합니다.
- **충실도 점수:** 서비스별로 통과한 테스트 수를 전체 테스트 수와 함께 "50개 중 40개"처럼 표시하며, 릴리스마다 GitHub 릴리스 페이지에 공개합니다.

테스트는 아직 통과하지 못한 것까지 aws-emulator-evaluation-suite 저장소에 공개되어 있습니다. AWS에 따르면 현재는 리소스를 만들고 조회하는 제어 영역 API에서 가장 정확하며, 데이터 영역 API와 CloudFormation·Terraform·AWS CDK 지원 수준은 서비스마다 다릅니다.

`aws-emulator` 스킬을 AI 코딩 에이전트에 설치하면 에이전트가 에뮬레이터를 설치하고 연결하며, 프로젝트가 의존하는 API를 충실도 테스트와 대조해 줍니다. 설치에는 AWS CLI 2.35.0 이상이 필요합니다.

## 4. 공개 시점의 제약

공식 문서가 밝힌 주요 제약은 다음과 같습니다.

- IAM 정책과 리소스 기반 정책을 AWS처럼 평가하지 않으므로 보안 테스트에는 쓰지 않습니다.
- 리전과 계정별로 리소스를 나누지 않습니다. 여러 리전을 테스트하려면 리전마다 에뮬레이터를 따로 띄웁니다.
- 장시간 실행이나 부하 테스트는 검증되지 않았습니다.
- 텔레메트리가 기본으로 켜져 있으며 `--telemetry off`나 `EMULATOR_TELEMETRY=off`로 끌 수 있습니다.

소스 코드는 CC0 1.0으로 GitHub에 공개되었고, 저장소는 PR을 받지 않으며 오류 보고는 이슈로 받습니다. AWS는 이번 출시를 "now available"이라고만 표현했고 정식 출시(GA)인지 프리뷰인지는 따로 밝히지 않았습니다.

## 참고 자료

- [AWS What's New, "AWS Emulator is now available for building and testing AWS applications locally" (2026-11-11)](https://aws.amazon.com/about-aws/whats-new/2026/11/aws-emulator-now-available/)
- [AWS Emulator 제품 페이지](https://aws.amazon.com/products/developer-tools/emulator/)
- [AWS Emulator User Guide, What is AWS Emulator?](https://docs.aws.amazon.com/emulator/latest/userguide/what-is-service.html)
- [AWS Emulator User Guide, Pointing your AWS SDK at AWS Emulator](https://docs.aws.amazon.com/emulator/latest/userguide/point-sdk-to-emulator.html)
- [AWS Emulator User Guide, Getting started on Linux](https://docs.aws.amazon.com/emulator/latest/userguide/getting-started-linux.html)
- [AWS Emulator User Guide, Fidelity in AWS Emulator](https://docs.aws.amazon.com/emulator/latest/userguide/fidelity.html)
- [AWS Emulator User Guide, Getting started with an AI coding agent](https://docs.aws.amazon.com/emulator/latest/userguide/getting-started-agent.html)
- [GitHub, aws/aws-emulator](https://github.com/aws/aws-emulator)
