Hue = (function () {

    const HUE_BRIDGE_DISCOVERY_URL = 'https://www.meethue.com/api/nupnp';

    const STORAGE_ADDRESS = 'hue.address';
    const STORAGE_USER = 'hue.user';

    let bridgeAddress = localStorage.getItem(STORAGE_ADDRESS);
    let user = localStorage.getItem(STORAGE_USER);


    function sendRequest(method, url, body) {
        return new Promise((resolve, reject) => {
            console.log(`Requesting ${url} with method ${method} and data`, body);

            const request = new XMLHttpRequest();
            request.open(method, url, true);
            if (body != null) {
                request.setRequestHeader('Content-Type', 'application/json');
            }
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

    function sendApiRequest(method, address, path, body) {
        if (address == null) {
            return Utils.reject('No Hue address available');
        }

        return sendRequest(method, `http://${address}/api${path}`, body);
    }

    function get(path) {
        return sendApiRequest('GET', bridgeAddress, `/${user}/${path}`);
    }

    function post(path, data) {
        return sendApiRequest('POST', bridgeAddress, `/${user}/${path}`, data);
    }

    function put(path, data) {
        return sendApiRequest('PUT', bridgeAddress, `/${user}/${path}`, data);
    }

    function rejectInvalidResponse(response) {
        const desc = r => r && r.error && r.error.description;
        const error = desc(response) || desc(response[0]);
        return Utils.reject(error ? `Hue request failed: ${error}` : 'Hue request failed', JSON.stringify(response));
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

            return light ? Utils.cachedResult({
                id: lightId,
                name: light.name,
                reachable: light.state.reachable,
                on: light.state.on,
            }, {
                color: () => HueColor.forLight(light),
            }) : null;
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

        discoverBridge() {
            return sendRequest('GET', HUE_BRIDGE_DISCOVERY_URL)
                .then(result => {
                    const response = result[0];
                    if (response && response.internalipaddress) {
                        console.log('Created user:', response.internalipaddress);
                        return response.internalipaddress;
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
            return sendApiRequest('POST', address, '', {
                devicetype: identification

            }).then(result => {
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
