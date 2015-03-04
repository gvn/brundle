var lwip = require('lwip');

const PRESERVE_MATCHES = true;
const VIZMODE = 'scaledOpacity';

lwip.open('img/dude-0.jpg', function(err, image1){
  lwip.open('img/dude-100.jpg', function (err, image2) {
    lwip.create(image1.width(), image1.height(), function(err, diffImage) {
      var
        batch = diffImage.batch(),
        pixel1,
        pixel2,
        savedPixel = image1.getPixel(0,0);

      for (var y = 0; y < image1.height(); y++) {
        for (var x = image1.width() - 1; x > 0; x--) {

          pixel1 = image1.getPixel(x,y);
          pixel2 = image2.getPixel(x,y);

          if (pixel1.r === pixel2.r && pixel1.g === pixel2.g && pixel1.b === pixel2.b) {
            if (PRESERVE_MATCHES) {
              batch.setPixel(x, y, pixel1);
            }

            savedPixel = pixel1;
          } else {
            ({
              difference: function () {
                batch.setPixel(x, y, {
                  r: Math.abs(pixel2.r - pixel1.r),
                  g: Math.abs(pixel2.g - pixel1.g),
                  b: Math.abs(pixel2.b - pixel1.b)
                });
              },
              scaledOpacity: function () {
                // Mapping 0 (identical pixel delta) -> 765 (black and white) to 0 -> 100 (opacity)

                var delta =
                  Math.abs(pixel2.r - pixel1.r) +
                  Math.abs(pixel2.g - pixel1.g) +
                  Math.abs(pixel2.b - pixel1.b);

                var scaled = Math.floor( (delta / 765) * 100 );

                batch.setPixel(x, y, {
                  r: 0,
                  g: 0,
                  b: 0,
                  a: scaled
                });
              },
              average: function () {
                batch.setPixel(x, y, {
                  r: Math.floor((pixel2.r + pixel1.r) / 2),
                  g: Math.floor((pixel2.g + pixel1.g) / 2),
                  b: Math.floor((pixel2.b + pixel1.b) / 2)
                });
              },
              solid: function () {
                batch.setPixel(x, y, 'black');
              },
              plus: function () {
                batch.setPixel(x, y, 'black');

                if (x - 1 >= 0) {
                  batch.setPixel(x - 1, y, 'black');
                }

                if (x + 1 < image1.width()) {
                  batch.setPixel(x + 1, y, 'black');
                }

                if (y - 1 >= 0) {
                  batch.setPixel(x, y - 1, 'black');
                }

                if (y + 1 < image1.height()) {
                  batch.setPixel(x, y + 1, 'black');
                }
              },
              savedPixel: function () {
                savedPixel.a = savedPixel.a > 0 ? Math.floor(savedPixel.a - 1) : 0; // Fade out
                batch.setPixel(x, y, savedPixel);
              }
            })[VIZMODE]();
          }
        }
        console.log('Finished row ' + (y + 1) + ' of ' + image1.height());
      }

      batch.writeFile('img/diff.png', function (err) {
        if (err) {
          console.error(err);
        }
      });
    });
  });
});
