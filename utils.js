Utils = (function() {

    return {

        get noop() {
            return Promise.resolve();
        },

        reject(description, error) {
            return Promise.reject(this.createReject(description, error));
        },

        createReject(description, error) {
            return {
                description,
                error
            };
        },

        debounce(delay, callback) {
            let timer = null;

            return function() {
                if (timer != null) {
                    clearTimeout(timer);
                }
                timer = setTimeout(() => {
                    timer = null;
                    callback.apply(this, arguments);
                }, delay);
            };
        },

    };
})();
