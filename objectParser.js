function objectToVertArray(objectName, rot=0, translateX=0, translateY=0) {
	const source = objectFiles[objectName];
	const lines = source.split("\n");

	const vertData = [null];
	const textData = [null];
	const faceData = [];

	lines.forEach(l => {
		const parts = l.split(" ");
		if(parts[0] == "v") {
			vertData.push([+parts[1], -parts[3], +parts[2]]);
		}else if(parts[0] == "vt") {
			textData.push([+parts[1], 1-parts[2]].map(n => n*16));
		}else if(parts[0] == "f") {
			faceData.push(parts.slice(1).map(v => v.split('/').map(n => +n)));
		}else{
			return;
		}
	});

	// transform the verts
	const cosR = Math.cos(rot*Math.PI/2);
	const sinR = Math.sin(rot*Math.PI/2);
	vertData.forEach(v => {
		if(v == null) return;
		[v[0], v[1]] = [
			v[0]*cosR - v[1]*sinR,
			v[0]*sinR + v[1]*cosR
		];
		v[0] += translateX;
		v[1] += translateY;
	});

	const result = [];

	faceData.forEach(f => {
		const verts = f.map(v => {
			const pos = vertData[v[0]];
			const tex = textData[v[1]];
			return new Vert(pos[0], pos[1], pos[2], tex[0], tex[1]);
		});

		for(let i=2; i<f.length; i++) {
			result.push(verts[0], verts[i-1], verts[i]);
		}
	});

	return result;
}
