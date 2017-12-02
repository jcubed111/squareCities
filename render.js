

function cube(v0, v1, v2, v3, v4, v5, v6, v7) {
    // arrange the verts of a cube into triangles
    // v0 - v3 are the top faces in counterclockwise order
    // v4 is directly below v0, etc
    return [
        v0, v1, v2,
        v0, v2, v3,
        v4, v5, v1,
        v4, v1, v0,
        v5, v6, v2,
        v5, v2, v1,
        v6, v7, v3,
        v6, v3, v2,
        v7, v4, v0,
        v7, v0, v3,
        v4, v6, v5,
        v4, v7, v6,
    ];
}

function square(v0, v1, v2, v3) {
    return [v0, v1, v2, v0, v2, v3];
}

class TexSpec{
    constructor(xmin, ymin, xmax, ymax, r=255, g=255, b=255) {
        this.xmin = xmin;
        this.xmax = xmax;
        this.ymin = ymin;
        this.ymax = ymax;
        this.r = r;
        this.g = g;
        this.b = b;
    }
}

function building(vmin, vmax, wallTex, roofTex, rotateRoofTex = false) {
    const rXmin = roofTex.xmin;
    const rYmin = roofTex.ymin;
    const rXmax = roofTex.xmax;
    const rYmax = roofTex.ymax;

    return [
        // roof
        rotateRoofTex ? square(
            new Vert(vmin.x, vmin.y, vmax.z, roofTex.r, roofTex.g, roofTex.b, rXmin, rYmax),
            new Vert(vmax.x, vmin.y, vmax.z, roofTex.r, roofTex.g, roofTex.b, rXmin, rYmin),
            new Vert(vmax.x, vmax.y, vmax.z, roofTex.r, roofTex.g, roofTex.b, rXmax, rYmin),
            new Vert(vmin.x, vmax.y, vmax.z, roofTex.r, roofTex.g, roofTex.b, rXmax, rYmax),
        ) : square(
            new Vert(vmin.x, vmin.y, vmax.z, roofTex.r, roofTex.g, roofTex.b, rXmin, rYmin),
            new Vert(vmax.x, vmin.y, vmax.z, roofTex.r, roofTex.g, roofTex.b, rXmax, rYmin),
            new Vert(vmax.x, vmax.y, vmax.z, roofTex.r, roofTex.g, roofTex.b, rXmax, rYmax),
            new Vert(vmin.x, vmax.y, vmax.z, roofTex.r, roofTex.g, roofTex.b, rXmin, rYmax),
        ),
        // walls
        square(
            new Vert(vmin.x, vmin.y, vmin.z, wallTex.r, wallTex.g, wallTex.b, wallTex.xmin, wallTex.ymax),
            new Vert(vmax.x, vmin.y, vmin.z, wallTex.r, wallTex.g, wallTex.b, wallTex.xmax, wallTex.ymax),
            new Vert(vmax.x, vmin.y, vmax.z, wallTex.r, wallTex.g, wallTex.b, wallTex.xmax, wallTex.ymin),
            new Vert(vmin.x, vmin.y, vmax.z, wallTex.r, wallTex.g, wallTex.b, wallTex.xmin, wallTex.ymin),
        ),
        square(
            new Vert(vmax.x, vmin.y, vmin.z, wallTex.r, wallTex.g, wallTex.b, wallTex.xmin, wallTex.ymax),
            new Vert(vmax.x, vmax.y, vmin.z, wallTex.r, wallTex.g, wallTex.b, wallTex.xmax, wallTex.ymax),
            new Vert(vmax.x, vmax.y, vmax.z, wallTex.r, wallTex.g, wallTex.b, wallTex.xmax, wallTex.ymin),
            new Vert(vmax.x, vmin.y, vmax.z, wallTex.r, wallTex.g, wallTex.b, wallTex.xmin, wallTex.ymin),
        ),
        square(
            new Vert(vmax.x, vmax.y, vmin.z, wallTex.r, wallTex.g, wallTex.b, wallTex.xmin, wallTex.ymax),
            new Vert(vmin.x, vmax.y, vmin.z, wallTex.r, wallTex.g, wallTex.b, wallTex.xmax, wallTex.ymax),
            new Vert(vmin.x, vmax.y, vmax.z, wallTex.r, wallTex.g, wallTex.b, wallTex.xmax, wallTex.ymin),
            new Vert(vmax.x, vmax.y, vmax.z, wallTex.r, wallTex.g, wallTex.b, wallTex.xmin, wallTex.ymin),
        ),
        square(
            new Vert(vmin.x, vmax.y, vmin.z, wallTex.r, wallTex.g, wallTex.b, wallTex.xmin, wallTex.ymax),
            new Vert(vmin.x, vmin.y, vmin.z, wallTex.r, wallTex.g, wallTex.b, wallTex.xmax, wallTex.ymax),
            new Vert(vmin.x, vmin.y, vmax.z, wallTex.r, wallTex.g, wallTex.b, wallTex.xmax, wallTex.ymin),
            new Vert(vmin.x, vmax.y, vmax.z, wallTex.r, wallTex.g, wallTex.b, wallTex.xmin, wallTex.ymin),
        ),
    ].reduce((a, b) => a.concat(b), []);
}

