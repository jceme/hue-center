(function() {

    function login() {
        const dialog = Site.loginDialog;

        function testAccess() {
            return Hue.fullInfo
                .catch(enterLoginData)
        }

        function enterLoginData(error) {
            dialog.error = error;

            return dialog.show()
                .then(() => dialog.waitForLoginData())
                .then(() => {
                    // TODO wait dialog

                    if (dialog.createNew) {
                        return Hue.createUser(dialog.bridgeAddress, dialog.userIdentification);
                    }

                    return Hue.accessWith(dialog.bridgeAddress, dialog.userId);
                })
                .then(testAccess, enterLoginData);
        }

        return testAccess();
    }


    login()
        .then(fullInfo => {
            console.log('Logged in');
            Site.debug(JSON.stringify(fullInfo, null, 4));
        })
        .catch(error => {
            console.error('App error:', error);
        });

})();
