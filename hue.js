Hue = (function() {

    let bridgeAddress = localStorage.getItem('hue.address');
    let user = localStorage.getItem('hue.user');


    function sendRequest(method, address, path, body) {
        return new Promise((resolve, reject) => {
            if (address == null) {
                return reject(Utils.createReject('No Hue address available'));
            }

            const url = `http://${address}/api${path}`;
            console.log(`Requesting ${url} with method ${method} with data`, body);

            const request = new XMLHttpRequest();
            request.open(method, url);
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
        return Utils.reject(error ? `Hue request failed: ${error}` : 'Hue request failed',  JSON.stringify(response));
    }


    return {

        get fullInfo() {
            return get('')
                .then(response => {
                    if (response && response.config && response.config.apiversion) {
                        return Promise.resolve(response);
                    }

                    return rejectInvalidResponse(response);
                });
        },

        accessWith(address, userId) {
            localStorage.setItem('hue.address', address);
            bridgeAddress = address;
            localStorage.setItem('hue.user', userId);
            user = userId;

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
