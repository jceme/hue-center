(function () {

    const ROOM_LAYOUT = [
        [Hue.Room.Kitchen, Hue.Room.Bathroom, Hue.Room.Office],
        [Hue.Room.Hallway],
        [Hue.Room.Bedroom, Hue.Room.LivingRoom]
    ];


    function login() {
        const dialog = Site.loginDialog;

        function testAccess() {
            return Hue.fullInfo
                .catch(enterLoginData);
        }

        function enterLoginData(error) {
            if (error) {
                console.warn('Login failed:', error);
                dialog.error = error && error.description || error;
            }

            return dialog.show()
                .then(() => dialog.waitForLoginData())
                .then(() => {
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
        .then(hueInfo => {
            console.log('Logged in. Received Hue information:', hueInfo);

            const rooms = ROOM_LAYOUT
                .map(row =>
                    row
                        .map(roomType => hueInfo.getRoomByType(roomType))
                        .filter(room => room))
                .filter(row => row.length);

            Site.createRooms(rooms, (room, roomSite) => {
                console.log('Creating room', room);
                roomSite.title = room.name;

                room.lights.forEach(lightId => {
                    const light = hueInfo.getLightById(lightId);
                    const lightSite = roomSite.addLight();

                    lightSite.hint = JSON.stringify(light);
                    lightSite.setRGBColor(light.color.r, light.color.g, light.color.b);
                });
            });

            Site.showLoadingAnimation = false;
        })
        .catch(error => {
            alert('Es ist ein Fehler aufgetreten');
            console.error('App error:', error);
        });

})();
