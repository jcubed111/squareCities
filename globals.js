var canvas;
var gl;
var renderProgram;
var shadowProgram;
var currentProgram;
var texture;
var camProps = {
    zRot: 0.0,
    viewScaling: [1.0, 1.0],
    pitch: -65,
    fov: 60,
    zoom: 1.4142135623730951,
};
var world;
var renderBuffer; // for vert info

var shadowDepthTexture;
var shadowFramebuffer;
var shadowRenderBuffer;
var shadowTexSize = 1024*2;

var manualControl = false;
var doWaits = true;
var autoRotSpeed =  0.005;

var startTime = performance.now();