function drawVerts(verts) {
    const floats = verts.map(v => v.toArray()).reduce((a, b) => a.concat(b), []);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(floats), gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, verts.length);
}

function setupBuffer(useDisplayProps) {
    gl.bindBuffer(gl.ARRAY_BUFFER, renderBuffer);

    const stride = 8*4;
    const colorOffset = 3*4;
    const texCoordOffset = 6*4;

    const posLocation = gl.getAttribLocation(currentProgram, 'pos');
    gl.vertexAttribPointer(
        posLocation,
        3, // components per vert
        gl.FLOAT,
        false,
        stride,
        0);
    gl.enableVertexAttribArray(posLocation);

    if(useDisplayProps) {
        const colorLocation = gl.getAttribLocation(currentProgram, 'color');
        gl.vertexAttribPointer(
            colorLocation,
            3, // components per vert
            gl.FLOAT,
            false,
            stride,
            colorOffset);
        gl.enableVertexAttribArray(colorLocation);

        const texCoordLocation = gl.getAttribLocation(currentProgram, 'texCoord');
        gl.vertexAttribPointer(
            texCoordLocation,
            2, // components per vert
            gl.FLOAT,
            false,
            stride,
            texCoordOffset);
        gl.enableVertexAttribArray(texCoordLocation);
    }
}

function render() {
    /* shadow phase */
    currentProgram = shadowProgram;
    gl.useProgram(shadowProgram);

    gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFramebuffer);
    gl.viewport(0, 0, shadowTexSize, shadowTexSize);

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // set transforms
    gl.uniform1f(gl.getUniformLocation(shadowProgram, 'zRot'), camProps.zRot*Math.PI/180);

    // set vert buffer
    setupBuffer(false);

    world.render();

    /* render phase */
    currentProgram = renderProgram;
    gl.useProgram(renderProgram);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(113/255, 211/255, 244/255, 1.0);
    // Clear the color buffer with specified clear color
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);


    // set transforms
    camProps.viewScaling = [1, canvas.width/canvas.height];
    gl.uniform1f(gl.getUniformLocation(renderProgram, 'zRot'), camProps.zRot*Math.PI/180);
    gl.uniform1f(gl.getUniformLocation(renderProgram, 'pitch'), camProps.pitch*Math.PI/180);
    gl.uniform1f(gl.getUniformLocation(renderProgram, 'fov'), camProps.fov*Math.PI/180);
    gl.uniform1f(gl.getUniformLocation(renderProgram, 'zoom'), camProps.zoom);
    gl.uniform2fv(gl.getUniformLocation(renderProgram, 'viewScaling'), camProps.viewScaling);

    // set textures
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(gl.getUniformLocation(renderProgram, 'textureSampler'), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, shadowDepthTexture);
    gl.uniform1i(gl.getUniformLocation(renderProgram, 'shadowSampler'), 1);

    // set vert buffer
    setupBuffer(true);

    world.render();
}

function step() {
    // camProps.zRot += 0.1;
    render();
    requestAnimationFrame(step);
}


