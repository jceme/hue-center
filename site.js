Site = (function() {

    return {

        get loginDialog() {
            const loginDialog = $('#login-dialog'),
                submitButton = loginDialog.find('button');

            function checkCanLogin() {
                const canLogin = loginDialog.find('.collapse.in .form-control:invalid').length === 0;
                submitButton.prop('disabled', !canLogin);
            }

            loginDialog.find('.form-control').each(function() {
                const input = $(this);

                input.on('keyup', Utils.debounce(300, () => {
                    const invalid = input.is(':invalid');
                    const grp = input.closest('.form-group');
                    grp.toggleClass('has-success', !invalid);
                    grp.toggleClass('has-error', !!invalid);

                    checkCanLogin();
                }));
            });

            loginDialog
                .find('.collapse')
                .on('shown.bs.collapse   hide.bs.collapse', (e) => {
                    if (e.type === 'shown') {
                        checkCanLogin();
                    } else {
                        submitButton.prop('disabled', true);
                    }
                });

            return {

                get createNew() {
                    return /\bnew$/.test(loginDialog.find('.collapse.in').attr('id'));
                },

                get userId() {
                    return loginDialog.find('.collapse.in').find('[name=user-id]').val();
                },

                get bridgeAddress() {
                    return loginDialog.find('.collapse.in').find('[name=bridge-address]').val();
                },

                get userIdentification() {
                    return loginDialog.find('.collapse.in').find('[name=user-identification]').val();
                },

                show() {
                    return new Promise(resolve => {
                        checkCanLogin();
                        loginDialog.one('shown.bs.modal', () => {
                            resolve(this);
                        });

                        loginDialog.modal('show');
                    });
                },

                set error(msg) {
                    loginDialog.find('#login-dialog-error').text(msg || '');
                },

                waitForLoginData() {
                    return new Promise(resolve => {
                        submitButton.one('click', () => {
                            submitButton.prop('disabled', true);
                            loginDialog.one('hidden.bs.modal', () => {
                                resolve(this);
                            });

                            loginDialog.modal('hide');
                        });
                    });
                },

            };
        },

        debug(msg) {
            $('#debug').text(msg || '');
        },

    };
})();
