const mDnsSd = require('node-dns-sd');
const LinkSmartThingDirectory = require('link_smart_thing_directory');

const { Servient, Helpers } = require("@node-wot/core");
const { HttpClientFactory } = require('@node-wot/binding-http');

const msPoll = 1000;
const humidityThreshold = 44.0;
const temperatureThreshold = 35.0;

main();

async function main(){

    const directorySearchApiPromise = new Promise ((myResolve, myReject) => {
        mDnsSd.discover({
            name: '_wot._tcp.local'
            }).then((device_list) =>{
                const directory = {address:"127.0.0.1", port:8081};  
                device_list.forEach(element => { // only one directory handled for now, defaults to 127.0.0.1:8081
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
            searchApi.searchJsonpathGet("$[?(@.title=='WeatherControlThing')]", (error, data,response ) => {
                if (error) {
                    console.error(error);
                    myReject(error);
                } else {
                    myResolve(JSON.parse(response.text)[0]);
                }
            })
        } )

    })

    const sensehatDirectoryPromise = new Promise((myResolve,myReject) => {
        directorySearchApiPromise.then( (searchApi) => {
            //searchApi.searchXpathGet
            searchApi.searchJsonpathGet("$[?(@.title=='SenseHatEnv')]", (error, data,response ) => {
                if (error) {
                    console.error(error);
                    myReject(error);
                } else {
                    myResolve(JSON.parse(response.text)[0]);
                }
            })
        } )

    })


    let weathercontrolTd,sensehatTd;
    [weathercontrolTd,sensehatTd] = await Promise.all([weathercontrolDirectoryPromise,sensehatDirectoryPromise]);


    const servient = new Servient();
    servient.addClientFactory(new HttpClientFactory(null));
    let WoT = await servient.start()

    let weathercontrolThing, sensehatThing
    weathercontrolThing = await WoT.consume(weathercontrolTd);
    sensehatThing = await WoT.consume(sensehatTd);

    let lastDry = true;
    let lastCool = true;
    await weathercontrolThing.invokeAction("clear");
    setInterval(  ( async () => {
        let temperature = await ( await sensehatThing.readProperty("temperature")).value();
        let humidity = await ( await sensehatThing.readProperty("humidity")).value();

        let dry = humidity < humidityThreshold;
        let cool = temperature < temperatureThreshold;
        console.log(JSON.stringify({humidityThreshold: humidityThreshold,
                                    temperatureThreshold: temperatureThreshold,
                                    humidity: humidity, 
                                    temperature: temperature,
                                    dry: dry,
                                    cool: cool
                                }));


        let warming = ( lastCool && !cool );
        let cooling = ( !lastCool && cool );
        let moistening = ( lastDry && !dry );
        let drying = ( !lastDry && dry );

        if (drying) {
            await weathercontrolThing.invokeAction("clear");
        } //clear

        if ( (cooling && !dry) || (moistening && cool)) { 
            await weathercontrolThing.invokeAction("rain");
        } //rain

        if ( (warming && !dry) || (moistening && !cool)) {
            await weathercontrolThing.invokeAction("thunder");
        } //thunder

        lastDry = dry;
        lastCool = cool;
    })
    ,msPoll);
}