import { ShaderMaterial, Texture } from "three";

interface Uniforms {
  uDiffuseTexture: Texture;
}

/**
 * 💉 injected uniforms:  ✅
 * uniform mat4 modelMatrix; ✅ 	        = object.matrixWorld
 * uniform mat4 modelViewMatrix; ✅ 	    = camera.matrixWorldInverse * object.matrixWorld
 * uniform mat4 projectionMatrix; ✅ 	= camera.projectionMatrix
 * uniform mat4 viewMatrix; ✅		    = camera.matrixWorldInverse
 * uniform mat3 normalMatrix; ✅			= inverse transpose of modelViewMatrix
 * uniform vec3 cameraPosition; ✅		= camera position in world space
 */

const vertexShader = /*glsl*/ `

/**
 * 💉 injected attributes:  ✅
 * attribute vec3 position; //POSITION ✅
 * attribute vec3 normal; //NORMAL ✅
 * attribute vec3 tangent; //TANGENT
 * attribute vec2 uv; //TEXCOORD_0 ✅
 * attribute vec2 uv2; //TEXCOORD_1
 * attribute vec4 color; //COLOR_0
 * attribute vec3 skinWeight; //WEIGHTS_
 * attribute vec3 skinIndex; //JOINTS_0
 * 
 */
varying vec2 vUv;

void main(){
    vUv = uv;
    vec4 modelViewPosition = modelViewMatrix * vec4(position , 1.0);
    gl_Position = projectionMatrix * modelViewPosition;
}
`;

const fragmentShader = /*glsl*/ `

    // varyings : 
    varying vec2 vUv;

    // uniforms : 
    uniform sampler2D uDiffuseTexture;
  
    void main() {

        vec2 uv = vUv;

        vec4 texel = texture2D(uDiffuseTexture, uv);
     
        gl_FragColor = texel; 
    }
    
`;

class BasicShaderMaterial extends ShaderMaterial {
  constructor({ uDiffuseTexture }: Uniforms) {
    super({
      uniforms: {
        uDiffuseTexture: { value: uDiffuseTexture },
      },
      vertexShader,
      fragmentShader,
    });
  }

  get uDiffuseTexture() {
    return this.uniforms.uDiffuseTexture1.value;
  }
  set uDiffuseTexture(v: Texture) {
    this.uniforms.uDiffuseTexture1.value = v;
  }

  update = (uniforms: Uniforms) => {
    Object.entries(uniforms).map(([key, val]) => {
      this.uniforms[key].value = val;
    });
    this.needsUpdate = true;
  };
}

export { BasicShaderMaterial };
