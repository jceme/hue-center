Hue = (function () {

    const STORAGE_ADDRESS = 'hue.address';
    const STORAGE_USER = 'hue.user';

    let bridgeAddress = localStorage.getItem(STORAGE_ADDRESS);
    let user = localStorage.getItem(STORAGE_USER);


    function sendRequest(method, address, path, body) {
        return new Promise((resolve, reject) => {
            if (address == null) {
                return reject(Utils.createReject('No Hue address available'));
            }

            const url = `http://${address}/api${path}`;
            console.log(`Requesting ${url} with method ${method} with data`, body);

            const request = new XMLHttpRequest();
            request.open(method, url, true);
            request.setRequestHeader('Content-Type', 'application/json');
            request.responseType = 'json';
            request.timeout = 30000;

            request.onload = () => {
                console.log('Request done', request.response);
                resolve(request.response);
            };
            request.onerror = () => {
                console.log('Request error');
                reject(Utils.createReject(`Request failed: ${url}`));
            };

            if (body == null) {
                request.send();
            } else {
                request.send(JSON.stringify(body));
            }
        });
    }

    function get(path) {
        return sendRequest('GET', bridgeAddress, `/${user}/${path}`);
    }

    function post(path, data) {
        return sendRequest('POST', bridgeAddress, `/${user}/${path}`, data);
    }

    function put(path, data) {
        return sendRequest('PUT', bridgeAddress, `/${user}/${path}`, data);
    }

    function rejectInvalidResponse(response) {
        const desc = r => r && r.error && r.error.description;
        const error = desc(response) || desc(response[0]);
        return Utils.reject(error ? `Hue request failed: ${error}` : 'Hue request failed', JSON.stringify(response));
    }


    const SUPPORTED_GAMUT = {
        'A': { red: [0.704, 0.296], green: [0.2151, 0.7106], blue: [0.138, 0.08], supportedModels: [ 'LST001', 'LLC010', 'LLC011', 'LLC012', 'LLC006', 'LLC005', 'LLC007', 'LLC014', 'LLC013' ] },
        'B': { red: [0.675, 0.322], green: [0.409, 0.518], blue: [0.167, 0.04], supportedModels: [ 'LCT001', 'LCT007', 'LCT002', 'LCT003', 'LLM001' ] },
        'C': { red: [0.692, 0.308], green: [0.17, 0.7], blue: [0.153, 0.048], supportedModels: [ 'LCT010', 'LCT014', 'LCT015', 'LCT016', 'LCT011', 'LLC020', 'LST002', 'LCT012' ] },
    };

    function getXYInGamut(gamut, x, y) {


        return [x, y];  // TODO
    }

    function xyToRgb(x, y, brightness) {
        const z = 1.0 - x - y;
        const Y = brightness;
        const X = (Y / y) * x;
        const Z = (Y / y) * z;

        let r =  X * 1.656492 - Y * 0.354851 - Z * 0.255038;
        let g = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
        let b =  X * 0.051713 - Y * 0.121364 + Z * 1.011530;

        r = r <= 0.0031308 ? 12.92 * r : (1.0 + 0.055) * Math.pow(r, (1.0 / 2.4)) - 0.055;
        g = g <= 0.0031308 ? 12.92 * g : (1.0 + 0.055) * Math.pow(g, (1.0 / 2.4)) - 0.055;
        b = b <= 0.0031308 ? 12.92 * b : (1.0 + 0.055) * Math.pow(b, (1.0 / 2.4)) - 0.055;

        return {
            r: r * 255,
            g: g * 255,
            b: b * 255
        };
    }

    class HueColor {

        static forLight(light) {
            const model = light.modelid;
            const gamut = Object.values(SUPPORTED_GAMUT).find(x => x.supportedModels.indexOf(model) >= 0);
            if (! gamut) {
                throw new Error(`Unsupported Hue Light Model ID: ${model}`);
            }
            if (light.state.colormode !== 'xy') {
                console.warn('Unexpected color mode in light:', light);
            }

            const [x, y] = getXYInGamut(gamut, light.state.xy[0], light.state.xy[1]);
            const {r, g, b} = xyToRgb(x, y, light.state.bri);

            return {r, g, b};
        }

    }


    class HueInfo {
        constructor(info) {
            this.info = info;
        }

        getRoomByType(roomType) {
            for (const groupId in this.info.groups) {
                const group = this.info.groups[groupId];
                if (group.type === 'Room' && group.class === roomType) {
                    return {
                        id: groupId,
                        name: group.name || roomType,
                        lights: group.lights || [],
                    };
                }
            }
            return null;
        }

        getLightById(lightId) {
            const light = this.info.lights[lightId];

            return light ? {
                id: lightId,
                name: light.name,
                reachable: light.state.reachable,
                on: light.state.on,
                color: HueColor.forLight(light),
            } : null;
        }
    }


    return {

        Room: {
            Kitchen: 'Kitchen',
            Bathroom: 'Bathroom',
            Office: 'Office',
            Hallway: 'Hallway',
            Bedroom: 'Bedroom',
            LivingRoom: 'Living room'
        },

        get fullInfo() {
            return get('')
                .then(response => {
                    if (response && response.config && response.config.apiversion) {
                        return Promise.resolve(new HueInfo(response));
                    }

                    return rejectInvalidResponse(response);
                });
        },

        accessWith(address, userId) {
            localStorage.setItem(STORAGE_ADDRESS, bridgeAddress = address);
            localStorage.setItem(STORAGE_USER, user = userId);

            console.log(`Accessing Hue at ${bridgeAddress} with user ${user}`);
            return Utils.noop;
        },

        createUser(address, identification) {
            return sendRequest('POST', address, '', {
                devicetype: identification

            }).then(result => {
                console.log('Response', result);
                const response = result[0];
                if (response && response.success && response.success.username) {
                    console.log('Created user:', response.success.username);
                    return this.accessWith(address, response.success.username);
                }

                return rejectInvalidResponse(response);
            });
        },

    };
})();
