import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  Fog,
  Mesh,
  MeshNormalMaterial,
  PerspectiveCamera,
  PointLight,
  Scene,
  Vector2,
  WebGLRenderer,
} from "three";

type Object3dHandles = {
  ambientLight: AmbientLight;
};
type ResourceHandles = {};

type PostprocessingPassHandles = {};

export type ThreeState = {
  initialised: boolean;
  object3dHandles: Object3dHandles;
  resourceHandles: ResourceHandles;
  passes: PostprocessingPassHandles;
  renderer: WebGLRenderer;
  camera: PerspectiveCamera;
  scene: Scene;
  mouse: Vector2;
  resolution: Vector2;
  canvasProxyEl: HTMLDivElement;
};

export const createThreeApi = () => {
  let state: ThreeState;

  return {
    state: () => state,
    init: (
      canvasProxyEl: HTMLDivElement,
      canvasEl: HTMLCanvasElement,
      cameraInitialPosition: { x: number; y: number; z: number }
    ) => {
      // scenes :
      const scene = new Scene();
      scene.fog = new Fog(0x000000, 1, 1000);

      //render targets, planes,
      const canvasWidth = canvasEl.clientWidth;
      const canvasHeight = canvasEl.clientHeight;
      const aspect = canvasWidth / canvasHeight;
      const resolution = new Vector2(canvasWidth, canvasHeight);
      const mouse = new Vector2();

      const fov = 50;
      const near = 0.1;
      const far = 1000;
      const camera = new PerspectiveCamera(fov, aspect, near, far);

      const renderer = new WebGLRenderer({
        antialias: true,
        canvas: canvasEl,
      });

      const dpr = window?.devicePixelRatio || 1;
      renderer.setPixelRatio(dpr);

      const ambientLight = new AmbientLight(new Color("white"), 1);
      const directionalLight = new DirectionalLight(new Color("red"), 0.2);
      const pointLight = new PointLight(new Color("orange"));

      const geometry = new BoxGeometry(1, 1, 1);
      const material = new MeshNormalMaterial();
      const cube = new Mesh(geometry, material);

      camera.position.set(
        cameraInitialPosition.x,
        cameraInitialPosition.y,
        cameraInitialPosition.z
      );
      camera.lookAt(cube.position);

      scene.add(ambientLight, directionalLight, cube);

      state = {
        initialised: true,
        object3dHandles: {
          ambientLight,
        },
        resourceHandles: {},
        passes: {},
        renderer: renderer,
        camera: camera,
        scene: scene,
        mouse: mouse,
        resolution: resolution,
        canvasProxyEl: canvasProxyEl,
      };
    },
    render: (state: ThreeState) => {
      const { renderer, canvasProxyEl, camera, scene } = state;

      const canvas = renderer.domElement;

      const needResize =
        Math.round(canvas.clientHeight) !== Math.round(canvas.height) ||
        Math.round(canvas.clientWidth) !== Math.round(canvas.width);

      if (needResize) {
        const aspect = canvas.clientWidth / canvas.clientHeight;
        camera.aspect = aspect;
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        camera.updateProjectionMatrix();
      }

      renderer.render(scene, camera);
    },
    pan: (state: ThreeState, { x, y }: { x: number; y: number }) => {
      const { camera } = state;
      camera.position.set(x, y, camera.position.z);
    },
    zoom: (state: ThreeState, z: number) => {
      const { camera } = state;
      camera.position.setZ(z);
    },
  };
};

export type Api = ReturnType<typeof createThreeApi>;
