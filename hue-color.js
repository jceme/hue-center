HueColor = (function () {

    const SUPPORTED_GAMUT = [
        {
            name: 'A',
            red: [0.704, 0.296],
            green: [0.2151, 0.7106],
            blue: [0.138, 0.08],
            supportedModels: ['LST001', 'LLC010', 'LLC011', 'LLC012', 'LLC006', 'LLC005', 'LLC007', 'LLC014', 'LLC013']
        },
        {
            name: 'B',
            red: [0.675, 0.322],
            green: [0.409, 0.518],
            blue: [0.167, 0.04],
            supportedModels: ['LCT001', 'LCT007', 'LCT002', 'LCT003', 'LLM001']
        },
        {
            name: 'C',
            red: [0.692, 0.308],
            green: [0.17, 0.7],
            blue: [0.153, 0.048],
            supportedModels: ['LCT010', 'LCT014', 'LCT015', 'LCT016', 'LCT011', 'LLC020', 'LST002', 'LCT012']
        },
    ];


    function subtract([Ax, Ay], [Bx, By]) {
        return [Ax - Bx, Ay - By];
    }

    function dot([Ax, Ay], [Bx, By]) {
        return Ax * Bx + Ay * By;
    }

    function isInsideTriangle(A, B, C, P) {
        // Compute vectors
        const v0 = subtract(C, A);
        const v1 = subtract(B, A);
        const v2 = subtract(P, A);

        // Compute dot products
        const dot00 = dot(v0, v0);
        const dot01 = dot(v0, v1);
        const dot02 = dot(v0, v2);
        const dot11 = dot(v1, v1);
        const dot12 = dot(v1, v2);

        // Compute barycentric coordinates
        const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
        const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
        const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

        // Check if point is in triangle
        return u >= 0 && v >= 0 && u + v < 1;
    }


    function getClosestPointOnLine([Ax, Ay], [Bx, By], [Px, Py]) {
        // P':= A + t B && (P' - P) -> min && 0 <= t <= 1
        let t = (-Ax * Bx + By * (Py - Ay) + Px * Bx) / (Bx * Bx + By * By);
        t = Math.min(Math.max(t, 0), 1);
        const dx = Ax + t * Bx - Px,
            dy = Ay + t * By - Py;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return {point: [Ax + t * Bx, Ay + t * By], distance};
    }

    function getClosestTrianglePoint(A, B, C, P) {
        if (isInsideTriangle(A, B, C, P)) {
            console.log("Point ", P, " is inside of ", A, B, C);
            return P;
        }

        console.log("Point ", P, " is OUTSIDE of ", A, B, C);
        return [
            getClosestPointOnLine(A, B, P),
            getClosestPointOnLine(B, C, P),
            getClosestPointOnLine(C, A, P)
        ]
            .reduce((prev, cur) => cur.distance < prev.distance ? cur : prev)
            .point;
    }


    function getXYInGamut(gamut, x, y) {
        return getClosestTrianglePoint(gamut.red, gamut.green, gamut.blue, [x, y]);
    }

    function xyToRgb(x, y, brightness) {
        const z = 1.0 - x - y;
        const Y = brightness / 254;
        const X = (Y / y) * x;
        const Z = (Y / y) * z;

        // Convert to RGB using Wide RGB D65 conversion
        let r = X * 1.656492 - Y * 0.354851 - Z * 0.255038;
        let g = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
        let b = X * 0.051713 - Y * 0.121364 + Z * 1.011530;
        // let r = X * 1.612 - Y * 0.203 - Z * 0.302;
        // let g = X * -0.509 + Y * 1.412 + Z * 0.066;
        // let b = X * 0.026 - Y * 0.072 + Z * 0.962;

        // If red, green or blue is larger than 1.0 set it back to the maximum of 1.0
        if (r > b && r > g && r > 1.0) {

            g = g / r;
            b = b / r;
            r = 1.0;
        }
        else if (g > b && g > r && g > 1.0) {
            r = r / g;
            b = b / g;
            g = 1.0;
        }
        else if (b > r && b > g && b > 1.0) {
            r = r / b;
            g = g / b;
            b = 1.0;
        }

        // Reverse gamma correction
        r = r <= 0.0031308 ? 12.92 * r : (1.0 + 0.055) * Math.pow(r, (1.0 / 2.4)) - 0.055;
        g = g <= 0.0031308 ? 12.92 * g : (1.0 + 0.055) * Math.pow(g, (1.0 / 2.4)) - 0.055;
        b = b <= 0.0031308 ? 12.92 * b : (1.0 + 0.055) * Math.pow(b, (1.0 / 2.4)) - 0.055;

        return {
            r: r * 255,
            g: g * 255,
            b: b * 255
        };
        // return {r, g, b};
    }

    return {
        forLight(light) {
            const model = light.modelid;
            const gamut = SUPPORTED_GAMUT.find(x => x.supportedModels.indexOf(model) >= 0);
            if (!gamut) {
                throw new Error(`Unsupported Hue Light Model ID: ${model}`);
            }
            if (light.state.colormode !== 'xy') {
                console.warn('Unexpected color mode in light:', light);
            }

            console.log('Testing point in Gamut ' + gamut.name);
            const [x, y] = getXYInGamut(gamut, light.state.xy[0], light.state.xy[1]);
            const {r, g, b} = xyToRgb(x, y, light.state.bri);

            return {r, g, b};
        },
    };
})();
