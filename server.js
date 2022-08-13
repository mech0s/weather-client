const mDnsSd = require('node-dns-sd');
const LinkSmartThingDirectory = require('link_smart_thing_directory');



const directorySearchApiPromise = new Promise ((myResolve, myReject) => {
    mDnsSd.discover({
        name: '_wot._tcp.local'
        }).then((device_list) =>{
            const directory = {};  // only one directory handled for now
            device_list.forEach(element => {
                directory.address = element.address;
                directory.port = element.service.port; 
            });
            const apiClient = new LinkSmartThingDirectory.ApiClient(directory.address+":"+directory.port);
            const searchApi = new LinkSmartThingDirectory.SearchApi(apiClient);
            myResolve(searchApi);
        }).catch((error) => {
          console.error(error);
          myReject(error);
        });

})

const weathercontrolDirectoryPromise = new Promise((myResolve,myReject) => {
    directorySearchApiPromise.then( (searchApi) => {
        //searchApi.searchXpathGet
        searchApi.searchJsonpathGet("weathercontrol", (error, data,response ) => {
            if (error) {
                console.error(error);
                myReject(error);
              } else {
                console.log('API called successfully. Returned data: ' + data);
                myResolve(error);
              }
        })
    } )

})

weathercontrolDirectoryPromise.then((td) => {
    console.log(td);
})


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