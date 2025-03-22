import React, { useEffect, useRef } from "react";

// Grad class for noise generation
class Grad {
  x: number;
  y: number;
  z: number;

  constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  dot2(x: number, y: number): number {
    return this.x * x + this.y * y;
  }

  dot3(x: number, y: number, z: number): number {
    return this.x * x + this.y * y + this.z * z;
  }
}

// PCG Random Number Generator
class PcgRandom {
  private state_: Int32Array = new Int32Array(4);

  constructor(t?: number, e?: number, s?: number, n?: number) {
    this.setSeed(t, e, s, n);
  }

  setSeed(t?: number, e?: number, r?: number, a?: number): PcgRandom {
    const n = 335903614;
    const i = 4150755663;

    if (e == null && t == null) {
      e = (4294967295 * Math.random()) >>> 0;
      t = 0;
    } else if (e == null) {
      e = t;
      t = 0;
    }

    if (a == null && r == null) {
      a = this.state_ ? this.state_[3] : i;
      r = this.state_ ? this.state_[2] : n;
    } else if (a == null) {
      a = r;
      r = 0;
    }

    const rVal = r || 0;
    const aVal = a || 0;
    const tVal = t || 0;
    const eVal = e || 0;

    this.state_ = new Int32Array([0, 0, rVal >>> 0, (1 | aVal) >>> 0]);
    this.next_();
    this.addState(
      this.state_,
      this.state_[0],
      this.state_[1],
      tVal >>> 0,
      eVal >>> 0,
    );
    this.next_();
    return this;
  }

  getState(): number[] {
    return [this.state_[0], this.state_[1], this.state_[2], this.state_[3]];
  }

  setState(t: number[]): void {
    this.state_[0] = t[0];
    this.state_[1] = t[1];
    this.state_[2] = t[2];
    this.state_[3] = 1 | t[3];
  }

  private imul(t: number, e: number): number {
    const s = (t >>> 16) & 65535;
    const n = 65535 & t;
    const i = (e >>> 16) & 65535;
    const r = 65535 & e;
    return (n * r + (((s * r + n * i) << 16) >>> 0)) | 0;
  }

  private multiplyWithCarry(
    t: Int32Array | number[],
    e: number,
    s: number,
    n: number,
    i: number,
  ): void {
    const a = ((s >>> 16) * (65535 & i)) >>> 0;
    const h = ((65535 & s) * (i >>> 16)) >>> 0;
    const o = ((65535 & s) * (65535 & i)) >>> 0;
    let uVal = ((s >>> 16) * (i >>> 16) + ((h >>> 16) + (a >>> 16))) >>> 0;

    let h2 = (h << 16) >>> 0;
    let o2 = (o + h2) >>> 0;
    if (h2 >>> 0 > o2 >>> 0) {
      uVal = (uVal + 1) >>> 0;
    }

    const a2 = (a << 16) >>> 0;
    o2 = (o2 + a2) >>> 0;
    if (a2 >>> 0 > o2 >>> 0) {
      uVal = (uVal + 1) >>> 0;
    }

    uVal = (uVal + this.imul(s, n)) >>> 0;
    uVal = (uVal + this.imul(e, i)) >>> 0;

    t[0] = uVal;
    t[1] = o2;
  }

  private addState(
    t: Int32Array | number[],
    e: number,
    s: number,
    n: number,
    i: number,
  ): void {
    const r = (e + n) >>> 0;
    const a = (s + i) >>> 0;
    if (s >>> 0 > a >>> 0) {
      t[0] = (r + 1) | 0;
    } else {
      t[0] = r;
    }
    t[1] = a;
  }

  next_(): number {
    const a = 1481765933;
    const h = 1284865837;

    const t = this.state_[0] >>> 0;
    const n = this.state_[1] >>> 0;

    this.multiplyWithCarry(this.state_, t, n, a, h);
    this.addState(
      this.state_,
      this.state_[0],
      this.state_[1],
      this.state_[2],
      this.state_[3],
    );

    let i = t >>> 18;
    let r = ((n >>> 18) | (t << 14)) >>> 0;
    i = (i ^ t) >>> 0;
    r = (r ^ n) >>> 0;

    const o = ((r >>> 27) | (i << 5)) >>> 0;
    const u = t >>> 27;
    const _ = ((-u >>> 0) & 31) >>> 0;

    return ((o >>> u) | (o << _)) >>> 0;
  }

