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
    gl_Position *= vec4(viewScaling, -0.01, 1.0);

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

function setup() {
    canvas = document.getElementById("view");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl = canvas.getContext("webgl");

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
    const vertShader = makeShader(vs, gl.VERTEX_SHADER);
    const fragShader = makeShader(fs, gl.FRAGMENT_SHADER);

    program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    // load the texture
    const i = new Image();
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
    i.onload = function() {
        console.log("loaded");
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, i);

        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
    }
    i.src = "texture.png";


    canvas.addEventListener('mousemove', function(e) {
        let f = (1.0 - e.clientY / canvas.height);
        f = (f - 0.5) * 1.2 + 0.5;
        f = Math.min(1.0, Math.max(0.0, f));
        camProps.pitch = -90 * f;
        // camProps.zRot = 180 * (e.clientX / canvas.width);
    });

    world = new World();

    function zoomer(e) {
        const delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));

        const f = delta > 0 ? Math.SQRT2 : Math.SQRT1_2;

        camProps.zoom *= f;

    }
    canvas.addEventListener("mousewheel", zoomer, false);
    canvas.addEventListener("DOMMouseScroll", zoomer, false);

}
