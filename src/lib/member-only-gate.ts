// 정회원 전용 액션 게이트 — 게스트가 좋아요/메시지/글쓰기 등을 시도할 때
// "정회원 공간입니다. 회원가입하시겠습니까?" 다이얼로그를 띄우기 위한 단일 진입점.
// (호스트 컴포넌트: components/member-only-dialog-host.tsx, layout.tsx 에 1회 마운트)

export const MEMBER_ONLY_EVENT = 'aura:member-only-gate';

export interface MemberOnlyGateDetail {
  /** 시도한 기능명 (예: '호감 보내기') — 다이얼로그 본문에 표기 */
  feature?: string;
}

export function openMemberOnlyDialog(feature?: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<MemberOnlyGateDetail>(MEMBER_ONLY_EVENT, { detail: { feature } })
  );
}
