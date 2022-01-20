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
        default: 'navigation.courseOverGroundTrue',
      },
      shortcode1: {
        type: 'string',
        title: 'SK1 - Short code of 5 to 10 digits (prefix) of the 1st parameter',
        default: 'COG (rad)',
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
      skpath3: {
        type: 'string',
        title: 'SK3 - Signal K path of the 3rd parameter',
        default: 'navigation.navigation.position',
      },
      shortcode3: {
        type: 'string',
        title: 'SK3 - Short code of 5 to 10 digits (prefix) of the 3rd parameter',
        default: 'POS',
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

      /*
      active1: {
        type: 'boolean',
        title: 'Is active',
        default: true,
      },
      */
      
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

        if(options.skpath1.includes('navigation.position')){
          tpv.sk1.value = JSON.parse(app.getSelfPath(options.skpath1).value);
          tpv.sk1.value = 'LON: ' + String(tpv.sk1.value.longitude) + 'LAT: ' + String(tpv.sk1.value.latitude);
        }

			tpv.sk1.timestamp =  Date.parse(app.getSelfPath(options.skpath1).timestamp);
      tpv.sk1.toprint = tpv.sk1.shortcode + ': ' + String(tpv.sk1.value);
		}
    console.log("tpv.sk1.value: ",tpvtpv.sk1.value);

    if(app.getSelfPath(options.skpath2)){
			if(!tpv.sk2) tpv.sk2 = {};
      tpv.sk2.shortcode = options.shortcode2;
			tpv.sk2.value = app.getSelfPath(options.skpath2).value;
			tpv.sk2.timestamp =  Date.parse(app.getSelfPath(options.skpath2).timestamp);
      tpv.sk2.toprint = tpv.sk2.shortcode + ': ' + String(tpv.sk2.value);
		}
    console.log("tpv.sk2.value: ",tpvtpv.sk2.value);

    if(app.getSelfPath(options.skpath3)){
			if(!tpv.sk3) tpv.sk3 = {};
      tpv.sk3.shortcode = options.shortcode3;
			tpv.sk3.value = app.getSelfPath(options.skpath3).value;
			tpv.sk3.timestamp =  Date.parse(app.getSelfPath(options.skpath3).timestamp);
      tpv.sk3.toprint = tpv.sk3.shortcode + ': ' + String(tpv.sk3.value);
		}
    console.log("tpv.sk3.value: ",tpvtpv.sk3.value);

    if(app.getSelfPath(options.skpath4)){
			if(!tpv.sk4) tpv.sk4 = {};
      tpv.sk4.shortcode = options.shortcode4;
			tpv.sk4.value = app.getSelfPath(options.skpath4).value;
			tpv.sk4.timestamp =  Date.parse(app.getSelfPath(options.skpath4).timestamp);
      tpv.sk4.toprint = tpv.sk4.shortcode + ': ' + String(tpv.sk4.value);
		}
    console.log("tpv.sk4.value: ",tpvtpv.sk4.value);




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
      oled.setCursor(1, 18);
      oled.writeString(font, 1, tpv.sk1.toprint, 26, true);
      oled.setCursor(1, 28);
      oled.writeString(font, 1, tpv.sk2.toprint, 26, true);
      oled.setCursor(1, 38);
      oled.writeString(font, 1, tpv.sk3.toprint, 26, true);
      oled.setCursor(1, 48);
      oled.writeString(font, 1, tpv.sk4.toprint, 26, true);

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


