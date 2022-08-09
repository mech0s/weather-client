// client.js
// Required steps to create a servient for a client
const { Servient, Helpers } = require("@node-wot/core");
const { HttpClientFactory } = require('@node-wot/binding-http');

const servient = new Servient();
servient.addClientFactory(new HttpClientFactory(null));
const WoTHelpers = new Helpers(servient);

const weathercontrolthingPromise = new Promise ( (myResolve, myReject) => {
    WoTHelpers.fetch("http://192.168.86.13:8080/weathercontrolthing").then(async (td) => {
        try {
            servient.start().then(async (WoT) => {
                // Then from here on you can consume the thing
                // i.e let thing = await WoT.consume(td) ...
                myResolve(WoT);
            });
        }
        catch (err) {
            console.error("Script error:", err);
            myReject(err);
        }
    }).catch((err) => { 
        console.error("Fetch error:", err);  
        myReject(err) });
})

const sensornodethingPromise = new Promise ( (myResolve, myReject) => {
    WoTHelpers.fetch("http://192.168.86.251:8080/sensehatenv").then(async (td) => {
        try {
            servient.start().then(async (WoT) => {
                // Then from here on you can consume the thing
                // i.e let thing = await WoT.consume(td) ...
                myResolve(WoT);
            });
        }
        catch (err) {
            console.error("Script error:", err);
            myReject(err);
        }
    }).catch((err) => { 
        console.error("Fetch error:", err);  
        myReject(err) });
})

weathercontrolthingPromise.then( 
    (weatherWoT) => {
        sensornodethingPromise.then(
            (sensorWoT) => {
                console.log("Promises fulfilled");
                console.log(weatherWoT);
                console.log(sensorWoT);
                
            },
            (err) => {console.log(err);}
        )
    },
    (err) => { console.log(err);} 
)