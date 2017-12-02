var posToShadowPos = `
highp vec3 sunDirection = normalize(vec3(-1, 1, -1));
highp vec3 posToShadowPos(highp vec3 pos) {
    highp vec3 v = cross(sunDirection, vec3(0, 0, -1));
    highp float c = dot(sunDirection, vec3(0, 0, -1));
    highp mat3 vx = mat3(0, v.z, -v.y, -v.z, 0, v.x, v.y, -v.x, 0);
    highp mat3 rot = mat3(1, 0, 0, 0, 1, 0, 0, 0, 1) + vx + vx*vx*(1.0/(1.0 +c));
    return rot * pos * vec3(0.01, 0.01, -0.01);
}
`;

var renderVertexSource = `
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

${posToShadowPos}

void main() {
    float cosZ = cos(zRot);
    float sinZ = sin(zRot);
    mat4 zRotMat = mat4(cosZ, sinZ, 0, 0,
                        -sinZ, cosZ, 0, 0,
                        0, 0, 1, 0,
                        0, 0, 0, 1);
    gl_Position = zRotMat * (pos + vec4(0, 0, -25.0, 0));

    // pass the transformed pos to the fragment shader to do lighting on
    transformedPos = gl_Position.xyz;

    // pitch the camera
    float cosP = cos(pitch);
    float sinP = sin(pitch);
    mat4 pitchMat = mat4(1, 0, 0, 0,
                         0, cosP, sinP, 0,
                         0, -sinP, cosP, 0,
                         0, 0, 0, 1);
    gl_Position = pitchMat * gl_Position;

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

var shadowVertexSource = `
attribute vec4 pos;
uniform float zRot;

varying highp float shadowZ;

${posToShadowPos}

void main() {
    float cosZ = cos(zRot);
    float sinZ = sin(zRot);
    mat4 zRotMat = mat4(cosZ, sinZ, 0, 0,
                        -sinZ, cosZ, 0, 0,
                        0, 0, 1, 0,
                        0, 0, 0, 1);
    gl_Position = zRotMat * (pos + vec4(0, 0, -25.0, 0));

    gl_Position.xyz = posToShadowPos(gl_Position.xyz);

    shadowZ = gl_Position.z * 0.5 + 0.5;
}
`;

var renderFragmentSource = `
#extension GL_OES_standard_derivatives : enable

uniform sampler2D textureSampler;
uniform sampler2D shadowSampler;

varying lowp vec4 vertColor;
varying highp vec2 vertTexCoord;
varying highp vec3 transformedPos;

${posToShadowPos}

void main() {
    highp vec3 shadowCoord = posToShadowPos(transformedPos);
    shadowCoord.xyz *= 0.5;
    shadowCoord.xyz += vec3(0.5, 0.5, 0.5);
    highp vec4 texZ = texture2D(shadowSampler, shadowCoord.xy);
    highp float z = dot(texZ, vec4(1.0, 1.0/256.0, 1.0/256.0/256.0, 1.0/256.0/256.0/256.0));
    lowp float sunShadowFactor = 1.0;
    if(z < shadowCoord.z - 0.005) {
        sunShadowFactor = 0.0; // in shadow
    }

    highp vec3 normal = normalize(cross(dFdx(transformedPos), dFdy(transformedPos)));
    gl_FragColor = vec4(0.0, 0.0, 0.0, vertColor.a);

    lowp vec3 color = vertColor.rgb;
    if(vertTexCoord.x != 0.0 || vertTexCoord.y != 0.0) {
        color *= texture2D(textureSampler, vertTexCoord).rgb;
    }

    lowp vec3 sunDirection = normalize(vec3(-1, 1, -1));
    highp float sunFac = dot(normal, -sunDirection) * sunShadowFactor;
    if(sunFac > 0.0) {
        gl_FragColor.rgb += sunFac * color.rgb * vec3(0.99, 0.98, 0.93) * 0.65;
    }

    gl_FragColor.rgb += color.rgb * vec3(0.89, 0.93, 0.97) * 0.6;
}
`;

var shadowFragmentSource = `
varying highp float shadowZ;

void main() {
    gl_FragColor = vec4(
        shadowZ,
        fract(shadowZ * 256.0),
        fract(shadowZ * 256.0*256.0),
        fract(shadowZ * 256.0*256.0*256.0)
    );
}
`;

function setup() {
    canvas = document.getElementById("view");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    gl = canvas.getContext("webgl");
    gl.getExtension('OES_standard_derivatives');

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

    renderProgram = gl.createProgram();
    gl.attachShader(renderProgram, makeShader(renderVertexSource, gl.VERTEX_SHADER));
    gl.attachShader(renderProgram, makeShader(renderFragmentSource, gl.FRAGMENT_SHADER));
    gl.linkProgram(renderProgram);

    shadowProgram = gl.createProgram();
    gl.attachShader(shadowProgram, makeShader(shadowVertexSource, gl.VERTEX_SHADER));
    gl.attachShader(shadowProgram, makeShader(shadowFragmentSource, gl.FRAGMENT_SHADER));
    gl.linkProgram(shadowProgram);

    // load the texture
    const i = new Image();
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
    i.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, i);

        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
    }
    i.src = "texture.png";

    renderBuffer = gl.createBuffer();


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