  integer(t?: number): number {
    if (!t) return this.next_();
    if (((t >>>= 0), 0 === (t & (t - 1)))) return this.next_() & (t - 1);

    let e = 0;
    const s = (-t >>> 0) % t >>> 0;
    for (e = this.next_(); s > e; e = this.next_());
    return e % t;
  }

  number(): number {
    const o = 9007199254740992;
    const u = 134217728;

    const t = 1 * (67108863 & this.next_());
    const e = 1 * (134217727 & this.next_());
    return (t * u + e) / o;
  }
}

// Noise utility class
class NoiseGenerator {
  private perm: number[] = new Array(512);
  private gradP: Grad[] = new Array(512);
  private grad3: Grad[] = [
    new Grad(1, 1, 0),
    new Grad(-1, 1, 0),
    new Grad(1, -1, 0),
    new Grad(-1, -1, 0),
    new Grad(1, 0, 1),
    new Grad(-1, 0, 1),
    new Grad(1, 0, -1),
    new Grad(-1, 0, -1),
    new Grad(0, 1, 1),
    new Grad(0, -1, 1),
    new Grad(0, 1, -1),
    new Grad(0, -1, -1),
  ];
  private p: number[] = [
    151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140,
    36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120,
    234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
    88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71,
    134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133,
    230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161,
    1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130,
    116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250,
    124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227,
    47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44,
    154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98,
    108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34,
    242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14,
    239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121,
    50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243,
    141, 128, 195, 78, 66, 215, 61, 156, 180,
  ];
  private F2 = 0.5 * (Math.sqrt(3) - 1);
  private G2 = (3 - Math.sqrt(3)) / 6;
  private F3 = 1 / 3;
  private G3 = 1 / 6;

  constructor() {
    this.seed(0);
  }

  seed(seed: number): void {
    if (seed > 0 && seed < 1) {
      // Scale the seed out
      seed *= 65536;
    }

    seed = Math.floor(seed);
    if (seed < 256) {
      seed |= seed << 8;
    }

    for (let i = 0; i < 256; i++) {
      let v;
      if (i & 1) {
        v = this.p[i] ^ (seed & 255);
      } else {
        v = this.p[i] ^ ((seed >> 8) & 255);
      }

      this.perm[i] = this.perm[i + 256] = v;
      this.gradP[i] = this.gradP[i + 256] = this.grad3[v % 12];
    }
  }

