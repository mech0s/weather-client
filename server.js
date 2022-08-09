// client.js
// Required steps to create a servient for a client
const { Servient, Helpers } = require("@node-wot/core");
const { HttpClientFactory } = require('@node-wot/binding-http');

const servient = new Servient();
servient.addClientFactory(new HttpClientFactory(null));
const WoTHelpers = new Helpers(servient);

WoTHelpers.fetch("http://localhost:8080/example").then(async (td) => {
    try {
        servient.start().then(async (WoT) => {
            // Then from here on you can consume the thing
            // i.e let thing = await WoT.consume(td) ...
        });
    }
    catch (err) {
        console.error("Script error:", err);
    }
}).catch((err) => { console.error("Fetch error:", err); });

