var vs = `
attribute vec4 pos;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {

    gl_Position = pos;
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
        throw ("Shader error: " + gl.getShaderInfoLog(shader));
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

function render() {
    gl.clearColor(113/255, 211/255, 244/255, 1.0);
    // Clear the color buffer with specified clear color
    gl.clear(gl.COLOR_BUFFER_BIT);

    drawVerts([
        [-55, -55, 0],
        [55, -55, 0],
        [55, 55, 0],
        [-55, 55, 0],
    ]);
}

render();
