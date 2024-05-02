# (openssl s_client -showcerts -connect stackexchange.com:443 < /dev/null) | openssl x509 -noout -text > ./src/firmware/root.pem
echo QUIT | openssl s_client -showcerts -connect gunpla-esp-kit.vercel.app:443 2>/dev/null | awk '/-----BEGIN CERTIFICATE-----/ {p=1}; p; /-----END CERTIFICATE-----/ {p=0}' > ./src/firmware/root.pem
mkdir -p ./src/firmware/partitions
cp ~/.platformio/packages/framework-arduinoespressif32/tools/partitions/*.bin ./src/firmware/partitions
mkdir -p ./src/firmware/esp32dev
cp ../.pio/build/esp32-dev/*.bin ./src/firmware/esp32dev;
openssl dgst -md5 -r README.md | cut -d' ' -f1 > ./src/firmware/esp32dev/firmware.md5
mkdir -p ./src/firmware/esp32devS3
cp ../.pio/build/esp32-devS3/*.bin ./src/firmware/esp32devS3;
openssl dgst -md5 -r README.md | cut -d' ' -f1 > ./src/firmware/esp32devS3/firmware.md5
cp ../LICENSE ./src/firmware/
echo "2024.2.19" > ./src/firmware/version
