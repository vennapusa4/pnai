const express = require('express');
const bodyParser = require('body-parser');
const app = express();
var xlsx = require('node-xlsx');
const _=require("lodash")
const clonedeep = require('lodash.clonedeep');
const axios = require("axios");
var brain = require("brain.js")
const baseApi = "https://api.dialogflow.com/v1";
var fs = require("fs");
var natural = require('natural');
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
        {
            "parameters": []
        }
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
            var parametersarray = []
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
                    var parameters = {
                    }
                    pickedEn.forEach(e => {
                        intent[1] = intent[1].replace(e, "^&(" + e + "^&(")
                    })

                    arrayIN = intent[1].split("^&(");
                    arrayIN = arrayIN.filter(Boolean);
                    arrayIN.forEach(i => {
                        var type = formatedData.find(l => { if (l.values.split(",").indexOf(i.trim().toLowerCase()) != -1) return l; });
                        if (type) {
                            var paramexists  = exists.responses[0].parameters.find(ee => {
                                return ee.name == type.type
                            })
                            if (!paramexists) {
                                parameters.dataType = "@" + type.type;
                                parameters.name = type.type;
                                parameters.value = type.type;
                                parameters.required = true;
                                parameters.isList = true;
                            }
                         
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

                exists.userSays.push(obj1);

            
                if (!_.isEmpty(parameters)) {
                    exists.responses[0].parameters.push(parameters)
                }
               
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
                    // let strIN = ""

                    var parameters = {
                    }
                    pickedEn.forEach(e => {
                        intent[1] = intent[1].replace(e, "^&(" + e + "^&(")
                    })
                    arrayIN = intent[1].split("^&(");
                    arrayIN = arrayIN.filter(Boolean);
                    arrayIN.forEach(i => {
                        var type = formatedData.find(l => { if (l.values.includes(i.trim().toLowerCase())) return l; });
                        if (type) { 
                            var paramexists  = obj.responses[0].parameters.find(ee => {
                            return ee.name == type.type
                        })
                        if (!paramexists) {
                            parameters.dataType = "@" + type.type;
                            parameters.name = type.type;
                            parameters.value = type.type;
                            parameters.required = true;
                            parameters.isList = true;
                        }
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
                    parametersarray.push(parameters)
                }
                // obj1.data.push({ text: intent[1] })
                obj.userSays.push(obj1);
                if (!_.isEmpty(parameters) ){
                    obj.responses[0].parameters.push(parameters)
                }
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

app.post("/api/classify", async (req, res) => {
    const { word } = req.body;
    // var data = xlsx.parse(path);
    // var classifier = data.filter(e => {
    //     return e.name == "Classifier"
    // })

    // var formatedData = classifier[0].data.map(e => {
    //     return { input: e[0], output: e[1] }

    // })
    // console.log(start = new Date().getTime())
    // const net = new brain.recurrent.LSTM();
    // net.train(formatedData);
    // const json = net.toJSON()
    // const jsondata = JSON.stringify(json);
    // fs.writeFileSync('trainingdata.json', jsondata)
    // console.log(end = new Date().getTime(), (end - start) / 1000);
    // const output4 = net.run('Among all years, which year saw the sixth highest sales?')
    // res.send(output4);


    natural.BayesClassifier.load('classifier.json', null, function (err, classifier) {
        res.send(classifier.classify(word));
    });
})

app.post("/api/responses", async (req, res) => {
    const { path } = req.body;
    var data = xlsx.parse(path);
    var responses = data.filter(e => {
        return e.name == "Response Library"
    })
    var responsearray = [];
    var format = {
        intent: "",
        data: [

        ]
    }
    var qualifierformat = {
        qualifier: "",
        singularResponse: [],
        pluralResponse: [],
        legends: []
    }
    var formatedData = responses[0].data.forEach(e => {

        var exists = responsearray.find(l => {
            return e[0] == l.intent
        })
        if (e[4]) {
            var dd = e[4].split(",");
        }
        else var dd = []
        if (exists) {
            var qexists = exists.data.find(l => {
                return e[1] == l.qualifier
            })
            if (qexists) {
                qexists.singularResponse.push(e[2]);
                if (e[3]) {
                    qexists.pluralResponse.push(e[3]);
                }
            }
            else {
                let obj2 = clonedeep(qualifierformat);
                obj2.qualifier = e[1];
                obj2.singularResponse.push(e[2]);
                if (e[3]) {
                    obj2.pluralResponse.push(e[3]);
                }
                obj2.legends = dd
                exists.data.push(obj2)
            }

        }

        else {
            let obj1 = clonedeep(format);
            let obj2 = clonedeep(qualifierformat)
            obj1.intent = e[0].trim();

            obj2.qualifier = e[1];
            obj2.singularResponse.push(e[2]);
            if (e[3]) {
                obj2.pluralResponse.push(e[3]);
            }
            obj2.legends = dd

            obj1.data.push(obj2)
            responsearray.push(obj1)
        }
        const jsondata = JSON.stringify(responsearray);
        fs.writeFileSync('responseData.json', jsondata)

    })
    console.log(responsearray);

})
app.post("/api/suggestions", async (req, res) => {
    const { path } = req.body;
    var data = xlsx.parse(path);
    var suggestions = data.filter(e => {
        return e.name == "Suggestion Pool";

    })

    var responsearray = [];
    var formatedData = suggestions[0].data.forEach(e => {
        var exists = responsearray.find(l => {
            return e[0] == l.intent
        })
        if (exists) {
            exists.suggestions.push(e[1])
        }
        else {
            var obj = {};
            obj.intent = e[0];
            obj.suggestions = [e[1]];
            responsearray.push(obj);
        }


    });
    const jsondata = JSON.stringify(responsearray);
    fs.writeFileSync('suggestionsData.json', jsondata);

})
const PORT = process.env.PORT || 4001;
app.listen(PORT);
