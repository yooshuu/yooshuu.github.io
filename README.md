# yooshuu 기술 블로그

새로 올라온 기술 소식과 달라진 점을 공식 자료로 정리하는 블로그입니다.

블로그: <https://yooshuu.github.io>

## 사이트 구성

### 기술 블로그

- AI 및 AI 에이전트
- Python, Java 등 프로그래밍 언어
- AWS 등 클라우드와 Kubernetes
- 빅데이터 및 데이터 엔지니어링
- 소프트웨어 보안

## 디자인 및 기술 구성

- **Jekyll** 기반 정적 사이트와 **GitHub Pages** 호스팅
- **GitHub Actions** 파이프라인을 통한 빌드·배포 자동화
- **Markdown**과 Git 기반의 콘텐츠 작성 및 버전 관리
- 콘텐츠 가독성에 집중한 1열 구조의 반응형 레이아웃
- `sitemap.xml`과 RSS 피드 자동 생성

## 주요 파일과 디렉터리

```text
.
├── _config.yml               # 사이트 정보와 Jekyll 설정
├── _layouts/
│   ├── default.html          # 공통 헤더, 본문, footer
│   └── post.html             # 게시글 화면
├── _includes/why.html        # 염소 캐릭터의 "왜?" 코너
├── _posts/                   # 게시글
├── _drafts/                  # 공개하지 않는 초안
├── _template-news.md         # 소식 글 템플릿
├── assets/
│   ├── css/style.css         # 전체 디자인
│   └── images/goat.webp      # 염소 캐릭터
├── docs/news-guide.md        # 소식 글 작성 기준
├── index.html                # 글 목록 첫 화면
├── 404.html                  # 없는 페이지 안내
├── Gemfile                   # Jekyll과 플러그인 목록
└── .github/workflows/        # 자동 배포
```

## 배포와 자동화

- `main` 브랜치에 push하면 GitHub Actions가 사이트를 빌드해 GitHub Pages로 배포합니다.
- 설정은 `.github/workflows/pages.yml`에 있습니다.

## 저장소 공개 범위와 보안

이 저장소에는 웹사이트에 공개할 수 있는 내용만 저장합니다. API 키, 비밀번호, 개인 자료 등 민감한 정보는 커밋하지 않습니다.

GitHub Free에서 GitHub Pages를 사용하기 위해 저장소를 공개 상태로 유지합니다.
