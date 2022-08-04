<script lang="ts">
  import { pannable, type PointerDifference } from "@/lib/pannable";
  import { createThreeApi, type Api } from "@/lib/three-api";
  import { onMount } from "svelte";
  import { spring } from "svelte/motion";

  const CAMERA_INITIAL_POSITION = { x: 0, y: 0, z: 8 };

  type EventWithTarget<Event, Target> = Event & { currentTarget: Target };

  let canvasProxyEl: HTMLDivElement;
  let canvasEl: HTMLCanvasElement;
  const api = createThreeApi();

  onMount(() => {
    //canvas observables
    api.init(canvasProxyEl, canvasEl, CAMERA_INITIAL_POSITION);

    //animation loop
    const loop = () => {
      if (api) api.render(api.state());
      requestAnimationFrame(loop);
    };
    const frameId = requestAnimationFrame(loop);

    //cleanup
    return () => {
      cancelAnimationFrame(frameId);
    };
  });

  let camera2DPosition = spring(
    { x: CAMERA_INITIAL_POSITION.x, y: CAMERA_INITIAL_POSITION.y },
    {
      stiffness: 0.1,
      damping: 0.99,
    }
  );

  let cameraZoom = spring(
    { z: CAMERA_INITIAL_POSITION.z },
    { stiffness: 0.1, damping: 0.99 }
  );

  let trajectory = spring(
    { x: 0, y: 0 },
    {
      stiffness: 0.1,
      damping: 0.25,
    }
  );

  function handlePanStart(event: CustomEvent<{ x: number; y: number }>) {
    // event.preventDefault();
    // cameraPosition.stiffness = cameraPosition.damping = 1;
  }

  function handlePanMove(event: CustomEvent<PointerDifference>) {
    camera2DPosition.update(($cameraPosition) => ({
      x: $cameraPosition.x + event.detail.dx,
      y: $cameraPosition.y + event.detail.dy,
    }));
  }

  function handlePanEnd(event: CustomEvent<{ x: number; y: number }>) {
    // event.preventDefault();
  }

  const handleMouseWheel = (
    event: EventWithTarget<WheelEvent, HTMLCanvasElement>
  ) => {
    // event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const dy = event.deltaY / rect.height;

    cameraZoom.update(({ z }) => ({
      z: z - dy,
    }));
  };

  const isInit = (api: Api | undefined | null): api is Api => {
    return (api as Api)?.state()?.initialised === true;
  };

  $: if (isInit(api)) {
    api.pan(api.state(), $camera2DPosition);
  }
  $: if (isInit(api)) {
    api.zoom(api.state(), $cameraZoom.z);
    console.log($cameraZoom);
  }
</script>

<div bind:this={canvasProxyEl} class:canvas-proxy={true}>
  <canvas
    class:webgl-canvas={true}
    bind:this={canvasEl}
    use:pannable={{
      xi: CAMERA_INITIAL_POSITION.x,
      yi: CAMERA_INITIAL_POSITION.y,
      zi: CAMERA_INITIAL_POSITION.z,
    }}
    on:wheel={handleMouseWheel}
    on:panstart={handlePanStart}
    on:panmove={handlePanMove}
    on:panend={handlePanEnd}
  />
</div>

<!-- <div class:controls={true}>
  <label>
    <h3>stiffness ({cameraPosition.stiffness})</h3>
    <input
      bind:value={cameraPosition.stiffness}
      type="range"
      min="0"
      max="1"
      step="0.01"
    />
  </label>

  <label>
    <h3>damping ({cameraPosition.damping})</h3>
    <input
      bind:value={cameraPosition.damping}
      type="range"
      min="0"
      max="1"
      step="0.01"
    />
  </label>
</div> -->
<style lang="scss">
  .controls {
    position: absolute;
    right: 1em;
    z-index: 4;
    background-color: red;
    width: 100px;
    height: 100px;
  }
  .canvas-proxy {
    overscroll-behavior-y: none;
    overscroll-behavior-x: none;
    touch-action: none;
    z-index: 0;
    position: relative;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    height: 100%;
    width: 100%;
    box-sizing: border-box;
    background-color: transparent;
    overflow: hidden;
    overscroll-behavior: contain;
    user-select: none;
    background-color: red;
  }

  .webgl-canvas {
    touch-action: none;
    z-index: 2;
    position: absolute;
    background-color: red;
    height: 100%;
    width: 100%;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    box-sizing: border-box;
    touch-action: none;

    cursor: grab;
    &:active {
      cursor: grabbing;
    }
  }
</style>
