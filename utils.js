Utils = (function() {

    return {

        get noop() {
            return Promise.resolve();
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
        }

    };
})();