  simplex2(xin: number, yin: number): number {
    let n0, n1, n2; // Noise contributions from the three corners
    // Skew the input space to determine which simplex cell we're in
    const s = (xin + yin) * this.F2; // Hairy factor for 2D
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * this.G2;
    const x0 = xin - i + t; // The x,y distances from the cell origin, unskewed.
    const y0 = yin - j + t;
    // For the 2D case, the simplex shape is an equilateral triangle.
    // Determine which simplex we are in.
    let i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
    if (x0 > y0) {
      // lower triangle, XY order: (0,0)->(1,0)->(1,1)
      i1 = 1;
      j1 = 0;
    } else {
      // upper triangle, YX order: (0,0)->(0,1)->(1,1)
      i1 = 0;
      j1 = 1;
    }
    // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
    // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
    // c = (3-sqrt(3))/6
    const x1 = x0 - i1 + this.G2; // Offsets for middle corner in (x,y) unskewed coords
    const y1 = y0 - j1 + this.G2;
    const x2 = x0 - 1 + 2 * this.G2; // Offsets for last corner in (x,y) unskewed coords
    const y2 = y0 - 1 + 2 * this.G2;
    // Work out the hashed gradient indices of the three simplex corners
    const ii = i & 255;
    const jj = j & 255;
    const gi0 = this.gradP[ii + this.perm[jj]];
    const gi1 = this.gradP[ii + i1 + this.perm[jj + j1]];
    const gi2 = this.gradP[ii + 1 + this.perm[jj + 1]];
    // Calculate the contribution from the three corners
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 < 0) {
      n0 = 0;
    } else {
      t0 *= t0;
      n0 = t0 * t0 * gi0.dot2(x0, y0); // (x,y) of grad3 used for 2D gradient
    }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 < 0) {
      n1 = 0;
    } else {
      t1 *= t1;
      n1 = t1 * t1 * gi1.dot2(x1, y1);
    }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 < 0) {
      n2 = 0;
    } else {
      t2 *= t2;
      n2 = t2 * t2 * gi2.dot2(x2, y2);
    }
    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 70 * (n0 + n1 + n2);
  }

  simplex3(xin: number, yin: number, zin: number): number {
    let n0, n1, n2, n3; // Noise contributions from the four corners

    // Skew the input space to determine which simplex cell we're in
    const s = (xin + yin + zin) * this.F3; // Hairy factor for 2D
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const k = Math.floor(zin + s);

    const t = (i + j + k) * this.G3;
    const x0 = xin - i + t; // The x,y distances from the cell origin, unskewed.
    const y0 = yin - j + t;
    const z0 = zin - k + t;

    // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
    // Determine which simplex we are in.
    let i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
    let i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
    if (x0 >= y0) {
      if (y0 >= z0) {
        i1 = 1;
        j1 = 0;
        k1 = 0;
        i2 = 1;
        j2 = 1;
        k2 = 0;
      } else if (x0 >= z0) {
        i1 = 1;
        j1 = 0;
        k1 = 0;
        i2 = 1;
        j2 = 0;
        k2 = 1;
      } else {
        i1 = 0;
        j1 = 0;
        k1 = 1;
        i2 = 1;
        j2 = 0;
        k2 = 1;
      }
    } else {
      if (y0 < z0) {
        i1 = 0;
        j1 = 0;
        k1 = 1;
        i2 = 0;
        j2 = 1;
        k2 = 1;
      } else if (x0 < z0) {
        i1 = 0;
        j1 = 1;
        k1 = 0;
        i2 = 0;
        j2 = 1;
        k2 = 1;
      } else {
        i1 = 0;
        j1 = 1;
        k1 = 0;
        i2 = 1;
        j2 = 1;
        k2 = 0;
      }
    }
    // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
    // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
    // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
    // c = 1/6.
    const x1 = x0 - i1 + this.G3; // Offsets for second corner
    const y1 = y0 - j1 + this.G3;
    const z1 = z0 - k1 + this.G3;

    const x2 = x0 - i2 + 2 * this.G3; // Offsets for third corner
    const y2 = y0 - j2 + 2 * this.G3;
    const z2 = z0 - k2 + 2 * this.G3;

    const x3 = x0 - 1 + 3 * this.G3; // Offsets for fourth corner
    const y3 = y0 - 1 + 3 * this.G3;
    const z3 = z0 - 1 + 3 * this.G3;

    // Work out the hashed gradient indices of the four simplex corners
    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;
    const gi0 = this.gradP[ii + this.perm[jj + this.perm[kk]]];
    const gi1 = this.gradP[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1]]];
    const gi2 = this.gradP[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2]]];
    const gi3 = this.gradP[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1]]];

    // Calculate the contribution from the four corners
    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 < 0) {
      n0 = 0;
    } else {
      t0 *= t0;
      n0 = t0 * t0 * gi0.dot3(x0, y0, z0); // (x,y) of grad3 used for 2D gradient
    }
    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 < 0) {
      n1 = 0;
    } else {
      t1 *= t1;
      n1 = t1 * t1 * gi1.dot3(x1, y1, z1);
    }
    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 < 0) {
      n2 = 0;
    } else {
      t2 *= t2;
      n2 = t2 * t2 * gi2.dot3(x2, y2, z2);
    }
    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 < 0) {
      n3 = 0;
    } else {
      t3 *= t3;
      n3 = t3 * t3 * gi3.dot3(x3, y3, z3);
    }
    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 32 * (n0 + n1 + n2 + n3);
  }

  // Perlin noise functions
  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return (1 - t) * a + t * b;
  }

  perlin2(x: number, y: number): number {
    // Find unit grid cell containing point
    let X = Math.floor(x);
    let Y = Math.floor(y);
    // Get relative xy coordinates of point within that cell
    x = x - X;
    y = y - Y;
    // Wrap the integer cells at 255 (smaller integer period can be introduced here)
    X = X & 255;
    Y = Y & 255;

    // Calculate noise contributions from each of the four corners
    const n00 = this.gradP[X + this.perm[Y]].dot2(x, y);
    const n01 = this.gradP[X + this.perm[Y + 1]].dot2(x, y - 1);
    const n10 = this.gradP[X + 1 + this.perm[Y]].dot2(x - 1, y);
    const n11 = this.gradP[X + 1 + this.perm[Y + 1]].dot2(x - 1, y - 1);

    // Compute the fade curve value for x
    const u = this.fade(x);

    // Interpolate the four results
    return this.lerp(
      this.lerp(n00, n10, u),
      this.lerp(n01, n11, u),
      this.fade(y),
    );
  }

  perlin3(x: number, y: number, z: number): number {
    // Find unit grid cell containing point
    let X = Math.floor(x);
    let Y = Math.floor(y);
    let Z = Math.floor(z);
    // Get relative xyz coordinates of point within that cell
    x = x - X;
    y = y - Y;
    z = z - Z;
    // Wrap the integer cells at 255 (smaller integer period can be introduced here)
    X = X & 255;
    Y = Y & 255;
    Z = Z & 255;

    // Calculate noise contributions from each of the eight corners
    const n000 = this.gradP[X + this.perm[Y + this.perm[Z]]].dot3(x, y, z);
    const n001 = this.gradP[X + this.perm[Y + this.perm[Z + 1]]].dot3(
      x,
      y,
      z - 1,
    );
    const n010 = this.gradP[X + this.perm[Y + 1 + this.perm[Z]]].dot3(
      x,
      y - 1,
      z,
    );
    const n011 = this.gradP[X + this.perm[Y + 1 + this.perm[Z + 1]]].dot3(
      x,
      y - 1,
      z - 1,
    );
    const n100 = this.gradP[X + 1 + this.perm[Y + this.perm[Z]]].dot3(
      x - 1,
      y,
      z,
    );
    const n101 = this.gradP[X + 1 + this.perm[Y + this.perm[Z + 1]]].dot3(
      x - 1,
      y,
      z - 1,
    );
    const n110 = this.gradP[X + 1 + this.perm[Y + 1 + this.perm[Z]]].dot3(
      x - 1,
      y - 1,
      z,
    );
    const n111 = this.gradP[X + 1 + this.perm[Y + 1 + this.perm[Z + 1]]].dot3(
      x - 1,
      y - 1,
      z - 1,
    );

    // Compute the fade curve value for x, y, z
    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    // Interpolate
    return this.lerp(
      this.lerp(this.lerp(n000, n100, u), this.lerp(n001, n101, u), w),
      this.lerp(this.lerp(n010, n110, u), this.lerp(n011, n111, u), w),
      v,
    );
  }
}

