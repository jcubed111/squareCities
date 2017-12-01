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
            this.tx/16.0,
            this.ty/16.0
        ];
    }
}
