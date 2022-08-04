type PointerEventTag =
  | "pointercancel"
  | "pointerdown"
  | "pointerenter"
  | "pointerleave"
  | "pointermove"
  | "pointerout"
  | "pointerover"
  | "pointerup";

type EventTag = keyof HTMLElementEventMap;
type EventFromEventTag<K extends EventTag> = HTMLElementEventMap[K];

interface TaggedEvent<K extends EventTag, El extends HTMLElement> {
  tag: K;
  element: El;
  event: HTMLElementEventMap[K];
}

export type { PointerEventTag, EventTag, TaggedEvent, EventFromEventTag };
