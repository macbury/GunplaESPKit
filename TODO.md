### TODO:

- connect using hue?
 - https://github.com/Aircoookie/WLED/blob/0a815179a27a0ded2aa0462385a5bab82ddc6252/wled00/hue.cpp#L4
- automation card
  - cron settings
- save wifi settings in localstorage, ask to load wifi in wifiscreen

- endpoint should return chip version and git ref to github
- add menu filter the device by its naem and store name
- local db of devices
  - get mac and id
  - save name for it

- backup pairing codes and accessories

### GunplaLocalNetwork

- each gunpla can setup network hash
  - network hash is used for generating encrypted keys
  - you can put network key on configuration page
- create new mdns record for gunpla connection
  - GESK key
  - txt with hash key
- tcp server
  - on connection send encrypted random hex
  - wait for connection to encode hash key and send it back
  - use protocol to send rpc commands

### Effects
https://github.com/jandelgado/jled/tree/master

```json
[
  {
    "id": 1,
    "name": "Running",
    "sequence": [{
      { "k": "FADE", "s": 10 }
    }]
  }
]
```
