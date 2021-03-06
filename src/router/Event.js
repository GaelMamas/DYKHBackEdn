/**
 * Created by vm32776n on 10/08/2017.
 */
let mongoose = require('mongoose');
let express = require("express");
let EventModel = require('../Model/EventModel');
let UserModel = require('../Model/UserModel');
let router = express.Router();
mongoose.Promise = require('bluebird');

import {execError} from '../Utilitaries/ErrorHandling';
import OperationCallback from "../Callbacks/OperationCallback";
import {
    subDeleteEventFunction, subPostEventFunction,
    subPutEventFunction
} from '../Utilitaries/SubFunctions'


let constants = JSON.parse(require('fs').readFileSync('./src/Constants/config.json'));


let buildType = process.argv[2] || 'local';
let dbUri;

switch (buildType) {

    case 'dev':

        console.log('welcome to dev env');

        dbUri = 'mongodb://' + constants.dev.db.DB_USER + ':'
            + constants.dev.db.DB_PASS + '@' + constants.dev.db.DB_HOST + ':'
            + constants.dev.db.DB_PORT + '/' + constants.dev.db.DB_NAME;

        break;

    case 'prod':
        console.log("So far no server is available :(");
        break

    case 'local':
    default:

        console.log("welcome to local env");

        dbUri = 'mongodb://' + constants.local.db.DB_HOST + '/' + constants.local.db.DB_NAME;

        break
}

console.log("dbUri = " + dbUri);

mongoose.connect(dbUri, {useMongoClient: true,});


router.get("/getEvents", function (req, res) {
    EventModel.find({}).populate('user').exec(function (err, events) {
        if (err) {
            execError(err.message, res);
        } else {
            console.log('Events found = ' + events.length);
            res.json(events);
        }
    });
}).get("/getEventsByTableItem/:item/:itemValue", function (req, res) {

    let filter = JSON.parse('{"' + req.params.item + '":"' + req.params.itemValue + '"}');
    console.log(filter);
    EventModel.find(filter)
        .exec(function (err, event) {
            if (err) {
                execError(err.message, res);
            } else {
                console.log('Event found');
                res.json(event);
            }
        });
}).get("/getEventById/:eventId", function (req, res) {
    EventModel.findOne({_id: req.params["eventId"]}).exec(function (err, event) {
        if (err) {
            execError(err.message, res);
        } else {
            console.log('Event found');
            res.json(event);
        }
    });
}).get("/getEventsByUser/:userId", function (req, res) {
    if (req.body) {

        UserModel.find({_id: req.params["userId"]}).exec(function (err, user) {
            if (err) {
                execError(err.message, res);
            } else {
                EventModel.find({user: user}).populate("user").exec(function (err, events) {
                    if (err) {
                        execError(err.message, res);
                    } else {

                        if (events[0] === undefined) {
                            console.log("This user has not any event");
                        } else {
                            console.log('Events for this user have been found');
                            console.log(events.user);
                        }
                        res.json(events);
                    }
                });
            }
        });
    } else {
        res.json({"error": true, "message": "The body is not correct"});
    }
});

router.post("/postAnEvent", function (req, res) {
    console.log(req.body);
    if (req.body) {
        let operationCallback = new OperationCallback(res);
        subPostEventFunction(req.body, operationCallback, true);
    } else {
        console.log('Something gets wrong');
    }
}).post("/postEventsArray", function (req, res) {
    console.log(req.body);
    if (req.body) {
        let operationCallback = new OperationCallback(res);
        for (let i = 0; i < req.body.length; i++) {
            subPostEventFunction(req.body[i], operationCallback, i === req.body.length - 1);
        }
    } else {
        console.log('Something gets wrong');
    }
});

router.put("/putAnEvent", function (req, res) {
    console.log(req);
    if (req.body) {
        let operationCallback = new OperationCallback(res);
        subPutEventFunction(req.body, operationCallback, true);
    } else {
        res.json({"error": true, "message": "The body is not correct"});
    }
}).put('/putManyEvents', function (req, res) {
    console.log(req.body)
    if (req.body) {
        let operationCallback = new OperationCallback(res);
        for (let i = 0; i < req.body.length; i++) {
            subPutEventFunction(req.body[i], operationCallback, i === req.body.length - 1);
        }
    } else {
        res.json({"error": true, "message": "The body is not correct"});
    }
});

router.delete("/deleteAnEvent", function (req, res) {
    console.log(req.body);
    if (req.body) {
        let operationCallback = new OperationCallback(res);
        subDeleteEventFunction(req.body, operationCallback, true);
    } else {
        res.json({"error": true, "message": "The body is not correct"});
    }
}).delete('/deleteManyEvents', function (req, res) {
    console.log(req.body);
    if (req.body) {
        let operationCallback = new OperationCallback(res);
        for (let i = 0; i < req.body.length; i++) {
            subDeleteEventFunction(req.body[i], operationCallback, i === req.body.length - 1);
        }
    } else {
        res.json({"error": true, "message": "The body is not correct"});
    }
});


module.exports = router;