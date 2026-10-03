# 콘텐츠 DB (샘플)

`contents.json` 은 **샘플 데이터(39건)** 입니다. 운영자가 직접 검증한 자료로 교체해야 합니다(PRD F4-2).
특히 URL은 등록 전에 열어서 확인하세요. 목표 규모는 약 100~200개입니다.

## 필드
| 필드 | 설명 |
|---|---|
| id | 고유 ID |
| title | 제목 |
| author_source | 저자 또는 출처 |
| url | 원문 링크 (외부 링크로 열림) |
| type | `concept`(개념 이해) / `case`(실무 적용 사례) / `evidence`(논문·연구·책 등 근거 자료) |
| est_read_min | 예상 읽기 시간(분) |
| job_families | `design` / `pm` / `marketing` |
| topic_tags | 관련 학습 주제 태그 |
| difficulty | `입문` / `기본` / `심화` |

## 갱신
```
npm run import:contents -- path/to/contents.json   # 또는 .csv
```
CSV 헤더: `id,title,author_source,url,type,est_read_min,job_families,topic_tags,difficulty`
(`job_families`, `topic_tags` 는 `|` 로 구분)
