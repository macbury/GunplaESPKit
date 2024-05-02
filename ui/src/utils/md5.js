import SparkMD5 from "spark-md5";

export function hashMD5(file) {
  return new Promise((resolve, reject) => {
    var blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice,
    chunkSize = 2097152,                             // Read in chunks of 2MB
    chunks = Math.ceil(file.size / chunkSize),
    currentChunk = 0,
    spark = new SparkMD5.ArrayBuffer(),
    fileReader = new FileReader();

    fileReader.onload = function (e) {
      console.log('read chunk no', currentChunk + 1, 'of', chunks);
      spark.append(e.target.result);                   // Append array buffer
      currentChunk++;

      if (currentChunk < chunks) {
        loadNext();
      } else {
        const hash = spark.end();
        console.log('finished loading');
        console.info('computed hash', hash);  // Compute hash
        resolve(hash)
      }
    };

    fileReader.onerror = function () {
      console.warn('oops, something went wrong.');
      reject()
    };

    function loadNext() {
      var start = currentChunk * chunkSize,
        end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize;

      fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
    }

    loadNext();
  });
}

const HASH_SALT = "a543dbba3f3df3c2af6d604b06febb1ca07de5ca67a9e5782f5a5f7878953fe6af6f272b0ba5df154a5dbbb73824f9662a15532bb53af5ed014fff3d8854a386"

/// Get mac address and hash it multiple times with salt
export function redactMac(mac, passLeft = 32) {
  const spark = new SparkMD5();
  spark.append(HASH_SALT);
  spark.append(mac);

  const hash = spark.end();
  if (passLeft > 0) {
    return redactMac(hash, passLeft - 1)
  } else {
    return hash;
  }
}
