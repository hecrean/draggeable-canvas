import type {
  EventFromEventTag,
  PointerEventTag,
  TaggedEvent,
} from "./pannable.types";
import type { Action } from "./types";

const coordinates = <El extends HTMLElement>({
  element,
  event,
  tag,
}: TaggedEvent<PointerEventTag, El>) => {
  const rect = element.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  return {
    ndc: {
      x: (x / rect.width) * 2 - 1,
      y: (y / rect.height) * -2 + 1,
    },
    pixel: {
      x: x,
      y: y,
    },
  };
};

const pointerDifference = <El extends HTMLElement>(
  pointer1: TaggedEvent<PointerEventTag, El>,
  pointer2: TaggedEvent<PointerEventTag, El>
) => {
  const pointer1Coords = coordinates(pointer1);
  const pointer2Coords = coordinates(pointer2);

  return {
    dt: pointer1.event.timeStamp - pointer2.event.timeStamp,
    dP_Normal: pointer1.event.pressure - pointer2.event.pressure,
    dP_Tangential:
      pointer1.event.tangentialPressure - pointer2.event.tangentialPressure,
    dA:
      pointer1.event.width * pointer1.event.height -
      pointer2.event.width * pointer2.event.height,
    dTiltX: pointer1.event.tiltX - pointer2.event.tiltX,
    dTiltY: pointer1.event.tiltY - pointer2.event.tiltY,
    dTwist: pointer1.event.twist - pointer2.event.twist,
    dx: pointer1Coords.ndc.x - pointer2Coords.ndc.x,
    dy: pointer1Coords.ndc.y - pointer2Coords.ndc.y,
  };
};
export type PointerDifference = ReturnType<typeof pointerDifference>;

const handlepanmoves = <El extends HTMLElement>(
  cache: Map<string, CacheEntry<El>>
) => {
  return Array.from(cache)
    .map(([key, value]) => value)
    .filter((arr) => arr.length >= 2)
    .map(
      (cacheEntry) =>
        new CustomEvent("panmove", {
          detail: pointerDifference(
            cacheEntry[cacheEntry.length - 2],
            cacheEntry[cacheEntry.length - 1]
          ),
        })
    );
};

type CacheEntry<El extends HTMLElement> = Array<
  TaggedEvent<PointerEventTag, El>
>;

const handleIncomingPointerEventsStream = <El extends HTMLElement>(
  cache: Map<string, CacheEntry<El>>,
  item: TaggedEvent<PointerEventTag, El>
): Map<string, CacheEntry<El>> => {
  switch (item.tag) {
    case "pointerdown":
      cache.set(`${item.event.pointerId}`, [item, item]);
      return cache;
    case "pointermove": {
      const cacheEntry = cache.get(`${item.event.pointerId}`);
      if (cacheEntry) {
        cache.set(`${item.event.pointerId}`, [...cacheEntry, item]);
      }
      return cache;
    }
    case "pointerup":
      cache.delete(`${item.event.pointerId}`);
      return cache;
    default:
      return cache;
  }
};

export const pannable: Action<{ xi: number; yi: number; zi: number }, void> = (
  node,
  { xi, yi, zi }
) => {
  let x: number = xi;
  let y: number = yi;
  let z: number = zi;

  const cache = new Map<string, CacheEntry<typeof node>>();

  function handle_pointerdown(event: EventFromEventTag<"pointerdown">) {
    const pointerdownEv: TaggedEvent<"pointerdown", typeof node> = {
      tag: "pointerdown",
      element: node,
      event: event,
    };
    const { ndc } = coordinates(pointerdownEv);

    handleIncomingPointerEventsStream(cache, pointerdownEv);

    node.dispatchEvent(
      new CustomEvent("panstart", {
        detail: { x: ndc.x, y: ndc.y },
      })
    );

    window.addEventListener("pointermove", handle_pointermove);
    window.addEventListener("pointerup", handle_pointerup);
  }

  function handle_pointermove(event: EventFromEventTag<"pointermove">) {
    const pointerMoveEv: TaggedEvent<"pointermove", typeof node> = {
      tag: "pointermove",
      element: node,
      event: event,
    };
    const { ndc } = coordinates(pointerMoveEv);
    x = ndc.x;
    y = ndc.y;

    handleIncomingPointerEventsStream(cache, pointerMoveEv);

    const panmoves = handlepanmoves(cache);

    panmoves.forEach((multipointerpanmove) =>
      node.dispatchEvent(multipointerpanmove)
    );
  }

  function handle_pointerup(event: EventFromEventTag<"pointerup">) {
    const pointerupEv: TaggedEvent<"pointerup", typeof node> = {
      tag: "pointerup",
      element: node,
      event: event,
    };
    const { ndc } = coordinates(pointerupEv);

    handleIncomingPointerEventsStream(cache, pointerupEv);

    node.dispatchEvent(
      new CustomEvent("panend", {
        detail: { x: ndc.x, y: ndc.y },
      })
    );

    window.removeEventListener("pointermove", handle_pointermove);
    window.removeEventListener("pointerup", handle_pointerup);
  }

  node.addEventListener("pointerdown", handle_pointerdown);

  return {
    destroy() {
      node.removeEventListener("pointerdown", handle_pointerdown);
    },
  };
};
