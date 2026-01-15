// GIF Worker - Simplified LZW Encoder
(function() {
  'use strict';

  // ByteArray helper
  function ByteArray() {
    this.data = [];
  }
  
  ByteArray.prototype.writeByte = function(val) {
    this.data.push(val);
  };
  
  ByteArray.prototype.writeBytes = function(array, offset, length) {
    for (var i = offset || 0; i < (length || array.length); i++) {
      this.writeByte(array[i]);
    }
  };
  
  ByteArray.prototype.getData = function() {
    return new Uint8Array(this.data);
  };

  // NeuQuant Neural-Net Quantization Algorithm
  function NeuQuant(pixels, samplefac) {
    var netsize = 256;
    var prime1 = 499;
    var prime2 = 491;
    var prime3 = 487;
    var prime4 = 503;
    var minpicturebytes = 3 * prime4;
    var maxnetpos = netsize - 1;
    var netbiasshift = 4;
    var ncycles = 100;
    var intbiasshift = 16;
    var intbias = 1 << intbiasshift;
    var gammashift = 10;
    var betashift = 10;
    var beta = intbias >> betashift;
    var betagamma = intbias << (gammashift - betashift);
    var initrad = netsize >> 3;
    var radiusbiasshift = 6;
    var radiusbias = 1 << radiusbiasshift;
    var initradius = initrad * radiusbias;
    var radiusdec = 30;
    var alphabiasshift = 10;
    var initalpha = 1 << alphabiasshift;
    var radbiasshift = 8;
    var radbias = 1 << radbiasshift;
    var alpharadbshift = alphabiasshift + radbiasshift;
    var alpharadbias = 1 << alpharadbshift;

    var network = [];
    var netindex = [];
    var bias = [];
    var freq = [];
    var radpower = [];

    function init() {
      network = [];
      netindex = [];
      bias = [];
      freq = [];
      radpower = [];
      
      for (var i = 0; i < netsize; i++) {
        var v = (i << (netbiasshift + 8)) / netsize;
        network[i] = [v, v, v, 0];
        freq[i] = intbias / netsize;
        bias[i] = 0;
      }
    }

    function unbiasnet() {
      for (var i = 0; i < netsize; i++) {
        network[i][0] >>= netbiasshift;
        network[i][1] >>= netbiasshift;
        network[i][2] >>= netbiasshift;
        network[i][3] = i;
      }
    }

    function altersingle(alpha, i, b, g, r) {
      network[i][0] -= (alpha * (network[i][0] - b)) / initalpha;
      network[i][1] -= (alpha * (network[i][1] - g)) / initalpha;
      network[i][2] -= (alpha * (network[i][2] - r)) / initalpha;
    }

    function alterneigh(radius, i, b, g, r) {
      var lo = Math.max(i - radius, -1);
      var hi = Math.min(i + radius, netsize);
      var j = i + 1;
      var k = i - 1;
      var m = 1;

      while (j < hi || k > lo) {
        var a = radpower[m++];
        if (j < hi) {
          var p = network[j++];
          p[0] -= (a * (p[0] - b)) / alpharadbias;
          p[1] -= (a * (p[1] - g)) / alpharadbias;
          p[2] -= (a * (p[2] - r)) / alpharadbias;
        }
        if (k > lo) {
          var p = network[k--];
          p[0] -= (a * (p[0] - b)) / alpharadbias;
          p[1] -= (a * (p[1] - g)) / alpharadbias;
          p[2] -= (a * (p[2] - r)) / alpharadbias;
        }
      }
    }

    function contest(b, g, r) {
      var bestd = ~(1 << 31);
      var bestbiasd = bestd;
      var bestpos = -1;
      var bestbiaspos = bestpos;

      for (var i = 0; i < netsize; i++) {
        var n = network[i];
        var dist = Math.abs(n[0] - b) + Math.abs(n[1] - g) + Math.abs(n[2] - r);
        if (dist < bestd) {
          bestd = dist;
          bestpos = i;
        }
        var biasdist = dist - (bias[i] >> (intbiasshift - netbiasshift));
        if (biasdist < bestbiasd) {
          bestbiasd = biasdist;
          bestbiaspos = i;
        }
        var betafreq = freq[i] >> betashift;
        freq[i] -= betafreq;
        bias[i] += betafreq << gammashift;
      }
      freq[bestpos] += beta;
      bias[bestpos] -= betagamma;
      return bestbiaspos;
    }

    function inxbuild() {
      var previouscol = 0;
      var startpos = 0;
      
      for (var i = 0; i < netsize; i++) {
        var p = network[i];
        var smallpos = i;
        var smallval = p[1];
        
        for (var j = i + 1; j < netsize; j++) {
          var q = network[j];
          if (q[1] < smallval) {
            smallpos = j;
            smallval = q[1];
          }
        }
        
        var q = network[smallpos];
        if (i !== smallpos) {
          var temp;
          temp = q[0]; q[0] = p[0]; p[0] = temp;
          temp = q[1]; q[1] = p[1]; p[1] = temp;
          temp = q[2]; q[2] = p[2]; p[2] = temp;
          temp = q[3]; q[3] = p[3]; p[3] = temp;
        }
        
        if (smallval !== previouscol) {
          netindex[previouscol] = (startpos + i) >> 1;
          for (var j = previouscol + 1; j < smallval; j++) {
            netindex[j] = i;
          }
          previouscol = smallval;
          startpos = i;
        }
      }
      
      netindex[previouscol] = (startpos + maxnetpos) >> 1;
      for (var j = previouscol + 1; j < 256; j++) {
        netindex[j] = maxnetpos;
      }
    }

    function learn() {
      var lengthcount = pixels.length;
      var alphadec = 30 + ((samplefac - 1) / 3);
      var samplepixels = lengthcount / (3 * samplefac);
      var delta = Math.max(1, samplepixels / ncycles | 0);
      var alpha = initalpha;
      var radius = initradius;
      var rad = radius >> radiusbiasshift;

      for (var i = 0; i < rad; i++) {
        radpower[i] = alpha * (((rad * rad - i * i) * radbias) / (rad * rad));
      }

      var step;
      if (lengthcount < minpicturebytes) {
        step = 3;
      } else if (lengthcount % prime1 !== 0) {
        step = 3 * prime1;
      } else if (lengthcount % prime2 !== 0) {
        step = 3 * prime2;
      } else if (lengthcount % prime3 !== 0) {
        step = 3 * prime3;
      } else {
        step = 3 * prime4;
      }

      var pix = 0;
      for (var i = 0; i < samplepixels; ) {
        var b = (pixels[pix] & 0xff) << netbiasshift;
        var g = (pixels[pix + 1] & 0xff) << netbiasshift;
        var r = (pixels[pix + 2] & 0xff) << netbiasshift;

        var j = contest(b, g, r);
        altersingle(alpha, j, b, g, r);
        if (rad !== 0) alterneigh(rad, j, b, g, r);

        pix += step;
        if (pix >= lengthcount) pix -= lengthcount;
        i++;

        if (delta === 0) delta = 1;
        if (i % delta === 0) {
          alpha -= alpha / alphadec;
          radius -= radius / radiusdec;
          rad = radius >> radiusbiasshift;
          if (rad <= 1) rad = 0;
          for (var j = 0; j < rad; j++) {
            radpower[j] = alpha * (((rad * rad - j * j) * radbias) / (rad * rad));
          }
        }
      }
    }

    function buildColorMap() {
      var map = [];
      var index = [];
      for (var i = 0; i < netsize; i++) {
        index[network[i][3]] = i;
      }
      for (var i = 0; i < netsize; i++) {
        var j = index[i];
        map[i * 3] = network[j][0];
        map[i * 3 + 1] = network[j][1];
        map[i * 3 + 2] = network[j][2];
      }
      return map;
    }

    function lookup(b, g, r) {
      var bestd = 1000;
      var best = -1;
      var i = netindex[g];
      var j = i - 1;

      while (i < netsize || j >= 0) {
        if (i < netsize) {
          var p = network[i];
          var dist = p[1] - g;
          if (dist >= bestd) {
            i = netsize;
          } else {
            i++;
            if (dist < 0) dist = -dist;
            var a = p[0] - b;
            if (a < 0) a = -a;
            dist += a;
            if (dist < bestd) {
              a = p[2] - r;
              if (a < 0) a = -a;
              dist += a;
              if (dist < bestd) {
                bestd = dist;
                best = p[3];
              }
            }
          }
        }
        if (j >= 0) {
          var p = network[j];
          var dist = g - p[1];
          if (dist >= bestd) {
            j = -1;
          } else {
            j--;
            if (dist < 0) dist = -dist;
            var a = p[0] - b;
            if (a < 0) a = -a;
            dist += a;
            if (dist < bestd) {
              a = p[2] - r;
              if (a < 0) a = -a;
              dist += a;
              if (dist < bestd) {
                bestd = dist;
                best = p[3];
              }
            }
          }
        }
      }
      return best;
    }

    this.process = function() {
      init();
      learn();
      unbiasnet();
      inxbuild();
      return buildColorMap();
    };

    this.map = lookup;
  }

  // LZW Encoder
  function LZWEncoder(width, height, pixels, colorDepth) {
    var initCodeSize = Math.max(2, colorDepth);
    var accum = new Uint8Array(256);
    var htab = new Int32Array(5003);
    var codetab = new Int32Array(5003);
    var cur_accum = 0;
    var cur_bits = 0;
    var a_count = 0;
    var remaining;
    var curPixel;
    var n_bits;
    var maxcode;
    var free_ent;
    var clear_flg = false;
    var g_init_bits;
    var ClearCode;
    var EOFCode;

    var masks = [
      0x0000, 0x0001, 0x0003, 0x0007, 0x000F, 0x001F, 0x003F, 0x007F,
      0x00FF, 0x01FF, 0x03FF, 0x07FF, 0x0FFF, 0x1FFF, 0x3FFF, 0x7FFF, 0xFFFF
    ];

    function char_out(c, outs) {
      accum[a_count++] = c;
      if (a_count >= 254) flush_char(outs);
    }

    function cl_block(outs) {
      cl_hash(5003);
      free_ent = ClearCode + 2;
      clear_flg = true;
      output(ClearCode, outs);
    }

    function cl_hash(hsize) {
      for (var i = 0; i < hsize; i++) htab[i] = -1;
    }

    function compress(init_bits, outs) {
      g_init_bits = init_bits;
      clear_flg = false;
      n_bits = g_init_bits;
      maxcode = (1 << n_bits) - 1;
      ClearCode = 1 << (init_bits - 1);
      EOFCode = ClearCode + 1;
      free_ent = ClearCode + 2;
      a_count = 0;

      var ent = nextPixel();
      var hshift = 0;
      for (var fcode = 5003; fcode < 65536; fcode *= 2) ++hshift;
      hshift = 8 - hshift;

      cl_hash(5003);
      output(ClearCode, outs);

      var c;
      outer: while ((c = nextPixel()) !== -1) {
        var fcode = (c << 12) + ent;
        var i = (c << hshift) ^ ent;

        if (htab[i] === fcode) {
          ent = codetab[i];
          continue;
        } else if (htab[i] >= 0) {
          var disp = 5003 - i;
          if (i === 0) disp = 1;
          do {
            if ((i -= disp) < 0) i += 5003;
            if (htab[i] === fcode) {
              ent = codetab[i];
              continue outer;
            }
          } while (htab[i] >= 0);
        }

        output(ent, outs);
        ent = c;
        if (free_ent < 4096) {
          codetab[i] = free_ent++;
          htab[i] = fcode;
        } else {
          cl_block(outs);
        }
      }
      output(ent, outs);
      output(EOFCode, outs);
    }

    function flush_char(outs) {
      if (a_count > 0) {
        outs.writeByte(a_count);
        outs.writeBytes(accum, 0, a_count);
        a_count = 0;
      }
    }

    function nextPixel() {
      if (remaining === 0) return -1;
      --remaining;
      return pixels[curPixel++] & 0xff;
    }

    function output(code, outs) {
      cur_accum &= masks[cur_bits];
      if (cur_bits > 0) cur_accum |= code << cur_bits;
      else cur_accum = code;
      cur_bits += n_bits;

      while (cur_bits >= 8) {
        char_out(cur_accum & 0xff, outs);
        cur_accum >>= 8;
        cur_bits -= 8;
      }

      if (free_ent > maxcode || clear_flg) {
        if (clear_flg) {
          maxcode = (1 << (n_bits = g_init_bits)) - 1;
          clear_flg = false;
        } else {
          ++n_bits;
          maxcode = n_bits === 12 ? 4096 : (1 << n_bits) - 1;
        }
      }

      if (code === EOFCode) {
        while (cur_bits > 0) {
          char_out(cur_accum & 0xff, outs);
          cur_accum >>= 8;
          cur_bits -= 8;
        }
        flush_char(outs);
      }
    }

    this.encode = function(outs) {
      outs.writeByte(initCodeSize);
      remaining = width * height;
      curPixel = 0;
      compress(initCodeSize + 1, outs);
      outs.writeByte(0);
    };
  }

  // GIF Encoder
  function GIFEncoder() {
    var width, height;
    var transparent = null;
    var transIndex = 0;
    var repeat = 0;
    var delay = 0;
    var out;
    var image;
    var indexedPixels;
    var colorTab;
    var colorDepth = 8;
    var palSize = 7;
    var firstFrame = true;
    var sample = 10;

    this.setDelay = function(ms) { delay = Math.round(ms / 10); };
    this.setRepeat = function(iter) { repeat = iter; };
    this.setQuality = function(q) { sample = Math.max(1, q); };
    this.setSize = function(w, h) { width = w; height = h; };

    this.start = function() {
      out = new ByteArray();
      out.writeBytes([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]); // GIF89a
      firstFrame = true;
    };

    this.addFrame = function(imageData) {
      image = imageData;
      analyzePixels();
      if (firstFrame) {
        writeLSD();
        writePalette();
        if (repeat >= 0) writeNetscapeExt();
      }
      writeGraphicCtrlExt();
      writeImageDesc();
      if (!firstFrame) writePalette();
      writePixels();
      firstFrame = false;
    };

    this.finish = function() {
      out.writeByte(0x3b); // GIF trailer
      return out.getData();
    };

    function analyzePixels() {
      var len = image.length;
      var nPix = len / 4;
      var pixels = new Uint8Array(nPix * 3);
      
      var k = 0;
      for (var i = 0; i < nPix; i++) {
        var j = i * 4;
        pixels[k++] = image[j];     // R
        pixels[k++] = image[j + 1]; // G
        pixels[k++] = image[j + 2]; // B
      }

      var nq = new NeuQuant(pixels, sample);
      colorTab = nq.process();

      indexedPixels = new Uint8Array(nPix);
      k = 0;
      for (var i = 0; i < nPix; i++) {
        var index = nq.map(
          pixels[k++] & 0xff,
          pixels[k++] & 0xff,
          pixels[k++] & 0xff
        );
        indexedPixels[i] = index;
      }
    }

    function writeLSD() {
      writeShort(width);
      writeShort(height);
      out.writeByte(0x80 | 0x70 | palSize);
      out.writeByte(0);
      out.writeByte(0);
    }

    function writePalette() {
      out.writeBytes(colorTab);
      var n = 3 * 256 - colorTab.length;
      for (var i = 0; i < n; i++) out.writeByte(0);
    }

    function writeNetscapeExt() {
      out.writeByte(0x21);
      out.writeByte(0xff);
      out.writeByte(11);
      out.writeBytes([0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2e, 0x30]); // NETSCAPE2.0
      out.writeByte(3);
      out.writeByte(1);
      writeShort(repeat);
      out.writeByte(0);
    }

    function writeGraphicCtrlExt() {
      out.writeByte(0x21);
      out.writeByte(0xf9);
      out.writeByte(4);
      out.writeByte(0);
      writeShort(delay);
      out.writeByte(0);
      out.writeByte(0);
    }

    function writeImageDesc() {
      out.writeByte(0x2c);
      writeShort(0);
      writeShort(0);
      writeShort(width);
      writeShort(height);
      out.writeByte(firstFrame ? 0 : 0x80 | palSize);
    }

    function writePixels() {
      var enc = new LZWEncoder(width, height, indexedPixels, colorDepth);
      enc.encode(out);
    }

    function writeShort(v) {
      out.writeByte(v & 0xff);
      out.writeByte((v >> 8) & 0xff);
    }
  }

  // Worker message handler
  var encoder = null;
  
  self.onmessage = function(e) {
    var data = e.data;
    
    if (data.type === 'start') {
      encoder = new GIFEncoder();
      encoder.setRepeat(data.repeat || 0);
      encoder.setDelay(data.delay || 100);
      encoder.setQuality(data.quality || 10);
      encoder.setSize(data.width, data.height);
      encoder.start();
      self.postMessage({ type: 'started' });
    } 
    else if (data.type === 'frame') {
      if (encoder) {
        encoder.addFrame(data.data);
        self.postMessage({ type: 'progress', current: data.index + 1, total: data.total });
      }
    } 
    else if (data.type === 'finish') {
      if (encoder) {
        var result = encoder.finish();
        self.postMessage({ type: 'finished', data: result }, [result.buffer]);
        encoder = null;
      }
    }
  };
})();
