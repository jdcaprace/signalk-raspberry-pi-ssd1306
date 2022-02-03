/*
 * Copyright 2022 Jean-David Caprace <jd.caprace@gmail.com>
 *
 * Add the MIT license
 */

//See following links for display packages for oled display
//https://www.npmjs.com/package/oled-i2c-bus
//https://github.com/baltazorr/oled-i2c-bus
const ssd1306 = require('oled-i2c-bus');
var i2c = require('i2c-bus');
var font = require('oled-font-5x7');

//To obtain the SignalK paths
const signalkSchema = require('@signalk/signalk-schema')
const Bacon = require('baconjs')
const relevantKeys = Object.keys(signalkSchema.metadata)
  .filter(s => s.indexOf('/vessels/*') >= 0)
  .map(s => s.replace('/vessels/*', '').replace(/\//g, '.').replace(/RegExp/g, '*').substring(1)).sort()

module.exports = function (app) {
  let timer = null
  let plugin = {}

  plugin.id = 'signalk-raspberry-pi-ssd1306'
  plugin.name = 'Raspberry-Pi ssd1306'
  plugin.description = 'ssd1306 i2c mini OLED display (128x64) to plot SignalK path values for Raspberry-Pi'

  plugin.schema = {
    type: 'object',
    properties: {
      rate: {
        title: "Refresh Sample Rate (in seconds)",
        type: 'number',
        default: 5
      },
      i2c_bus: {
        type: 'integer',
        title: 'I2C bus number',
        default: 1,
      },
      i2c_address: {
        type: 'string',
        title: 'I2C address',
        default: '0x3c',
      },
      skpath1: {
        type: 'string',
        title: 'SK1 - Signal K path of the 1st parameter',
        default: 'navigation.position',
      },
      shortcode1: {
        type: 'string',
        title: 'SK1 - Short code of 5 to 10 digits (prefix) of the 1st parameter',
        default: 'POS',
      },
      offset1: {
        type: 'number',
        title: 'SK1 - Offset value to be added to the value of the field',
        default: 0,
      },
      multiplier1: {
        type: 'number',
        title: 'SK1 - Parameter that is going to multiply the value of the field',
        default: 1,
      },
      active1: {
        type: 'boolean',
        title: 'SK1 - Is active',
        default: true,
      },
      skpath2: {
        type: 'string',
        title: 'SK2 - Signal K path of the 2nd parameter',
        default: 'navigation.speedOverGround',
      },
      shortcode2: {
        type: 'string',
        title: 'SK2 - Short code of 5 to 10 digits (prefix) of the 2nd parameter',
        default: 'SOG (m/s)',
      },
      offset2: {
        type: 'number',
        title: 'SK2 - Offset value to be added to the value of the field',
        default: 0,
      },
      multiplier2: {
        type: 'number',
        title: 'SK2 - Parameter that is going to multiply the value of the field',
        default: 1,
      },
      active2: {
        type: 'boolean',
        title: 'SK2 - Is active',
        default: true,
      },      
      skpath3: {
        type: 'string',
        title: 'SK3 - Signal K path of the 3rd parameter',
        default: 'navigation.courseOverGroundTrue',
      },
      shortcode3: {
        type: 'string',
        title: 'SK3 - Short code of 5 to 10 digits (prefix) of the 3rd parameter',
        default: 'COG (rad)',
      },
      offset3: {
        type: 'number',
        title: 'SK3 - Offset value to be added to the value of the field',
        default: 0,
      },
      multiplier3: {
        type: 'number',
        title: 'SK3 - Parameter that is going to multiply the value of the field',
        default: 1,
      },
      active3: {
        type: 'boolean',
        title: 'SK3 - Is active',
        default: true,
      },  
      skpath4: {
        type: 'string',
        title: 'SK4 - Signal K path of the 3rd parameter',
        default: 'environment.outside.temperature',
      },
      shortcode4: {
        type: 'string',
        title: 'SK4 - Short code of 5 to 10 digits (prefix) of the 3rd parameter',
        default: 'TEMP (K)',
      },
      offset4: {
        type: 'number',
        title: 'SK4 - Offset value to be added to the value of the field',
        default: 0,
      },
      multiplier4: {
        type: 'number',
        title: 'SK4 - Parameter that is going to multiply the value of the field',
        default: 1,
      },
      active4: {
        type: 'boolean',
        title: 'SK4 - Is active',
        default: true,
      },      
    
      /*
      skpath: {
        type: 'array',
        title: ' ',
        items: {
          title: 'One signal K path to plot value on oled display',
          properties: {
            'active': {
              title: 'Is active',
              type: 'boolean',
              default: true,
            },
            'shortcode': {
              title: 'Short code of 3 digits (prefix)',
              type: 'string',
              default: 'SOG',
            },
            'key': {
              title: 'Signal K path',
              type: 'string',
              default: '',
              //Not enough flexible for custom fields?
              'enum': relevantKeys,
            }
          }
        }
      }, 
      */    
    }
  }

  var unsubscribes = [];

  plugin.start = function (options) {

    let tpv = {};

		if(app.getSelfPath(options.skpath1)){
			if(!tpv.sk1) tpv.sk1 = {};
      tpv.sk1.shortcode = options.shortcode1;
			tpv.sk1.value = app.getSelfPath(options.skpath1).value;
      if(options.offset1!=0){tpv.sk1.value = Number(tpv.sk1.value) + Number(options.offset1);}
      if(options.multiplier1!=1){tpv.sk1.value = Number(tpv.sk1.value) * Number(options.offset1);}
      if(typeof tpv.sk1.value == 'number'){tpv.sk1.value = tpv.sk1.value.toFixed(3);}

      //console.log("tpv.sk1.value: ",tpv.sk1.value);
      //console.log("stringify: ",JSON.stringify(tpv.sk1.value));
      
        if(options.skpath1.includes('navigation.position')){
          tpv.sk1.value = app.getSelfPath(options.skpath1).value;
          var pos = JSON.parse(JSON.stringify(tpv.sk1.value));
          //console.log("pos: ",pos);
          if(pos.longitude !== null && pos.latitude !== null)
          {
          tpv.sk1.value = 'LON: ' + String(pos.longitude.toFixed(5)) + ' LAT: ' + String(pos.latitude.toFixed(5));
          }
        }
        
        /*
        const json = '{"result":true, "count":42}';
        const obj = JSON.parse(json);
        console.log(obj.count); // expected output: 42
        console.log(obj.result); // expected output: true
        */

			tpv.sk1.timestamp =  Date.parse(app.getSelfPath(options.skpath1).timestamp);
      tpv.sk1.toprint = tpv.sk1.shortcode + ': ' + String(tpv.sk1.value);
		}
    //console.log("tpv.sk1.value: ",tpv.sk1.value);

    if(app.getSelfPath(options.skpath2)){
			if(!tpv.sk2) tpv.sk2 = {};
      tpv.sk2.shortcode = options.shortcode2;
			tpv.sk2.value = app.getSelfPath(options.skpath2).value;
      if(options.offset2!=0){tpv.sk2.value = Number(tpv.sk2.value) + Number(options.offset2);}
      if(options.multiplier2!=1){tpv.sk2.value = Number(tpv.sk2.value) * Number(options.offset2);}
      if(typeof tpv.sk2.value == 'number'){tpv.sk2.value = tpv.sk2.value.toFixed(3);}
			tpv.sk2.timestamp =  Date.parse(app.getSelfPath(options.skpath2).timestamp);
      tpv.sk2.toprint = tpv.sk2.shortcode + ': ' + String(tpv.sk2.value);
		}
    //console.log("tpv.sk2.value: ",tpv.sk2.value);

    if(app.getSelfPath(options.skpath3)){
			if(!tpv.sk3) tpv.sk3 = {};
      tpv.sk3.shortcode = options.shortcode3;
			tpv.sk3.value = app.getSelfPath(options.skpath3).value;
      if(options.offset3!=0){tpv.sk3.value = Number(tpv.sk3.value) + Number(options.offset3);}
      if(options.multiplier3!=1){tpv.sk3.value = Number(tpv.sk3.value) * Number(options.offset3);}
      if(typeof tpv.sk3.value == 'number'){tpv.sk3.value = tpv.sk3.value.toFixed(3);}
			tpv.sk3.timestamp =  Date.parse(app.getSelfPath(options.skpath3).timestamp);
      tpv.sk3.toprint = tpv.sk3.shortcode + ': ' + String(tpv.sk3.value);
		}
    //console.log("tpv.sk3.value: ",tpv.sk3.value);

    if(app.getSelfPath(options.skpath4)){
			if(!tpv.sk4) tpv.sk4 = {};
      tpv.sk4.shortcode = options.shortcode4;
			tpv.sk4.value = app.getSelfPath(options.skpath4).value;
      if(options.offset4!=0){tpv.sk4.value = Number(tpv.sk4.value) + Number(options.offset4);}
      if(options.multiplier4!=1){tpv.sk4.value = Number(tpv.sk4.value) * Number(options.offset4);}
      if(typeof tpv.sk4.value == 'number'){tpv.sk4.value = tpv.sk4.value.toFixed(3);}
			tpv.sk4.timestamp =  Date.parse(app.getSelfPath(options.skpath4).timestamp);
      tpv.sk4.toprint = tpv.sk4.shortcode + ': ' + String(tpv.sk4.value);
		}
    //console.log("tpv.sk4.value: ",tpv.sk4.value);




    //To plot on OLED screen via I2C
    function plotoled(){


      var opts = {
        width: 128, // screen width
        height: 64, // screen height
        address: Number(options.i2c_address), // 0x3C, // Pass I2C address of screen if it is not the default of 0x3C
        busnbr: options.i2c_bus, //1,
      };

      var bus = i2c.openSync(opts.busnbr);
      var oled = new ssd1306(bus, opts);

      oled.turnOnDisplay();
      oled.clearDisplay();
      oled.dimDisplay(false);
      oled.invertDisplay(false);

      //console.log("Plotoled function");

      // sets cursor to x = 1, y = 1
      if(options.active1)
      {
      oled.setCursor(1, 18);
      oled.writeString(font, 1, tpv.sk1.toprint, 26, true);
      }
      if(options.active2)
      {
      oled.setCursor(1, 28);
      oled.writeString(font, 1, tpv.sk2.toprint, 26, true);
      }
      if(options.active3)
      {
      oled.setCursor(1, 38);
      oled.writeString(font, 1, tpv.sk3.toprint, 26, true);
      }
      if(options.active4)
      {
      oled.setCursor(1, 48);
      oled.writeString(font, 1, tpv.sk4.toprint, 26, true);
      }
    }     
    	     
    timer = setInterval(plotoled, options.rate * 1000);
  }

 
  plugin.stop = function () {
    app.debug('Plugin stopped');
    if(timer){
      clearInterval(timer);
      timeout = null;
    }

    unsubscribes.forEach(f => f())
    unsubscribes = []
  }

  return plugin;
}


