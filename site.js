Site = (function () {

    let bridgeAddress = null;
    let findBridgeAddress = (bridgeAddressProvider) => {
        if (!bridgeAddressProvider) {
            return Utils.noop;
        }

        findBridgeAddress = Utils.noop;

        return bridgeAddressProvider()
            .then(address => {
                bridgeAddress = address;
            }, () => Utils.noop);
    };

    return {

        get loginDialog() {
            const loginDialog = $('#login-dialog'),
                submitButton = loginDialog.find('button');

            function checkCanLogin() {
                const canLogin = loginDialog.find('.collapse.in .form-control:invalid').length === 0;
                submitButton.prop('disabled', !canLogin);
            }

            loginDialog.find('.form-control').each(function () {
                const input = $(this);

                input.on('keyup change', Utils.debounce(300, () => {
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

                bridgeAddressProvider: null,

                get createNew() {
                    return /\bnew$/.test(loginDialog.find('.collapse.in').attr('id'));
                },

                get userId() {
                    return loginDialog.find('.collapse.in').find('[name=user-id]').val();
                },

                get bridgeAddress() {
                    return loginDialog.find('.collapse.in').find('[name=bridge-address]').val();
                },

                set bridgeAddress(address) {
                    return loginDialog.find('.collapse').find('[name=bridge-address]').val(address || '');
                },

                get userIdentification() {
                    return loginDialog.find('.collapse.in').find('[name=user-identification]').val();
                },

                show() {
                    return findBridgeAddress(this.bridgeAddressProvider)
                        .then(() => {
                            if (bridgeAddress != null) {
                                this.bridgeAddress = bridgeAddress;
                            }
                            checkCanLogin();
                        })
                        .then(() => new Promise(resolve => {
                            loginDialog.one('shown.bs.modal', () => {
                                resolve(this);
                            });

                            loginDialog.modal('show');
                        }));
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

        set showLoadingAnimation(enabled) {
            $('#loading').toggleClass('hidden', !enabled);
        },

        createRooms(layout, creator) {
            const roomsContainer = $('#rooms');
            layout.forEach(row => {
                const roomsRow = $('<div class="row">');
                roomsContainer.append(roomsRow);
                const colSize = Math.floor(12 / row.length);
                row.forEach(roomInfo => {
                    const roomDiv = Utils.template('#roomPanel'),
                        body = roomDiv.find('.panel-body');
                    roomsRow.append(roomDiv);
                    roomDiv.addClass(`col-md-${colSize}`);

                    creator(roomInfo, {
                        set title(title) {
                            roomDiv.find('h3.panel-title').text(title || '');
                        },

                        addLight() {
                            const light = Utils.template('#lightbulb');
                            body.append(light);
                            return {
                                set hint(hint) {
                                    light.attr('title', hint || '');
                                },

                                setRGBColor(r, g, b) {
                                    light.find('.bulb').css('fill', `rgb(${r}, ${g}, ${b})`);
                                },

                                setHslColor(h, s, l) {
                                    light.find('.bulb').css('fill', `hsl(${h}, ${s}%, ${l}%)`);
                                },
                            };
                        },
                    });
                });
            });
        },

    };
})();