interface NoiseCanvasProps {
  frequency?: number;
  speed?: number;
  className?: string;
}

const NoiseCanvas: React.FC<NoiseCanvasProps> = ({
  frequency = 100,
  speed = 25,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const noiseRef = useRef<NoiseGenerator>(new NoiseGenerator());
  const rngRef = useRef<PcgRandom>(new PcgRandom());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    // Initialize RNG and noise
    const seed = 123456 * Math.random();
    rngRef.current.setSeed(seed);
    noiseRef.current.seed(rngRef.current.number());

    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Create ImageData
    let imagedata = context.createImageData(canvas.width, canvas.height);

    // Create the image
    const createImage = (offset: number) => {
      const width = canvas.width;
      const height = canvas.height;

      // Loop over all of the pixels
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          // Generate noise value
          let value = noiseRef.current.simplex3(
            x / frequency,
            y / frequency,
            offset / (5000 / speed),
          );
          value = ((value + 1) / 2) * 256; // From [-1, 1] to [0, 255]

          // Set color values
          let red = 0;
          let green = value;
          let blue = 256 - value;

          // Set pixel data
          const pixelindex = (y * width + x) * 4;
          imagedata.data[pixelindex] = red; // Red
          imagedata.data[pixelindex + 1] = green; // Green
          imagedata.data[pixelindex + 2] = blue; // Blue
          imagedata.data[pixelindex + 3] = 255; // Alpha
        }
      }
    };

    // Main animation loop
    const animate = (timestamp: number) => {
      // Create the image
      createImage(Math.floor(timestamp / 15));

      // Draw the image data to the canvas
      context.putImageData(imagedata, 0, 0);

      // Request next frame
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, [frequency, speed]);

  return <canvas ref={canvasRef} className={className} id="canvas" />;
};

export default NoiseCanvas;
