const express = require('express');
const bodyParser = require('body-parser');
const app = express();
var xlsx = require('node-xlsx');
const clonedeep = require('lodash.clonedeep');
const axios = require("axios");
var brain = require("brain.js")
const baseApi = "https://api.dialogflow.com/v1";
var fs =require("fs");
var objEN = {
    "entries": [],
    "name": ""
}
var objIN = {
    "contexts": [
    ],
    "events": [],
    "fallbackIntent": false,
    "name": "",
    "priority": 500000,
    "responses": [

    ],
    "templates": [

    ],
    "userSays": [
        {
            "count": 0,
            "data": [
                {

                }
            ]
        }
    ],
    "webhookForSlotFilling": false,
    "webhookUsed": false
}

const userSays = {
    "count": 0,
    "data": [

    ]
}
app.use(bodyParser.json());
app.post('/api/uploadEN', async (req, res) => {
    var ENcollection = [];
    const { token, path } = req.body;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': token
    }
    var data = xlsx.parse(path);
    var entities = data.filter(e => {
        return e.name == "Entities"
    })
    entities[0].data.forEach(entity => {
        let obj = clonedeep(objEN);
        var exists = ENcollection.find(e => {
            return entity[0] == e.name
        })
        if (exists) {

            obj.name = entity[0];
            entity[1].split(",").forEach(f => {
                var sub = {}
                sub.value = f
                if (entity[2]) {
                    let arr = entity[2].split(",")
                    sub.synonyms = [...arr];
                }
                exists.entries.push(sub)
            })
        }
        else {
            obj.name = entity[0];
            entity[1].split(",").forEach(f => {
                var sub = {}
                sub.value = f
                if (entity[2]) {
                    let arr = entity[2].split(",")
                    sub.synonyms = [...arr];
                }
                obj.entries.push(sub)
            })

            ENcollection.push(obj);
        }

    });
    try {

        var staus = await axios.put(baseApi + "/entities", ENcollection, {
            headers: headers
        })
        res.send(ENcollection);
    } catch (err) {
        console.log(err);

    }
});

app.post('/api/uploadIN', async (req, res) => {

    try {
        var INcollection = [];
        const { token, path } = req.body;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': token
        }
        var data = xlsx.parse(path);
        var intents = data.filter(e => {
            return e.name == "Intents"
        })

        var entities = data.filter(e => {
            return e.name == "Entities"
        })
        var formatedData = entities[0].data.map(e => {
            var obj = {

            }
            obj.values = e[1];
            obj.type = e[0];
            if (e[2])
                obj.values += "," + e[2]
            return obj
        })


        intents[0].data.forEach(intent => {
            let obj = clonedeep(objIN);
            var exists = INcollection.find(e => {
                return intent[0] == e.name
            })
            if (exists) {
                let obj1 = clonedeep(userSays);
                var pickedEn = [];
                formatedData.forEach(e => {
                    e.values.split(",").forEach(y => {
                        if (intent[1].toLowerCase().includes(y)) {
                            pickedEn.push(y)
                        }
                    })
                })
                if (pickedEn.length == 0) {
                    obj1.data.push({ text: intent[1] })
                }
                else {
                    let strIN = ""
                    pickedEn.forEach(e => {
                        strIN = intent[1].replace(e, "^&(" + e + "^&(")
                    })
                    arrayIN = strIN.split("^&(");
                    arrayIN = arrayIN.filter(Boolean);
                    arrayIN.forEach(i => {
                        var type = formatedData.find(l => { if (l.values.includes(i.trim().toLowerCase())) return l; });
                        if (type) {
                            let say = {
                                text: i,
                                meta: "@" + type.type,
                                alias: type.type
                            }
                            obj1.data.push(say)
                        }
                        else {
                            let say = {
                                text: i
                            }
                            obj1.data.push(say)

                        }
                    })

                }

                exists.userSays.push(obj1)
            }
            else {
                obj.name = intent[0];
                let obj1 = clonedeep(userSays);
                var pickedEn = [];
                formatedData.forEach(e => {
                    e.values.split(",").forEach(y => {
                        if (intent[1].toLowerCase().includes(y)) {
                            pickedEn.push(y)
                        }
                    })
                })
                console.log(pickedEn);
                if (pickedEn.length == 0) {
                    obj1.data.push({ text: intent[1] })
                }
                else {
                    let strIN = ""
                    pickedEn.forEach(e => {
                        strIN = intent[1].replace(e, "^&(" + e + "^&(")
                    })
                    arrayIN = strIN.split("^&(");
                    arrayIN = arrayIN.filter(Boolean);
                    arrayIN.forEach(i => {
                        var type = formatedData.find(l => { if (l.values.includes(i.trim().toLowerCase())) return l; });
                        if (type) {
                            let say = {
                                text: i,
                                meta: "@" + type.type,
                                alias: type.type
                            }
                            obj1.data.push(say)
                        }
                        else {
                            let say = {
                                text: i
                            }
                            obj1.data.push(say)

                        }
                    })

                }
                // obj1.data.push({ text: intent[1] })
                obj.userSays.push(obj1)
                INcollection.push(obj);
            }

        });
        var staus = await axios.post(baseApi + "/intents", INcollection, {
            headers: headers
        })
        res.send(INcollection);
    } catch (err) {
        throw err;

    }
});

function awaist(){
    var data = xlsx.parse("D:\\githubEnterprise\\pnai\\data.xlsx");
    var classifier = data.filter(e => {
        return e.name == "Classifier"
    })

    var formatedData = classifier[0].data.map(e => {
        return { input: e[0], output: e[1] }

    })
    console.log(formatedData);
    console.log(start = new Date().getTime())
    const net = new brain.recurrent.LSTM();
    net.train(formatedData, {
        log: (error) => console.log(error),
        logPeroid: 100
    });
    const json = net.toJSON()
    const jsondata = JSON.stringify(json);
    fs.writeFileSync('trainingdata66.json', jsondata)
    console.log(end = new Date().getTime(), (end - start) / 1000);
    const output4 = net.run('Among all years, which year saw the sixth highest sales?')
}
awaist();

