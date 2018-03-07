/* global global, scxml1 */

var mqtt = require('mqtt');
var scxml_object = require('scxml');
var sleep = require('thread-sleep');
global.connection_state = '';
global.read_result = '';
global.request_tracking_r = [];
global.response_array = [];
var status = '"connected!"';

var config = {};
config.mqtt = {};

config.mqtt.options = {
	clean : true,
};

//var client  = mqtt.connect({port:1883, host:'tcp://ss01-cpu-271',username:'IntelliMAX', password:'sensysmqtt123'});
global.client = mqtt.connect('tcp://ss01-nbk-054:1883', config.mqtt.options);
//var client  = mqtt.connect('tcp://ss01-nbk-054:1883',config.mqtt.options);
//console.log(client);

global.client.on('connect', function () {

	global.client.subscribe('connect');
	global.client.subscribe('read');
	global.client.subscribe('write');
	global.client.subscribe('discon');

});

/////////////////////////////SCXML Interpretor Section/////////////////////////////


console.log('After Variable Initialization Starting to Model SCXML: ');
scxml_object.pathToModel('C:\\Program Files\\nodejs\\ModbusTcpDriverFSM.xml', function (err, model) {

	if (err) {
		console.log(err);
	}

	global.scxml1 = new scxml_object.scion.Statechart(model);

	global.scxml1.start();
	global.scxml1.registerListener({
		onEntry : function (stateId) {
			console.log('Enter: ' + stateId);

			if (stateId == 'connected') {
				global.client.publish('status', status);
			}
		},
		onExit : function (stateId) {
			console.log('Exit: ' + stateId);
		},
		onTransition : function (sourceStateId, targetStateIds) {}
	});

	//client.publish('connect', 'connected');
	try {
		global.client.on('message', function (topic, message) {
			var jsonObj = '';
			// message is Buffer
			console.log('On Message Event :');

			jsonObj = JSON.parse(message);

			console.log(' Keys count in request ' + Object.keys(jsonObj).length);
			console.log('Received Topic & Message from MQTT Client: ' + topic + message);

			// client.end();


			if (topic == 'connect') {
				var tata;
				console.log('jsonObj in on message Connect: ' + jsonObj);
				var host = jsonObj.h;
				var port = jsonObj.p;
				var device_id = jsonObj.id; // device id from the connection request
				if (device_id) {}
				else {
					device_id = "00"
				}
				console.log('Host & Port sent by Client   ' + host + port);
				// If there is another request for connection whereas already a connection is made
				// then 1st it will be disconnected 1st and then new connection will be established
				scxml1.gen({
					name : 'disconnected'
				});
				global.scxml1.gen('Input', {
					'host' : host,
					'port' : port,
					'device_id' : device_id
				});
				//	scxml1.gen('Input', {'host':host,'port':port,'fc':fc,'raddress':raddress,'write_data':write_data,'data_length':data_length});
				//	scxml1.gen({name:'connected'});
			}

			if (topic == 'read') {

				console.log('jsonObj in on message Read Topic: ' + jsonObj);

				if (global.connection_state) {
					for (var k = 0; k < Object.keys(jsonObj).length; k++) {
						for (var i = 0; i < jsonObj[k]['id'].length; i++) {

							console.log('jsonObj.id.length ' + jsonObj[k]['id'].length);
							var fc = jsonObj[k].fc;
							var raddress = jsonObj[k].id[i];
							//	var write_data   =jsonObj.w;
							var data_type = jsonObj[k].t;

							console.log('Read New Formatted Request: ' + fc + raddress + data_type);
							//	global.scxml1.gen('read', {'fc':fc,'raddress':raddress,'write_data':write_data,'data_type':data_type});
							global.scxml1.gen('read', {
								'fc' : fc,
								'raddress' : raddress,
								'data_type' : data_type
							});
							//	global.scxml1.gen({name:'read'});
							sleep(3);
						}
					}
				}
			}
			if (topic == 'discon') {
				var disconnected_status = jsonObj.disconnected;
				if (disconnected_status) {
					console.log('Disconnect_interpretor: ');
					scxml1.gen({
						name : 'disconnected'
					});
				}
				console.log('Disconnect_interpretor2 Success: ');
			}
			if (topic == 'write') {
				for (var j = 0; j < Object.keys(jsonObj).length; j++) {
					for (var x = 0; x < jsonObj[j]['id'].length; x++) {

						console.log('jsonObj.id.length ' + jsonObj[j]['id'].length);
						var fc = jsonObj[j].fc;
						var raddress = jsonObj[j].id[x];
						var write_data = jsonObj[j].w;
						var data_type = jsonObj[j].t;

						console.log('Writ New Formatted Request: ' + fc + raddress + data_type + write_data);
						//	global.scxml1.gen({name:'write'});
						global.scxml1.gen('write', {
							'fc' : fc,
							'raddress' : raddress,
							'write_data' : write_data,
							'data_type' : data_type
						}); ;
					}
				}

			}
		});

	} catch (err) {
		console.log('event Eror' + err);
	}

});