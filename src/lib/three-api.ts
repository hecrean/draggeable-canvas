import {
  AmbientLight,
  Color,
  DirectionalLight,
  Fog,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneBufferGeometry,
  PlaneGeometry,
  PointLight,
  Scene,
  TextureLoader,
  Vector2,
  WebGLRenderer,
} from "three";
import { clamp } from "three/src/math/MathUtils";

const planeDimensions = (planeGeo: PlaneGeometry) => ({
  height: planeGeo.parameters.height,
  width: planeGeo.parameters.height,
});

type XY = { x: number; y: number };
type Z = { z: number };

type Object3dHandles = {
  ambientLight: AmbientLight;
  plane: Mesh<PlaneBufferGeometry, MeshStandardMaterial>;
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

      const geometry = new PlaneGeometry(1, 1);
      const material = new MeshStandardMaterial({
        map: new TextureLoader().load(
          "./video-posters/animation-video-poster.jpg"
        ),
      });
      const plane = new Mesh(geometry, material);

      camera.position.set(
        cameraInitialPosition.x,
        cameraInitialPosition.y,
        cameraInitialPosition.z
      );
      camera.lookAt(plane.position);

      scene.add(ambientLight, directionalLight, plane);

      state = {
        initialised: true,
        object3dHandles: {
          ambientLight,
          plane,
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
    pan: (
      state: ThreeState,
      { x, y }: XY,
      setZ: (v: { x: number; y: number }) => Promise<void>
    ) => {
      const {
        camera,
        object3dHandles: { plane },
      } = state;

      const fovy = (camera.fov * Math.PI) / 180;
      const X = 2 * camera.aspect * camera.position.z * Math.tan(fovy / 2);
      const Y = 2 * camera.position.z * Math.tan(fovy / 2);
      const { width, height } = planeDimensions(plane.geometry);
      const _x = clamp(x, -width / 2 + X / 2, width / 2 - X / 2);
      const _y = clamp(y, -height / 2 + Y / 2, height / 2 - Y / 2);

      setZ({ x: _x, y: _y });
      camera.position.set(x, y, camera.position.z);
    },
    zoom: (
      state: ThreeState,
      z: number,
      setXY: (v: { x: number; y: number }) => Promise<void>,
      setZ: (v: { z: number }) => Promise<void>
    ) => {
      const {
        camera,
        object3dHandles: { plane },
      } = state;

      const fovy = (camera.fov * Math.PI) / 180;

      const { width: planeWidth, height: planeHeight } =
        plane.geometry.parameters;

      const Y = 2 * camera.position.z * Math.tan(fovy / 2);

      const zMax = Math.min(
        planeWidth / (2 * camera.aspect * Math.tan(fovy / 2)),
        planeHeight / (2 * Math.tan(fovy / 2))
      );
      const _z = clamp(z, 0.1, zMax);

      const proposedViewsquareWidth =
        2 * camera.aspect * _z * Math.tan(fovy / 2);
      const proposedViewsquareHeight = 2 * _z * Math.tan(fovy / 2);

      //left
      const leftBound = -planeWidth / 2 + proposedViewsquareWidth / 2;

      //right
      const rightBound = planeWidth / 2 - proposedViewsquareWidth / 2;

      const _x =
        camera.position.x < leftBound
          ? leftBound
          : camera.position.x > rightBound
          ? rightBound
          : camera.position.x;

      //bottom
      const bottomBound = -planeHeight / 2 + proposedViewsquareHeight / 2;

      //top
      const topBound = planeHeight / 2 - proposedViewsquareHeight / 2;

      const _y =
        camera.position.y < bottomBound
          ? bottomBound
          : camera.position.y > topBound
          ? topBound
          : camera.position.y;

      setZ({ z: _z });
      setXY({ x: _x, y: _y });
      camera.position.set(_x, _y, _z);
    },
  };
};

export type Api = ReturnType<typeof createThreeApi>;
