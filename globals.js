var canvas;
var gl;
var renderProgram;
var shadowProgram;
var currentProgram;
var texture;
var camProps = {
    zRot: 0.0,
    viewScaling: [1.0, 1.0],
    pitch: -70,
    fov: 60,
    zoom: 1.0,
};
var world;
var renderBuffer; // for vert info

var shadowDepthTexture;
var shadowFramebuffer;
var shadowRenderBuffer;
var shadowTexSize = 1024*2;

var manualControl = true;
var doWaits = false;
