const express = require('express'),
randomstring = require('randomstring');

const app = express(),
    router = express.Router();

const users = {};
let buttonPressed = false;


router.route('/')
    .post(register_user)
    .all(error_unauthorized);

router.param('username', (req, res, next, username) => {
    if (username in users) {
        next();
    } else {
        error_unauthorized(req, res, next);
    }
});

router.route('/:username')
    .get((req, res) => {
        res.json({
            lights: [],
            rooms: []
        });
    });


function error_unauthorized(req, res) {
    res.json([{
        error: {
            type: 1,
            address: req.path,
            description: "unauthorized user"
        }
    }]);
}

function register_user(req, res, next) {
    const devicetype = req.body && req.body.devicetype;
    if (typeof devicetype !== 'string') {
        next();
        return;
    }

    console.log(`Requested register new user: ${devicetype}`);

    if (!buttonPressed) {
        buttonPressed = true;
        setTimeout(() => {
            buttonPressed = false;
            console.log('Button is not pressed again');
        }, 60000);
        console.log('Button pressed for 1 min. Re-try registration.');

        res.json([{
            error: {
                type: 101,
                address: '',
                description: 'link button not pressed'
            }
        }]);
        return;
    }

    let username = null;

    for (const name in users) {
        if (users[name] === devicetype) {
            username = name;
            break;
        }
    }

    if (username == null) {
        username = randomstring.generate({
            length: 32,
            charset: 'hex'
        });

        users[username] = devicetype;
        console.log(`Registered new user ${username} (${devicetype})`);
    } else {
        console.log(`Using existing user ${username} (${devicetype})`);
    }
    res.json([{
        success: {
            username
        }
    }]);
}


app.use(express.json());
app.use('/api', router);
app.use('/api', router);

app.listen(8080, () => {
    console.log("Server ready on http://localhost:8080/");
});
