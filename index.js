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
        title: 'Signal K path of the first parameter',
        default: 'name',
      },
      shortcode1: {
        type: 'string',
        title: 'Short code of 3 to 5 digits (prefix)',
        default: 'NAME',
      },
      active1: {
        type: 'boolean',
        title: 'Is active',
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

  plugin.start = function (options) {


    let tpv = {};
		if(app.getSelfPath(options.skpath1)){
			if(!tpv.sk1) tpv.sk1 = {};
			tpv.sk1.value = app.getSelfPath(options.skpath1).value;
			tpv.sk1.timestamp =  Date.parse(app.getSelfPath(options.skpath1).timestamp);
		}
    
    
    console.log("TPV:",tpv);


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

      console.log("Plotoled function");

      // sets cursor to x = 1, y = 1
      oled.setCursor(1, 18);
      oled.writeString(font, 1, 'LAT: 000000000000', 26, true);
      oled.setCursor(1, 28);
      oled.writeString(font, 1, 'LON: 000000000000', 26, true);
      //oled.setCursor(1, 38);
      //oled.writeString(font, 1, 'COG: 000000000000', 26, true);
      //oled.setCursor(1, 48);
      //oled.writeString(font, 1, 'SOG: 000000000000', 26, true);

    }     
    	     
    timer = setInterval(plotoled, options.rate * 1000);
  }

 
  plugin.stop = function () {
    
    if(timer){
      clearInterval(timer);
      timeout = null;
    }

    unsubscribes.forEach(f => f())
    unsubscribes = []
  }

  return plugin
}


