# esp8266js

ESP8266 Simulator in JavaScript from Wokwi

## Building the ESP8266 "Hello World" app

Install python3 and pip. On Ubuntu:

```
sudo apt install python3 python3-pip python-is-python3
```

Then clone the ESP8266_RTOS_SDK and build the "Hello World" app:

```
git clone https://github.com/espressif/ESP8266_RTOS_SDK
cd ESP8266_RTOS_SDK
./install.sh
. ./export.sh
cd examples/get-started/hello_world
make
export HELLO_WORLD_PATH=`pwd`
```

## Simulating the ESP8266 "Hello World" app

```
npm start -- 0x0 $HELLO_WORLD_PATH/build/bootloader/bootloader.bin 0x8000 $HELLO_WORLD_PATH/build/partitions_singleapp.bin 0x10000 $HELLO_WORLD_PATH/build/hello-world.bin
```

Enjoy!

## License

Released under the [MIT licence](./LICENSE). Copyright (c) 2022-2023, Uri Shaked.
