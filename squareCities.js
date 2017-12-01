var vs = `
attribute vec4 pos;
attribute vec4 color;
attribute vec2 texCoord;

uniform float zRot;
uniform float pitch;
uniform float fov;
uniform float zoom;
uniform vec2 viewScaling;

varying lowp vec4 vertColor;
varying highp vec2 vertTexCoord;
varying highp vec3 transformedPos;

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
    gl_Position = pitchMat * zRotMat * (pos + vec4(0, 0, -25.0, 0));

    // pass the transformed pos to the fragment shader to do lighting on
    transformedPos = gl_Position.xyz;

    // perspective transform
    gl_Position.z -= 200.0;
    gl_Position.xy *= vec2(zoom/tan(fov/2.0)/-gl_Position.z);

    // screen coord transform
    gl_Position.z += 200.0;
    gl_Position *= vec4(viewScaling, 0.01, 1.0);

    vertColor = color;
    vertTexCoord = texCoord;
}
`;

var fs = `
uniform sampler2D textureSampler;

varying lowp vec4 vertColor;
varying highp vec2 vertTexCoord;
varying highp vec3 transformedPos;

void main() {
    gl_FragColor = vertColor * texture2D(textureSampler, vertTexCoord);
}
`;

class Vert{
    constructor(x=0.0, y=0.0, z=0.0, r, g, b, tx, ty) {
        if(b === undefined && r !== undefined && g !== undefined) {
            tx = r;
            ty = g;
            r = 255;
            g = 255;
            b = 255;
        }else if(r === undefined) {
            r = 255;
            g = 255;
            b = 255;
        }
        if(tx === undefined) {
            tx = 0.0;
            ty = 0.0;
        }
        this.x = x;
        this.y = y;
        this.z = z;
        this.r = r;
        this.g = g;
        this.b = b;
        this.tx = tx;
        this.ty = ty;
    }

    toArray() {
        return [
            this.x,
            this.y,
            this.z,
            this.r/255.0,
            this.g/255.0,
            this.b/255.0,
            this.tx,
            this.ty
        ];
    }
}

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

// load the texture
var i = new Image();
var texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
i.onload = function() {
    console.log("loaded");
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, i);
    gl.generateMipmap(gl.TEXTURE_2D);
}
i.src = "texture.png";

function drawVerts(verts) {
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    const floats = verts.map(v => v.toArray()).reduce((a, b) => a.concat(b), []);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(floats), gl.STATIC_DRAW);

    const stride = 8*4;
    const colorOffset = 3*4;
    const texCoordOffset = 6*4;

    const posLocation = gl.getAttribLocation(program, 'pos');
    gl.vertexAttribPointer(
        posLocation,
        3, // components per vert
        gl.FLOAT,
        false,
        stride,
        0);
    gl.enableVertexAttribArray(posLocation);

    const colorLocation = gl.getAttribLocation(program, 'color');
    gl.vertexAttribPointer(
        colorLocation,
        3, // components per vert
        gl.FLOAT,
        false,
        stride,
        colorOffset);
    gl.enableVertexAttribArray(colorLocation);

    const texCoordLocation = gl.getAttribLocation(program, 'texCoord');
    gl.vertexAttribPointer(
        texCoordLocation,
        2, // components per vert
        gl.FLOAT,
        false,
        stride,
        texCoordOffset);
    gl.enableVertexAttribArray(texCoordLocation);

    gl.drawArrays(gl.TRIANGLES, 0, verts.length);
}

var camProps = {
    zRot: 0.0,
    viewScaling: [1.0, 1.0],
    pitch: -70,
    fov: 60,
    zoom: 1.0,
};

function render() {
    gl.clearColor(113/255, 211/255, 244/255, 1.0);
    // Clear the color buffer with specified clear color
    gl.clear(gl.COLOR_BUFFER_BIT);

    camProps.viewScaling = [1, canvas.width/canvas.height];

    // set transforms
    gl.uniform1f(gl.getUniformLocation(program, 'zRot'), camProps.zRot*Math.PI/180);
    gl.uniform1f(gl.getUniformLocation(program, 'pitch'), camProps.pitch*Math.PI/180);
    gl.uniform1f(gl.getUniformLocation(program, 'fov'), camProps.fov*Math.PI/180);
    gl.uniform1f(gl.getUniformLocation(program, 'zoom'), camProps.zoom);
    gl.uniform2fv(gl.getUniformLocation(program, 'viewScaling'), camProps.viewScaling);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(gl.getUniformLocation(program, 'textureSampler'), 0);

    drawVerts([
        new Vert(-55, -55, 0, 0.0, 0.0),
        new Vert(55, -55, 0, 1/16, 0),
        new Vert(55, 55, 0, 1/16, 1/16),
        new Vert(55, 55, 0),
        new Vert(-55, 55, 0),
        new Vert(-55, -55, 0),
    ]);
}

render();

setInterval(function() { camProps.zRot += 0.25; render(); }, 1000/60);
// setInterval(render, 1000/60);


canvas.addEventListener('mousemove', function(e) {
    let f = (1.0 - e.clientY / canvas.height);
    f = (f - 0.5) * 1.2 + 0.5;
    f = Math.min(1.0, Math.max(0.0, f));
    camProps.pitch = -90 * f;
    // camProps.zRot = 180 * (e.clientX / canvas.width);
});
