

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

function render() {
    gl.clearColor(113/255, 211/255, 244/255, 1.0);
    // Clear the color buffer with specified clear color
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

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

    world.render();
}

function step() {
    camProps.zRot += 0.25;
    render();
    requestAnimationFrame(step);
}


