import { bronze, silver, gold } from "@/registry";

export const STAGES = ["dev", "prod"] as const;

export const BRONZE = {
  DATASETS: {
    events_raw: {
      description:
        "앱/웹 이벤트의 원천 로그. 스키마 변동이 잦아 테이블 생성/삭제 중심입니다.",
      actions: Object.keys(bronze.events_raw ?? {}),
    },
  } as const,
};

export const SILVER = {
  DATASETS: {
    events_clean: {
      description:
        "원시 이벤트를 검증/정제해 스키마/타입을 표준화한 중간 테이블입니다.",
      actions: Object.keys(silver.events_clean ?? {}),
    },
    int_signup_first: {
      description:
        "유저별 ‘최초’ 가입 시점을 고정해 보관하는 코호트 기준 테이블입니다.",
      actions: Object.keys(silver.int_signup_first ?? {}),
    },
    int_signup_daily: {
      description: "일자별 신규 가입자 유니크 목록 테이블입니다.",
      actions: Object.keys(silver.int_signup_daily ?? {}),
    },
    int_active_daily: {
      description:
        "session_start를 일자·유저 단위로 유니크 정규화한 테이블입니다. ",
      actions: Object.keys(silver.int_active_daily ?? {}),
    },
    int_first_session_after_signup: {
      description:
        "가입 이후 첫 세션의 발생일/시각을 user별로 고정해 보관하는 테이블입니다.",
      actions: Object.keys(silver.int_first_session_after_signup ?? {}),
    },
  } as const,
};

export const GOLD = {
  DATASETS: {
    fact_dau_daily: {
      description:
        "일별 활성 사용자(DAU) 집계 테이블입니다. event_date 기준으로 해당 일에 session_start를 1회 이상 발생시킨 고유 사용자 수를 저장합니다. (소스: silver.int_active_daily)",
      actions: Object.keys(gold.fact_dau_daily ?? {}),
    },
    fact_retension_daily: {
      description:
        "코호트 리텐션 집계 테이블입니다. cohort_date(가입일) 기준으로 day_n(가입 후 N일 차) 시점의 유지 사용자 수(retained_users)와 리텐션율(retention_rate=retained_users/cohort_size)을 저장합니다. 파티션 키는 metric_date입니다. (소스: silver.int_signup_first, silver.int_active_daily)",
      actions: Object.keys(gold.fact_retension_daily ?? {}),
    },
  },
};
