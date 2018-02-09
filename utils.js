Utils = (function () {

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

            return function () {
                if (timer != null) {
                    clearTimeout(timer);
                }
                timer = setTimeout(() => {
                    timer = null;
                    callback.apply(this, arguments);
                }, delay);
            };
        },

        template(selector) {
            return $($(selector).prop('content')).children().clone();
        },

        cachedResult(target, initializers) {
            Object.entries(initializers).forEach(([propertyName, initializer]) => {
                Object.defineProperty(target, propertyName, {
                    enumerable: true,
                    configurable: true,
                    get() {
                        const result = initializer();
                        Object.defineProperty(target, propertyName, {
                            enumerable: true,
                            configurable: true,
                            value: result,
                            writable: true,
                        });
                        return result;
                    }
                });
            });
            return target;
        },

    };
})();
