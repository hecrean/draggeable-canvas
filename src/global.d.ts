declare namespace svelte.JSX {
  import { PointerDifference } from "@/lib/pannable";

  interface HTMLAttributes<T> {
    onpanstart?: (e: CustomEvent<{ x: number; y: number }>) => void;
    // onpanmove?: (
    //   e: CustomEvent<{ x: number; y: number; dx: number; dy: number }>
    // ) => void;
    onpanend?: (e: CustomEvent<{ x: number; y: number }>) => void;
    onpanmove?: (e: CustomEvent<PointerDifference>) => void;
  }
}
