
# signalk-raspberry-pi-ssd1306

ssd1306 i2c mini OLED display (128 x 64 pixels) to plot SignalK path values for Raspberry-Pi. The plugin is designed to plot maximum 4 values on the display.

This plugin can be downloaded via the SignalK application.

Some examples of possible uses are found below:
* Emergency GPS.
* Health parameters of your SignalK server.
* Health parameters of your Raspberry Pi.
* Main parameters of your battery power bank.
* Alarm and notifications.
* Etc.

## Getting Started
You will need a raspberry pi with SignalK installed along with a ssd1306 i2c oled diplay to used it.

### The SSD1306 oled display
Personally I am using the sensor found at the following link on Amazon. However there are many manufacturers to pick from. Be carrefull to buy an i2c version for compatibility with this plugin.

![ssd1306](../master/Pictures/ssd1306.png)

Learn more: https://www.amazon.com/HiLetgo-Serial-128X64-Display-Color/dp/B06XRBTBTB/ref=sr_1_2_sspa

The datasheet of the ssd1306 display can be found here: https://cdn-shop.adafruit.com/datasheets/SSD1306.pdf

### Connecting the oled display
All you need is connecting the 4 pins (3.3V Power - VCC), (I2C - SDA), (I2C - SCL) and (Ground - GND) to your Raspberry Pi.

The GPIO of the raspberry Pi is detailed here: https://docs.microsoft.com/pt-br/windows/iot-core/learn-about-hardware/pinmappings/pinmappingsrpi

You need to make sure Raspberry Pi is turned off while doing this!

In order to use the sensor, the i2c bus must be enabled on your rasbperry pi. This can be accomplished using "sudo raspi-config".

### Plugin configuration
AFter installation, restart the Signal K server.
Go to Server > Plugin Config.

The following parameters are available to perform the configuration of the plugin in function of your needs:
* 'Refresh Sample Rate (in seconds)': This is the refresh sample rate of the ssd1306 oled display. Default value is set to 5 seconds.
* 'I2C bus number': This is the default bus number of you raspberry pi. The default value is set to 1.
* 'I2C address': This is the I2C address of the ssd1306 oled display. Default value is set to 0x3c.

For each display line of the ssd1306 oled display you can setup the following variables. The variable name are prefixed with 'SKi' where i is the linenumber.
* 'SKi - Signal K path of the 1st parameter': This is the signal k path of the variable that you want to plot in the line i. Ex: 'navigation.position'.
* 'SKi - Short code of 5 to 10 digits (prefix) of the ird parameter: This is a prefix that is plotted before the content of the field. Ex: 'SOG (m/s):'.
* 'SKi - Offset value to be added to the value of the field': Ex: You can offset the value of temperature to plot the value in Celsius instead of Kelvin.
* 'SKi - Parameter that is going to multiply the value of the field': Ex: It can be use to change the unit of the field to plot.
* 'SKi - Is active': This field enable or disable the plotting of the line i.

Important: Actually, only the first line SK1 is configured to properly plot the JSON content of the 'navigation.position'. It is maybe necessary to disable the plotting of the second line SK2 to have enough space (2 lines) to plot the content of this field.

## Troubleshooting
If the display isn't found you can run `ls /dev/*i2c*` which should return `/dev/i2c-1`. If it doesnt return then make sure that the i2c bus is enabled using raspi-config.

You can also download the i2c-tools by running `sudo apt-get install -y i2c-tools`. Once those are installed you can run `i2cdetect -y 1`. You should see the ssd1306 detected as address 0x3C. If the display isn't detected then go back and check the sensor wiring.

## Authors
* **Jean-David Caprace** - *Author of this plugin*
