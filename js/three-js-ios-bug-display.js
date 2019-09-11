(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three-full'), require('three-js-mesh-world-normal-material'), require('three-js-mesh-position-materials')) :
    typeof define === 'function' && define.amd ? define(['exports', 'three-full', 'three-js-mesh-world-normal-material', 'three-js-mesh-position-materials'], factory) :
    (factory((global.THREEiOSBugDisplay = {}),global.THREE,global.THREEMeshWorldNormalMaterial,global.THREEMeshPositionMaterials));
}(this, (function (exports,threeFull,threeJsMeshWorldNormalMaterial,threeJsMeshPositionMaterials) { 'use strict';

    threeJsMeshWorldNormalMaterial = threeJsMeshWorldNormalMaterial && threeJsMeshWorldNormalMaterial.hasOwnProperty('default') ? threeJsMeshWorldNormalMaterial['default'] : threeJsMeshWorldNormalMaterial;

    const NormalShader = {

        vertexShader: [
            "varying vec3 vNormal;",

            "void main() {",
            "vNormal = normal;",
            "gl_Position = vec4( (uv-0.5)*2.0, 0, 1.0 );",
            "}",
        ].join("\n"),

        fragmentShader: [
            "varying vec3 vNormal;",
            "",
            "#include <packing>",

            "void main() {",
            "gl_FragColor = vec4( packNormalToRGB( normalize( vNormal ) ), 1.0 );",
            "}"
        ].join("\n")

    };


    const PositionNormaliseShader =  {

        uniforms: {
            'minBox': { value: null },
            'maxBox': { value: null }
        },

        vertexShader: [
            "varying vec3 vCoord;",
            "uniform vec3 minBox;",
            "uniform vec3 maxBox;",


            "void main() {" ,
            "   gl_Position = vec4( (uv-0.5)*2.0, 0, 1.0 );",
            "   gl_Position = vec4( (uv-0.5)*2.0, 0, 1.0 );",
            "   vec4 worldSpacePosition = modelMatrix * vec4( position, 1. );",
            "   vec4 worldSpacePosition2 = modelMatrix * vec4( position, 1. );",
            "   vCoord = (worldSpacePosition.xyz - minBox)/abs(maxBox-minBox);",

            "}",
        ].join("\n"),

        fragmentShader: [
            "varying vec3 vCoord;",
            "void main() {",
            "gl_FragColor = vec4( vCoord, 1.0);",
            "}"
        ].join("\n")
        
    };

    function UnwrappingUV(renderer, mesh , resolution)
    {
        let renderTargets = [];

        let size = resolution;

        let camera = new threeFull.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
        let oldParent = mesh.parent;
        oldParent.remove(mesh);
        let scene = new threeFull.Scene();
        scene.add(mesh);

        this.dispose = function () {
            for (let target of renderTargets)
                target.dispose();
        };

        this.textureNormal = computeTexture(
            renderer, mesh, threeFull.UnsignedByteType,
            NormalShader, camera, scene, size
        );

        mesh.geometry.computeBoundingBox();
        this.boundingBox = mesh.geometry.boundingBox;

        this.textureX = computeCoordTexture(renderer, mesh, camera, scene, size, PositionNormaliseShader, this.boundingBox);
        this.textureY = this.textureX;
        this.textureZ = this.textureX;

        oldParent.add(mesh);


        function computeTexture(renderer, mesh, type, shader, camera, scene, size)
        {
            let meshMaterial = mesh.material;

            let renderTarget = new threeFull.WebGLRenderTarget(
                size,
                size,
                {
                    minFilter: threeFull.NearestFilter,
                    magFilter: threeFull.NearestFilter,
                    format: threeFull.RGBAFormat,
                    type: type,
                    stencilBuffer: false,
                    depthBuffer: false
                }
            );
            let material = new threeFull.ShaderMaterial({
                vertexShader: shader.vertexShader,
                fragmentShader: shader.fragmentShader,
            } );
            material.side = threeFull.DoubleSide;

            mesh.material = material;
            renderer.render(scene, camera, renderTarget);
            mesh.material = meshMaterial;
            material.dispose();

            renderTargets.push(renderTarget);
            return renderTarget.texture;

        }


        function computeCoordTexture(renderer, mesh, camera, scene, size, shaderModel, boundingBox)
        {

            let meshMaterial = mesh.material;

            let material = new threeFull.ShaderMaterial({
                uniforms: {
                    minBox: { value: boundingBox.min },
                    maxBox: { value: boundingBox.max }
                },
                vertexShader: shaderModel.vertexShader,
                fragmentShader: shaderModel.fragmentShader,
            } );
            material.needsUpdate = true;
            material.side = threeFull.DoubleSide;

            let renderTarget = new threeFull.WebGLRenderTarget(
                size,
                size,
                {
                    minFilter: threeFull.NearestFilter,
                    magFilter: threeFull.NearestFilter,
                    format: threeFull.RGBAFormat,
                    stencilBuffer: false,
                    depthBuffer: false
                }
            );

            mesh.material = material;
            renderer.render(scene, camera, renderTarget);
            mesh.material = meshMaterial;
            material.dispose();

            renderTargets.push(renderTarget);
            return renderTarget.texture;

        }
    }

    function RenderTargetAO(size, format, depthBuffer)
    {
        this.renderTarget = null;
        this.overrideMaterial = null;

        init(this);


        function init(This) {
            This.renderTarget = new threeFull.WebGLRenderTarget(size.x, size.y);
            This.renderTarget.format = format;
            This.renderTarget.minFilter = threeFull.NearestFilter;
            This.renderTarget.magFilter = threeFull.NearestFilter;
            This.renderTarget.stencilBuffer = false;
            This.renderTarget.depthBuffer = depthBuffer;
        }
    }


    RenderTargetAO.prototype.clear = function (renderer)
    {
        renderer.setRenderTarget(this.renderTarget);
        renderer.clear();
    };


    RenderTargetAO.prototype.render = function(renderer, scene, camera)
    {
        let om;
        if (this.overrideMaterial != null) {
            om = scene.overrideMaterial;
            scene.overrideMaterial = this.overrideMaterial;
        }

        renderer.render(scene, camera, this.renderTarget);

        if (this.overrideMaterial != null) {
            scene.overrideMaterial = om;
        }
    };


    RenderTargetAO.prototype.dispose = function ()
    {
        if (this.overrideMaterial != null)
            this.overrideMaterial.dispose();
        this.renderTarget.dispose();
    };

    function RenderTargetTextureAO(size, format, shaderModel)
    {
        let _textureScene;
        let _textureCamera;
        let _mesh;

        RenderTargetAO.call(this, size, format, false);
        init();


        function init() {

            _textureScene = new threeFull.Scene();
            _textureCamera = new threeFull.OrthographicCamera(-1, 1, 1, -1, 0, 1);

            if (shaderModel == null || shaderModel.vertex == null || shaderModel.fragment == null)
                throw new Error("Invalid shader model");

            let textureMaterial = new threeFull.ShaderMaterial({
                vertexShader: shaderModel.vertex,
                fragmentShader: shaderModel.fragment
            });

            _mesh = new threeFull.Mesh(new threeFull.PlaneGeometry(2, 2), textureMaterial);
            _textureScene.add(_mesh);
        }


        this.setUniforms = function (uniforms)
        {
            for (let uniformName of Object.keys(uniforms)) {
                if (_mesh.material.uniforms[uniformName] != null)
                    _mesh.material.uniforms[uniformName].value = uniforms[uniformName].value;
                else
                    _mesh.material.uniforms[uniformName] = { value: uniforms[uniformName].value };
            }
            _mesh.material.uniformsNeedUpdate = true;
        };


        this.renderTexture = function (renderer)
        {
            this.render(renderer, _textureScene, _textureCamera);
        };
    }


    RenderTargetTextureAO.prototype = Object.create(RenderTargetAO.prototype);

    const textureAveragingFragmentShader = `

#define MAX_AMOUNT_OF_SHADOW_MAPS_AOR 2

varying vec2 vUv;

uniform sampler2D unwrappedMapX_AOR;
uniform sampler2D unwrappedMapY_AOR;
uniform sampler2D unwrappedMapZ_AOR;
uniform sampler2D normalMap_AOR;

uniform vec3 boundingBoxMin_AOR;
uniform vec3 boundingBoxMax_AOR;

uniform vec2 shadowMapSize_AOR;
uniform int numberOfShadowMaps_AOR;
uniform sampler2D shadowMaps_AOR[MAX_AMOUNT_OF_SHADOW_MAPS_AOR];
uniform vec3 shadowMapDirections_AOR[MAX_AMOUNT_OF_SHADOW_MAPS_AOR];
uniform mat4 lightSpaceMatrices_AOR[MAX_AMOUNT_OF_SHADOW_MAPS_AOR];

uniform int totalShadowMapsAveraged_AOR;
uniform sampler2D previousAveragingValues_AOR;
uniform sampler2D previousAveragingWeights_AOR;

void main() {
    texture2D(unwrappedMapX_AOR, vUv);
    texture2D(unwrappedMapY_AOR, vUv);
    texture2D(unwrappedMapZ_AOR, vUv);
    boundingBoxMax_AOR;
    boundingBoxMin_AOR;
    
    normalMap_AOR;
    previousAveragingValues_AOR;

    for (int i = 0; i < MAX_AMOUNT_OF_SHADOW_MAPS_AOR; i++) {
        if (i < numberOfShadowMaps_AOR) {
            shadowMapDirections_AOR[i];
            lightSpaceMatrices_AOR[i];
            shadowMaps_AOR[i];
        }
    }
    gl_FragColor = vec4(texture2D(unwrappedMapX_AOR, vUv).xyz, 1.0);
}
`;


    const averagingShader = {
        vertex:
            `varying vec2 vUv;
        
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
        `,

        fragment: textureAveragingFragmentShader
    };

    function ShadowMapGenerator(direction, shadowMapSize)
    {
        if (direction == null || !direction.isVector3 || direction.length() === 0)
            throw new Error("Invalid direction vector. 'direction' must be a non null Vector3");

        if (shadowMapSize == null || shadowMapSize <= 0)
            shadowMapSize = 512;

        let camera = new threeFull.OrthographicCamera(-5, 5, 5, -5, 0, 10);
        let currentDirection = direction.clone().normalize();

        let renderTarget = new RenderTargetAO(new threeFull.Vector2(shadowMapSize, shadowMapSize), threeFull.RGBAFormat, true);

        this.generateShadowMap = function(renderer, scene, boundingSphere)
        {
            // Place the camera on the bounding sphere surface, looking at the center of the sphere, in the provided direction
            camera.position.copy(currentDirection.clone().multiplyScalar(boundingSphere.radius).add(boundingSphere.center));
            camera.updateMatrixWorld();
            camera.lookAt(boundingSphere.center);
            camera.updateMatrixWorld();
            camera.left   = -1 * boundingSphere.radius;
            camera.right  =  1 * boundingSphere.radius;
            camera.top    =  1 * boundingSphere.radius;
            camera.bottom = -1 * boundingSphere.radius;
            camera.near   = -0 * boundingSphere.radius;
            camera.far    =  2 * boundingSphere.radius;
            camera.updateProjectionMatrix();

            // Render the shadow map
            renderTarget.clear(renderer);
            renderTarget.render(renderer, scene, camera);

            return renderTarget.renderTarget.texture;
        };


        this.getCamera = function ()
        {
            return camera;
        };


        this.getShadowMap = function()
        {
            return renderTarget.renderTarget.texture;
        };


        this.dispose = function ()
        {
            renderTarget.dispose();
        };
    }

    function SceneMaterialSwitcher( scene ) {

        this.scene = scene;
        this.originalMaterials = null;
        this.normalMaterials = {};
        this.rgbaDepthMaterials = {};
        this.worldPositionMaterials = {};

        this._prevSceneOnBeforeRender = null;
    }


    Object.assign( SceneMaterialSwitcher.prototype, {

    	setRGBADepth: function (side) {

            if(this.originalMaterials === null){
                this.saveOriginalMaterials();
            }

            this.scene.traverse((o) => {
                if(o instanceof threeFull.Mesh){
                    var om = this.originalMaterials[o.uuid];
                    if(om instanceof threeFull.Material){
                        let params = {};
                        params.flatShading = om.flatShading;
                        if(om.displacementMap !== undefined){
                            params.displacementMap = om.displacementMap;
                            params.displacementScale = om.displacementScale;
                            params.displacementBias = om.displacementBias;
                        }
                        params.wireframe = om.wireframe;
                        params.wireframeLinewidth = om.wireframeLinewidth;
                        params.skinning = om.skinning;
                        params.morphTargets = om.morphTargets;
                        if(this.rgbaDepthMaterials[o.uuid] === undefined){
                            this.rgbaDepthMaterials[o.uuid] = new threeJsMeshPositionMaterials.MeshRGBADepthMaterial(params);
                        }
                        o.material = this.rgbaDepthMaterials[o.uuid];
                        o.material.side = side !== undefined ? side : THREE.DoubleSide;
                    }else{
                        o.material.defines.RGBA_DEPTH = true;
                        o.material.defines.WORLD_NORMAL = false;
                        o.material.defines.WORLD_POSITION = false;
                    }
                }
            });
    	},

        
    	saveOriginalMaterials: function () {

            if(this.originalMaterials !== null){
                throw "Error : original materials have already been saved, please call resetOriginalMaterials";
            }

            this.originalMaterials = {};
            this.scene.traverse((o) => {
                if(o instanceof threeFull.Mesh){
                    if(o.material instanceof threeFull.ShaderMaterial){
                        var defs = o.material.defines;
                        var om = {};
                        if(defs){
                            if(om.WORLD_NORMAL !== undefined){ om.WORLD_NORMAL = defs.WORLD_NORMAL; }                        if(om.RGBA_DEPTH !== undefined){ om.RGBA_DEPTH = defs.RGBA_DEPTH; }                        if(om.WORLD_POSITION !== undefined){ om.WORLD_POSITION = defs.WORLD_POSITION; }                    }
                        this.originalMaterials[o.uuid] = om;
                    }else{
                        this.originalMaterials[o.uuid] = o.material;
                    }
                }
            });

    	},

        resetOriginalMaterials: function(){

            if(this.originalMaterials === null){
                throw "Error : cannot reset original materials as they have not been saved.";
            }

            this.scene.traverse((o) => {
                if(o instanceof threeFull.Mesh){
                    var om = this.originalMaterials[o.uuid];
                    if(om instanceof threeFull.Material){
                        o.material = this.originalMaterials[o.uuid];
                    }else{
                        if(om.WORLD_NORMAL)    { o.material.defines.WORLD_NORMAL   = om.WORLD_NORMAL;     }
                        if(om.RGBA_DEPTH)      { o.material.defines.RGBA_DEPTH     = om.RGBA_DEPTH;       }
                        if(om.WORLD_POSITION)  { o.material.defines.WORLD_POSITION = om.WORLD_POSITION;   }
                    }
                }
            });

            this.originalMaterials = null;

        },

        dispose: function(){
            for (var uuid of Object.keys(this.normalMaterials)) {
              this.normalMaterials[uuid].dispose();
            }
            this.normalMaterials = {};
            for (var uuid of Object.keys(this.rgbaDepthMaterials)) {
              this.rgbaDepthMaterials[uuid].dispose();
            }
            this.rgbaDepthMaterials = {};
            for (var uuid of Object.keys(this.worldPositionMaterials)) {
              this.worldPositionMaterials[uuid].dispose();
            }
            this.worldPositionMaterials = {};

            if(this._prevSceneOnBeforeRender){
                this.scene.onBeforeRender = this._prevSceneOnBeforeRender;
            }
        }

    } );

    function ComputeTexture(renderer, scene, mesh, resolution)
    {
        let cancelMode = false;

        let p = new Promise((resolve, err) =>
        {
            let size;
            let unwrapping;
            let dt;
            let lastTime;
            let averagingTarget;
            let shadowMapGenerators;


            let extractShadowMapData = function (generators, maxAmount) {
                let result = { sm: [], smd: [], lsm: [] };

                for (let generator of generators) {
                    let cam = generator.getCamera();

                    result.sm.push(generator.getShadowMap());

                    let d = new threeFull.Vector3();
                    cam.getWorldDirection(d);
                    result.smd.push(d.normalize());

                    result.lsm.push(cam.projectionMatrix.clone().multiply(cam.matrixWorldInverse));
                }

                // Must fill to the shader length arrays else THREE will crash
                for (let i = generators.length; i < maxAmount; i++) {
                    result.sm.push(null);
                    result.smd.push(new threeFull.Vector3());
                    result.lsm.push(new threeFull.Matrix4());
                }

                return result;
            };


            let saveToDataTexture = function (renderTarget)
            {
                let buffer = new Uint8Array(resolution * resolution * 4);
                renderer.readRenderTargetPixels(renderTarget, 0, 0, resolution, resolution, buffer);
                let texture = new threeFull.DataTexture(buffer, resolution, resolution, threeFull.RGBAFormat, threeFull.UnsignedByteType);
                texture.needsUpdate = true;
                texture.magFilter = threeFull.LinearFilter;
                texture.minFilter = threeFull.LinearFilter;
                return texture;
            };


            let timeout = function (force)
            {
                if (cancelMode)
                    err(new Error("Execution canceled"));
                if (Date.now() - lastTime < dt && !force)
                    return;
                lastTime = Date.now();
                return new Promise(resolve => setTimeout(() => { lastTime = Date.now(); resolve(); }, 5))
            };


            let makeAOTexture = function()
            {
                unwrapping = new UnwrappingUV(renderer, mesh, resolution);

                averagingTarget.setUniforms({
                    unwrappedMapX_AOR: { value: unwrapping.textureX },
                    unwrappedMapY_AOR: { value: unwrapping.textureY },
                    unwrappedMapZ_AOR: { value: unwrapping.textureZ },
                    normalMap_AOR: { value: unwrapping.textureNormal },
                    boundingBoxMin_AOR: { value: unwrapping.boundingBox.min },
                    boundingBoxMax_AOR: { value: unwrapping.boundingBox.max },
                    previousAveragingValues_AOR: { value: null },
                    previousAveragingWeights_AOR: { value: null },
                });

                // Use a material switcher to do a depth render for the shadow maps
                // Note: this operation is necessary to reproduce bug
                let matSwitcher = new SceneMaterialSwitcher(scene);
                matSwitcher.saveOriginalMaterials();
                matSwitcher.setRGBADepth();

                let boundingSphere = new threeFull.Sphere();
                unwrapping.boundingBox.getBoundingSphere(boundingSphere);
                shadowMapGenerators[0].generateShadowMap(renderer, scene, boundingSphere);
                shadowMapGenerators[1].generateShadowMap(renderer, scene, boundingSphere);

                // Reset materials to their original values
                matSwitcher.resetOriginalMaterials();
                matSwitcher.dispose();

                let data = extractShadowMapData(shadowMapGenerators, 2);
                averagingTarget.setUniforms({
                    numberOfShadowMaps_AOR: { value: shadowMapGenerators.length, needsUpdate: true },
                    shadowMaps_AOR: { value: data.sm, needsUpdate: true },
                    shadowMapDirections_AOR: { value: data.smd, needsUpdate: true },
                    lightSpaceMatrices_AOR: { value: data.lsm, needsUpdate: true },
                    totalShadowMapsAveraged_AOR: { value: 0, needsUpdate: true }
                });

                averagingTarget.renderTexture(renderer);
            };


            init();
            return run();


            function init() {

                size = new threeFull.Vector2(resolution, resolution);

                dt = Math.round(12);
                lastTime = Date.now();

                let dir = new threeFull.Vector3(0, 0, 1).normalize();
                shadowMapGenerators = [];
                shadowMapGenerators.push(new ShadowMapGenerator(dir, 512));
                shadowMapGenerators.push(new ShadowMapGenerator(dir, 512));

                averagingTarget = new RenderTargetTextureAO(size, threeFull.RGBAFormat, averagingShader);
            }


            async function run()
            {
                await timeout();

                makeAOTexture();

                unwrapping.dispose();

                if (cancelMode) return;

                let texture = saveToDataTexture(averagingTarget.renderTarget);
                averagingTarget.dispose();
                resolve(texture);
            }
        });

        p.cancel = function ()
        {
            cancelMode = true;
        };

        return p;
    }

    exports.ComputeTexture = ComputeTexture;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
