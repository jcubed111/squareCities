var vs = `
attribute vec4 pos;

uniform float zRot;
uniform float pitch;
uniform float fov;
uniform float zoom;
uniform vec2 viewScaling;

void main() {
    float cosZ = cos(zRot);
    float sinZ = sin(zRot);
    mat4 zRotMat = mat4(cosZ, sinZ, 0, 0,
                        -sinZ, cosZ, 0, 0,
                        0, 0, 1, 0,
                        0, 0, 0, 1);
    float cosP = cos(pitch);
    float sinP = sin(pitch);
    mat4 pitchMat = mat4(1, 0, 0, 0,
                         0, cosP, sinP, 0,
                         0, -sinP, cosP, 0,
                         0, 0, 0, 1);
    gl_Position = pitchMat * zRotMat * (pos + vec4(0, 0, -0.25, 0));

    // perspective transform
    gl_Position.z -= 3.0;
    gl_Position.xy *= vec2(zoom/tan(fov/2.0)/-gl_Position.z);

    // screen coord transform
    gl_Position.z += 3.0;
    gl_Position *= vec4(viewScaling, 1.0, 1.0);
}
`;

var fs = `
void main() {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

var canvas = document.getElementById("view");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var gl = canvas.getContext("webgl");

function makeShader(source, type) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        throw ("Shader error: " + gl.getShaderInfoLog(s));
        return false;
    }
    return s;
}
var vertShader = makeShader(vs, gl.VERTEX_SHADER);
var fragShader = makeShader(fs, gl.FRAGMENT_SHADER);

var program = gl.createProgram();
gl.attachShader(program, vertShader);
gl.attachShader(program, fragShader);
gl.linkProgram(program);
gl.useProgram(program);

function drawVerts(verts) {
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    const floats = verts.reduce((a, b) => a.concat(b), []);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(floats), gl.STATIC_DRAW);

    const posLocation = gl.getAttribLocation(program, 'pos');
    gl.vertexAttribPointer(
        posLocation,
        3, // components per vert
        gl.FLOAT,
        false,
        0,
        0);
    gl.enableVertexAttribArray(posLocation);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, verts.length);
}

var camProps = {
    zRot: 0.0,
    viewScaling: [],
    pitch: -Math.PI/2 + 0.2,
    fov: 100,
    zoom: 4.0,
};

function render() {
    gl.clearColor(113/255, 211/255, 244/255, 1.0);
    // Clear the color buffer with specified clear color
    gl.clear(gl.COLOR_BUFFER_BIT);

    camProps.viewScaling = [1, canvas.width/canvas.height];

    // set transforms
    gl.uniform1f(gl.getUniformLocation(program, 'zRot'), camProps.zRot);
    gl.uniform1f(gl.getUniformLocation(program, 'pitch'), camProps.pitch);
    gl.uniform1f(gl.getUniformLocation(program, 'fov'), camProps.fov*Math.PI/180);
    gl.uniform1f(gl.getUniformLocation(program, 'zoom'), camProps.zoom);
    gl.uniform2fv(gl.getUniformLocation(program, 'viewScaling'), camProps.viewScaling);

    drawVerts([
        [-.5, -.5, 0],
        [.5, -.5, 0],
        [.5, .5, 0],
        [-.5, .5, 0],
    ]);
}

render();

setInterval(function() { camProps.zRot += 0.003; render(); }, 1000/60);
