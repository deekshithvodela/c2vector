var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// node_modules/potrace/lib/types/Point.js
var require_Point = __commonJS({
  "node_modules/potrace/lib/types/Point.js"(exports, module) {
    "use strict";
    function Point(x, y) {
      this.x = x || 0;
      this.y = y || 0;
    }
    Point.prototype = {
      copy: function() {
        return new Point(this.x, this.y);
      }
    };
    module.exports = Point;
  }
});

// node_modules/potrace/lib/utils.js
var require_utils = __commonJS({
  "node_modules/potrace/lib/utils.js"(exports, module) {
    "use strict";
    var Point = require_Point();
    var attrRegexps = {};
    function getAttrRegexp(attrName) {
      if (attrRegexps[attrName]) {
        return attrRegexps[attrName];
      }
      attrRegexps[attrName] = new RegExp(" " + attrName + '="((?:\\\\(?=")"|[^"])+)"', "i");
      return attrRegexps[attrName];
    }
    function setHtmlAttribute(html, attrName, value) {
      var attr = " " + attrName + '="' + value + '"';
      if (html.indexOf(" " + attrName + '="') === -1) {
        html = html.replace(/<[a-z]+/i, function(beginning) {
          return beginning + attr;
        });
      } else {
        html = html.replace(getAttrRegexp(attrName), attr);
      }
      return html;
    }
    function fixed(number) {
      return number.toFixed(3).replace(".000", "");
    }
    function mod(a, n) {
      return a >= n ? a % n : a >= 0 ? a : n - 1 - (-1 - a) % n;
    }
    function xprod(p1, p2) {
      return p1.x * p2.y - p1.y * p2.x;
    }
    function cyclic(a, b, c) {
      if (a <= c) {
        return a <= b && b < c;
      } else {
        return a <= b || b < c;
      }
    }
    function sign(i) {
      return i > 0 ? 1 : i < 0 ? -1 : 0;
    }
    function quadform(Q, w) {
      var v = new Array(3), i, j, sum;
      v[0] = w.x;
      v[1] = w.y;
      v[2] = 1;
      sum = 0;
      for (i = 0; i < 3; i++) {
        for (j = 0; j < 3; j++) {
          sum += v[i] * Q.at(i, j) * v[j];
        }
      }
      return sum;
    }
    function interval(lambda, a, b) {
      var res = new Point();
      res.x = a.x + lambda * (b.x - a.x);
      res.y = a.y + lambda * (b.y - a.y);
      return res;
    }
    function dorth_infty(p0, p2) {
      var r = new Point();
      r.y = sign(p2.x - p0.x);
      r.x = -sign(p2.y - p0.y);
      return r;
    }
    function ddenom(p0, p2) {
      var r = dorth_infty(p0, p2);
      return r.y * (p2.x - p0.x) - r.x * (p2.y - p0.y);
    }
    function dpara(p0, p1, p2) {
      var x1, y1, x2, y2;
      x1 = p1.x - p0.x;
      y1 = p1.y - p0.y;
      x2 = p2.x - p0.x;
      y2 = p2.y - p0.y;
      return x1 * y2 - x2 * y1;
    }
    function cprod(p0, p1, p2, p3) {
      var x1, y1, x2, y2;
      x1 = p1.x - p0.x;
      y1 = p1.y - p0.y;
      x2 = p3.x - p2.x;
      y2 = p3.y - p2.y;
      return x1 * y2 - x2 * y1;
    }
    function iprod(p0, p1, p2) {
      var x1, y1, x2, y2;
      x1 = p1.x - p0.x;
      y1 = p1.y - p0.y;
      x2 = p2.x - p0.x;
      y2 = p2.y - p0.y;
      return x1 * x2 + y1 * y2;
    }
    function iprod1(p0, p1, p2, p3) {
      var x1, y1, x2, y2;
      x1 = p1.x - p0.x;
      y1 = p1.y - p0.y;
      x2 = p3.x - p2.x;
      y2 = p3.y - p2.y;
      return x1 * x2 + y1 * y2;
    }
    function ddist(p, q) {
      return Math.sqrt((p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y));
    }
    module.exports = {
      luminance: function(r, g, b) {
        return Math.round(0.2126 * r + 0.7153 * g + 0.0721 * b);
      },
      between: function(val, min, max) {
        return val >= min && val <= max;
      },
      clamp: function(val, min, max) {
        return Math.min(max, Math.max(min, val));
      },
      isNumber: function(val) {
        return typeof val === "number";
      },
      setHtmlAttr: setHtmlAttribute,
      /**
       * Generates path instructions for given curve
       *
       * @param {Curve} curve
       * @param {Number} [scale]
       * @returns {string}
       */
      renderCurve: function(curve, scale) {
        scale = scale || { x: 1, y: 1 };
        var startingPoint = curve.c[(curve.n - 1) * 3 + 2];
        var path = [
          "M " + fixed(startingPoint.x * scale.x) + " " + fixed(startingPoint.y * scale.y)
        ];
        curve.tag.forEach(function(tag, i) {
          var i3 = i * 3;
          var p0 = curve.c[i3];
          var p1 = curve.c[i3 + 1];
          var p2 = curve.c[i3 + 2];
          if (tag === "CURVE") {
            path.push(
              "C " + fixed(p0.x * scale.x) + " " + fixed(p0.y * scale.y) + ", " + fixed(p1.x * scale.x) + " " + fixed(p1.y * scale.y) + ", " + fixed(p2.x * scale.x) + " " + fixed(p2.y * scale.y)
            );
          } else if (tag === "CORNER") {
            path.push(
              "L " + fixed(p1.x * scale.x) + " " + fixed(p1.y * scale.y) + " " + fixed(p2.x * scale.x) + " " + fixed(p2.y * scale.y)
            );
          }
        });
        path.push("Z");
        return path.join(" ");
      },
      bezier: function bezier(t, p0, p1, p2, p3) {
        var s = 1 - t, res = new Point();
        res.x = s * s * s * p0.x + 3 * (s * s * t) * p1.x + 3 * (t * t * s) * p2.x + t * t * t * p3.x;
        res.y = s * s * s * p0.y + 3 * (s * s * t) * p1.y + 3 * (t * t * s) * p2.y + t * t * t * p3.y;
        return res;
      },
      tangent: function tangent(p0, p1, p2, p3, q0, q1) {
        var A, B, C, a, b, c, d, s, r1, r2;
        A = cprod(p0, p1, q0, q1);
        B = cprod(p1, p2, q0, q1);
        C = cprod(p2, p3, q0, q1);
        a = A - 2 * B + C;
        b = -2 * A + 2 * B;
        c = A;
        d = b * b - 4 * a * c;
        if (a === 0 || d < 0) {
          return -1;
        }
        s = Math.sqrt(d);
        r1 = (-b + s) / (2 * a);
        r2 = (-b - s) / (2 * a);
        if (r1 >= 0 && r1 <= 1) {
          return r1;
        } else if (r2 >= 0 && r2 <= 1) {
          return r2;
        } else {
          return -1;
        }
      },
      mod,
      xprod,
      cyclic,
      sign,
      quadform,
      interval,
      dorth_infty,
      ddenom,
      dpara,
      cprod,
      iprod,
      iprod1,
      ddist
    };
  }
});

// ../../.gemini/antigravity-ide/brain/707012b4-7cd2-44d9-a41a-2adb7ae1ed50/scratch/jimp_stub.js
var require_jimp_stub = __commonJS({
  "../../.gemini/antigravity-ide/brain/707012b4-7cd2-44d9-a41a-2adb7ae1ed50/scratch/jimp_stub.js"(exports, module) {
    module.exports = {};
  }
});

// node_modules/potrace/lib/types/Histogram.js
var require_Histogram = __commonJS({
  "node_modules/potrace/lib/types/Histogram.js"(exports, module) {
    "use strict";
    var utils2 = require_utils();
    var Jimp = null;
    try {
      Jimp = require_jimp_stub();
    } catch (e) {
    }
    var Bitmap2 = require_Bitmap();
    var COLOR_DEPTH = 256;
    var COLOR_RANGE_END = COLOR_DEPTH - 1;
    function index(x, y) {
      return COLOR_DEPTH * x + y;
    }
    function normalizeMinMax(levelMin, levelMax) {
      levelMin = typeof levelMin === "number" ? utils2.clamp(Math.round(levelMin), 0, COLOR_RANGE_END) : 0;
      levelMax = typeof levelMax === "number" ? utils2.clamp(Math.round(levelMax), 0, COLOR_RANGE_END) : COLOR_RANGE_END;
      if (levelMin > levelMax) {
        throw new Error('Invalid range "' + levelMin + "..." + levelMax + '"');
      }
      return [levelMin, levelMax];
    }
    function Histogram(imageSource, mode) {
      this.data = null;
      this.pixels = 0;
      this._sortedIndexes = null;
      this._cachedStats = {};
      this._lookupTableH = null;
      if (typeof imageSource === "number") {
        this._createArray(imageSource);
      } else if (imageSource instanceof Bitmap2) {
        this._collectValuesBitmap(imageSource);
      } else if (Jimp && imageSource instanceof Jimp) {
        this._collectValuesJimp(imageSource, mode);
      } else {
        throw new Error("Unsupported image source");
      }
    }
    Histogram.MODE_LUMINANCE = "luminance";
    Histogram.MODE_R = "r";
    Histogram.MODE_G = "g";
    Histogram.MODE_B = "b";
    Histogram.prototype = {
      /**
       * Initializes data array for an image of given pixel size
       * @param imageSize
       * @returns {Uint8Array|Uint16Array|Uint32Array}
       * @private
       */
      _createArray: function(imageSize) {
        var ArrayType = imageSize <= Math.pow(2, 8) ? Uint8Array : imageSize <= Math.pow(2, 16) ? Uint16Array : Uint32Array;
        this.pixels = imageSize;
        return this.data = new ArrayType(COLOR_DEPTH);
      },
      /**
       * Aggregates color data from {@link Jimp} instance
       * @param {Jimp} source
       * @param mode
       * @private
       */
      _collectValuesJimp: function(source, mode) {
        var pixelData = source.bitmap.data;
        var data = this._createArray(source.bitmap.width * source.bitmap.height);
        source.scan(0, 0, source.bitmap.width, source.bitmap.height, function(x, y, idx) {
          var val = mode === Histogram.MODE_R ? pixelData[idx] : mode === Histogram.MODE_G ? pixelData[idx + 1] : mode === Histogram.MODE_B ? pixelData[idx + 2] : utils2.luminance(pixelData[idx], pixelData[idx + 1], pixelData[idx + 2]);
          data[val]++;
        });
      },
      /**
       * Aggregates color data from {@link Bitmap} instance
       * @param {Bitmap} source
       * @private
       */
      _collectValuesBitmap: function(source) {
        var data = this._createArray(source.size);
        var len = source.data.length;
        var color;
        for (var i = 0; i < len; i++) {
          color = source.data[i];
          data[color]++;
        }
      },
      /**
       * Returns array of color indexes in ascending order
       * @param refresh
       * @returns {*}
       * @private
       */
      _getSortedIndexes: function(refresh) {
        if (!refresh && this._sortedIndexes) {
          return this._sortedIndexes;
        }
        var data = this.data;
        var indexes = new Array(COLOR_DEPTH);
        var i = 0;
        for (i; i < COLOR_DEPTH; i++) {
          indexes[i] = i;
        }
        indexes.sort(function(a, b) {
          return data[a] > data[b] ? 1 : data[a] < data[b] ? -1 : 0;
        });
        this._sortedIndexes = indexes;
        return indexes;
      },
      /**
       * Builds lookup table H from lookup tables P and S.
       * see {@link http://www.iis.sinica.edu.tw/page/jise/2001/200109_01.pdf|this paper} for more details
       *
       * @returns {Float64Array}
       * @private
       */
      _thresholdingBuildLookupTable: function() {
        var P = new Float64Array(COLOR_DEPTH * COLOR_DEPTH);
        var S = new Float64Array(COLOR_DEPTH * COLOR_DEPTH);
        var H = new Float64Array(COLOR_DEPTH * COLOR_DEPTH);
        var pixelsTotal = this.pixels;
        var i, j, idx, tmp;
        for (i = 1; i < COLOR_DEPTH; ++i) {
          idx = index(i, i);
          tmp = this.data[i] / pixelsTotal;
          P[idx] = tmp;
          S[idx] = i * tmp;
        }
        for (i = 1; i < COLOR_DEPTH - 1; ++i) {
          tmp = this.data[i + 1] / pixelsTotal;
          idx = index(1, i);
          P[idx + 1] = P[idx] + tmp;
          S[idx + 1] = S[idx] + (i + 1) * tmp;
        }
        for (i = 2; i < COLOR_DEPTH; i++) {
          for (j = i + 1; j < COLOR_DEPTH; j++) {
            P[index(i, j)] = P[index(1, j)] - P[index(1, i - 1)];
            S[index(i, j)] = S[index(1, j)] - S[index(1, i - 1)];
          }
        }
        for (i = 1; i < COLOR_DEPTH; ++i) {
          for (j = i + 1; j < COLOR_DEPTH; j++) {
            idx = index(i, j);
            H[idx] = P[idx] !== 0 ? S[idx] * S[idx] / P[idx] : 0;
          }
        }
        return this._lookupTableH = H;
      },
      /**
       * Implements Algorithm For Multilevel Thresholding
       * Receives desired number of color stops, returns array of said size. Could be limited to a range levelMin..levelMax
       *
       * Regardless of levelMin and levelMax values it still relies on between class variances for the entire histogram
       *
       * @param amount - how many thresholds should be calculated
       * @param [levelMin=0] - histogram segment start
       * @param [levelMax=255] - histogram segment end
       * @returns {number[]}
      */
      multilevelThresholding: function(amount, levelMin, levelMax) {
        levelMin = normalizeMinMax(levelMin, levelMax);
        levelMax = levelMin[1];
        levelMin = levelMin[0];
        amount = Math.min(levelMax - levelMin - 2, ~~amount);
        if (amount < 1) {
          return [];
        }
        if (!this._lookupTableH) {
          this._thresholdingBuildLookupTable();
        }
        var H = this._lookupTableH;
        var colorStops = null;
        var maxSig = 0;
        if (amount > 4) {
          console.log("[Warning]: Threshold computation for more than 5 levels may take a long time");
        }
        function iterateRecursive(startingPoint, prevVariance, indexes, previousDepth) {
          startingPoint = (startingPoint || 0) + 1;
          prevVariance = prevVariance || 0;
          indexes = indexes || new Array(amount);
          previousDepth = previousDepth || 0;
          var depth = previousDepth + 1;
          var variance;
          for (var i = startingPoint; i < levelMax - amount + previousDepth; i++) {
            variance = prevVariance + H[index(startingPoint, i)];
            indexes[depth - 1] = i;
            if (depth + 1 < amount + 1) {
              iterateRecursive(i, variance, indexes, depth);
            } else {
              variance += H[index(i + 1, levelMax)];
              if (maxSig < variance) {
                maxSig = variance;
                colorStops = indexes.slice();
              }
            }
          }
        }
        iterateRecursive(levelMin || 0);
        return colorStops ? colorStops : [];
      },
      /**
       * Automatically finds threshold value using Algorithm For Multilevel Thresholding
       *
       * @param {number} [levelMin]
       * @param {number} [levelMax]
       * @returns {null|number}
       */
      autoThreshold: function(levelMin, levelMax) {
        var value = this.multilevelThresholding(1, levelMin, levelMax);
        return value.length ? value[0] : null;
      },
      /**
       * Returns dominant color in given range. Returns -1 if not a single color from the range present on the image
       *
       * @param [levelMin=0]
       * @param [levelMax=255]
       * @param [tolerance=1]
       * @returns {number}
       */
      getDominantColor: function(levelMin, levelMax, tolerance) {
        levelMin = normalizeMinMax(levelMin, levelMax);
        levelMax = levelMin[1];
        levelMin = levelMin[0];
        tolerance = tolerance || 1;
        var colors = this.data, dominantIndex = -1, dominantValue = -1, i, j, tmp;
        if (levelMin === levelMax) {
          return colors[levelMin] ? levelMin : -1;
        }
        for (i = levelMin; i <= levelMax; i++) {
          tmp = 0;
          for (j = ~~(tolerance / -2); j < tolerance; j++) {
            tmp += utils2.between(i + j, 0, COLOR_RANGE_END) ? colors[i + j] : 0;
          }
          var summIsBigger = tmp > dominantValue;
          var summEqualButMainColorIsBigger = dominantValue === tmp && (dominantIndex < 0 || colors[i] > colors[dominantIndex]);
          if (summIsBigger || summEqualButMainColorIsBigger) {
            dominantIndex = i;
            dominantValue = tmp;
          }
        }
        return dominantValue <= 0 ? -1 : dominantIndex;
      },
      /**
       * Returns stats for histogram or its segment.
       *
       * Returned object contains median, mean and standard deviation for pixel values;
       * peak, mean and median number of pixels per level and few other values
       *
       * If no pixels colors from specified range present on the image - most values will be NaN
       *
       * @param {Number} [levelMin=0] - histogram segment start
       * @param {Number} [levelMax=255] - histogram segment end
       * @param {Boolean} [refresh=false] - if cached result can be returned
       * @returns {{levels: {mean: (number|*), median: *, stdDev: number, unique: number}, pixelsPerLevel: {mean: (number|*), median: (number|*), peak: number}, pixels: number}}
       */
      getStats: function(levelMin, levelMax, refresh) {
        levelMin = normalizeMinMax(levelMin, levelMax);
        levelMax = levelMin[1];
        levelMin = levelMin[0];
        if (!refresh && this._cachedStats[levelMin + "-" + levelMax]) {
          return this._cachedStats[levelMin + "-" + levelMax];
        }
        var data = this.data;
        var sortedIndexes = this._getSortedIndexes();
        var pixelsTotal = 0;
        var medianValue = null;
        var meanValue;
        var medianPixelIndex;
        var pixelsPerLevelMean;
        var pixelsPerLevelMedian;
        var tmpSumOfDeviations = 0;
        var tmpPixelsIterated = 0;
        var allPixelValuesCombined = 0;
        var i, tmpPixels, tmpPixelValue;
        var uniqueValues = 0;
        var mostPixelsPerLevel = 0;
        for (i = levelMin; i <= levelMax; i++) {
          pixelsTotal += data[i];
          allPixelValuesCombined += data[i] * i;
          uniqueValues += data[i] === 0 ? 0 : 1;
          if (mostPixelsPerLevel < data[i]) {
            mostPixelsPerLevel = data[i];
          }
        }
        meanValue = allPixelValuesCombined / pixelsTotal;
        pixelsPerLevelMean = pixelsTotal / (levelMax - levelMin);
        pixelsPerLevelMedian = pixelsTotal / uniqueValues;
        medianPixelIndex = Math.floor(pixelsTotal / 2);
        for (i = 0; i < COLOR_DEPTH; i++) {
          tmpPixelValue = sortedIndexes[i];
          tmpPixels = data[tmpPixelValue];
          if (tmpPixelValue < levelMin || tmpPixelValue > levelMax) {
            continue;
          }
          tmpPixelsIterated += tmpPixels;
          tmpSumOfDeviations += Math.pow(tmpPixelValue - meanValue, 2) * tmpPixels;
          if (medianValue === null && tmpPixelsIterated >= medianPixelIndex) {
            medianValue = tmpPixelValue;
          }
        }
        return this._cachedStats[levelMin + "-" + levelMax] = {
          // various pixel counts for levels (0..255)
          levels: {
            mean: meanValue,
            median: medianValue,
            stdDev: Math.sqrt(tmpSumOfDeviations / pixelsTotal),
            unique: uniqueValues
          },
          // what's visually represented as bars
          pixelsPerLevel: {
            mean: pixelsPerLevelMean,
            median: pixelsPerLevelMedian,
            peak: mostPixelsPerLevel
          },
          pixels: pixelsTotal
        };
      }
    };
    module.exports = Histogram;
  }
});

// node_modules/potrace/lib/types/Bitmap.js
var require_Bitmap = __commonJS({
  "node_modules/potrace/lib/types/Bitmap.js"(exports, module) {
    "use strict";
    var Point = require_Point();
    var utils2 = require_utils();
    var Histogram;
    function Bitmap2(w, h) {
      this._histogram = null;
      this.width = w;
      this.height = h;
      this.size = w * h;
      this.arrayBuffer = new ArrayBuffer(this.size);
      this.data = new Uint8Array(this.arrayBuffer);
    }
    module.exports = Bitmap2;
    Histogram = require_Histogram();
    Bitmap2.prototype = {
      /**
       * Returns pixel value
       *
       * @param {Number|Point} x - index, point or x
       * @param {Number} [y]
       */
      getValueAt: function(x, y) {
        var index = typeof x === "number" && typeof y !== "number" ? x : this.pointToIndex(x, y);
        return this.data[index];
      },
      /**
       * Converts {@link Point} to index value
       *
       * @param {Number} index
       * @returns {Point}
       */
      indexToPoint: function(index) {
        var point = new Point();
        if (utils2.between(index, 0, this.size)) {
          point.y = Math.floor(index / this.width);
          point.x = index - point.y * this.width;
        } else {
          point.x = -1;
          point.y = -1;
        }
        return point;
      },
      /**
       * Calculates index for point or coordinate pair
       *
       * @param {Number|Point} pointOrX
       * @param {Number} [y]
       * @returns {Number}
       */
      pointToIndex: function(pointOrX, y) {
        var _x = pointOrX, _y = y;
        if (pointOrX instanceof Point) {
          _x = pointOrX.x;
          _y = pointOrX.y;
        }
        if (!utils2.between(_x, 0, this.width) || !utils2.between(_y, 0, this.height)) {
          return -1;
        }
        return this.width * _y + _x;
      },
      /**
       * Makes a copy of current bitmap
       *
       * @param {Function} [iterator] optional callback, used for processing pixel value. Accepted arguments: value, index
       * @returns {Bitmap}
       */
      copy: function(iterator) {
        var bm = new Bitmap2(this.width, this.height), iteratorPresent = typeof iterator === "function", i;
        for (i = 0; i < this.size; i++) {
          bm.data[i] = iteratorPresent ? iterator(this.data[i], i) : this.data[i];
        }
        return bm;
      },
      histogram: function() {
        var Histogram2 = require_Histogram();
        if (this._histogram) {
          return this._histogram;
        }
        this._histogram = new Histogram2(this);
        return this._histogram;
      }
    };
  }
});

// node_modules/potrace/lib/types/Curve.js
var require_Curve = __commonJS({
  "node_modules/potrace/lib/types/Curve.js"(exports, module) {
    "use strict";
    function Curve(n) {
      this.n = n;
      this.tag = new Array(n);
      this.c = new Array(n * 3);
      this.alphaCurve = 0;
      this.vertex = new Array(n);
      this.alpha = new Array(n);
      this.alpha0 = new Array(n);
      this.beta = new Array(n);
    }
    module.exports = Curve;
  }
});

// node_modules/potrace/lib/types/Path.js
var require_Path = __commonJS({
  "node_modules/potrace/lib/types/Path.js"(exports, module) {
    "use strict";
    function Path() {
      this.area = 0;
      this.len = 0;
      this.curve = {};
      this.pt = [];
      this.minX = 1e5;
      this.minY = 1e5;
      this.maxX = -1;
      this.maxY = -1;
    }
    module.exports = Path;
  }
});

// node_modules/potrace/lib/types/Quad.js
var require_Quad = __commonJS({
  "node_modules/potrace/lib/types/Quad.js"(exports, module) {
    "use strict";
    function Quad() {
      this.data = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    }
    Quad.prototype.at = function(x, y) {
      return this.data[x * 3 + y];
    };
    module.exports = Quad;
  }
});

// node_modules/potrace/lib/types/Sum.js
var require_Sum = __commonJS({
  "node_modules/potrace/lib/types/Sum.js"(exports, module) {
    "use strict";
    function Sum(x, y, xy, x2, y2) {
      this.x = x;
      this.y = y;
      this.xy = xy;
      this.x2 = x2;
      this.y2 = y2;
    }
    module.exports = Sum;
  }
});

// node_modules/potrace/lib/types/Opti.js
var require_Opti = __commonJS({
  "node_modules/potrace/lib/types/Opti.js"(exports, module) {
    "use strict";
    var Point = require_Point();
    function Opti() {
      this.pen = 0;
      this.c = [new Point(), new Point()];
      this.t = 0;
      this.s = 0;
      this.alpha = 0;
    }
    module.exports = Opti;
  }
});

// node_modules/potrace/lib/Potrace.js
var require_Potrace = __commonJS({
  "node_modules/potrace/lib/Potrace.js"(exports, module) {
    "use strict";
    var Jimp = require_jimp_stub();
    var Bitmap2 = require_Bitmap();
    var Curve = require_Curve();
    var Point = require_Point();
    var Path = require_Path();
    var Quad = require_Quad();
    var Sum = require_Sum();
    var Opti = require_Opti();
    var utils2 = require_utils();
    function Potrace2(options) {
      this._luminanceData = null;
      this._pathlist = [];
      this._imageLoadingIdentifier = null;
      this._imageLoaded = false;
      this._processed = false;
      this._params = {
        turnPolicy: Potrace2.TURNPOLICY_MINORITY,
        turdSize: 2,
        alphaMax: 1,
        optCurve: true,
        optTolerance: 0.2,
        threshold: Potrace2.THRESHOLD_AUTO,
        blackOnWhite: true,
        color: Potrace2.COLOR_AUTO,
        background: Potrace2.COLOR_TRANSPARENT,
        width: null,
        height: null
      };
      if (options) {
        this.setParameters(options);
      }
    }
    Potrace2.COLOR_AUTO = "auto";
    Potrace2.COLOR_TRANSPARENT = "transparent";
    Potrace2.THRESHOLD_AUTO = -1;
    Potrace2.TURNPOLICY_BLACK = "black";
    Potrace2.TURNPOLICY_WHITE = "white";
    Potrace2.TURNPOLICY_LEFT = "left";
    Potrace2.TURNPOLICY_RIGHT = "right";
    Potrace2.TURNPOLICY_MINORITY = "minority";
    Potrace2.TURNPOLICY_MAJORITY = "majority";
    var SUPPORTED_TURNPOLICY_VALUES = [
      Potrace2.TURNPOLICY_BLACK,
      Potrace2.TURNPOLICY_WHITE,
      Potrace2.TURNPOLICY_LEFT,
      Potrace2.TURNPOLICY_RIGHT,
      Potrace2.TURNPOLICY_MINORITY,
      Potrace2.TURNPOLICY_MAJORITY
    ];
    Potrace2.prototype = {
      /**
       * Creating a new {@link Path} for every group of black pixels.
       * @private
       */
      _bmToPathlist: function() {
        var self = this, threshold = this._params.threshold, blackOnWhite = this._params.blackOnWhite, blackMap, currentPoint = new Point(0, 0), path;
        if (threshold === Potrace2.THRESHOLD_AUTO) {
          threshold = this._luminanceData.histogram().autoThreshold() || 128;
        }
        blackMap = this._luminanceData.copy(function(lum) {
          var pastTheThreshold = blackOnWhite ? lum > threshold : lum < threshold;
          return pastTheThreshold ? 0 : 1;
        });
        function findNext(point) {
          var i = blackMap.pointToIndex(point);
          while (i < blackMap.size && blackMap.data[i] !== 1) {
            i++;
          }
          return i < blackMap.size && blackMap.indexToPoint(i);
        }
        function majority(x, y) {
          var i, a, ct;
          for (i = 2; i < 5; i++) {
            ct = 0;
            for (a = -i + 1; a <= i - 1; a++) {
              ct += blackMap.getValueAt(x + a, y + i - 1) ? 1 : -1;
              ct += blackMap.getValueAt(x + i - 1, y + a - 1) ? 1 : -1;
              ct += blackMap.getValueAt(x + a - 1, y - i) ? 1 : -1;
              ct += blackMap.getValueAt(x - i, y + a) ? 1 : -1;
            }
            if (ct > 0) {
              return 1;
            } else if (ct < 0) {
              return 0;
            }
          }
          return 0;
        }
        function findPath(point) {
          var path2 = new Path(), x = point.x, y = point.y, dirx = 0, diry = 1, tmp;
          path2.sign = blackMap.getValueAt(point.x, point.y) ? "+" : "-";
          while (1) {
            path2.pt.push(new Point(x, y));
            if (x > path2.maxX)
              path2.maxX = x;
            if (x < path2.minX)
              path2.minX = x;
            if (y > path2.maxY)
              path2.maxY = y;
            if (y < path2.minY)
              path2.minY = y;
            path2.len++;
            x += dirx;
            y += diry;
            path2.area -= x * diry;
            if (x === point.x && y === point.y)
              break;
            var l = blackMap.getValueAt(x + (dirx + diry - 1) / 2, y + (diry - dirx - 1) / 2);
            var r = blackMap.getValueAt(x + (dirx - diry - 1) / 2, y + (diry + dirx - 1) / 2);
            if (r && !l) {
              if (self._params.turnPolicy === "right" || self._params.turnPolicy === "black" && path2.sign === "+" || self._params.turnPolicy === "white" && path2.sign === "-" || self._params.turnPolicy === "majority" && majority(x, y) || self._params.turnPolicy === "minority" && !majority(x, y)) {
                tmp = dirx;
                dirx = -diry;
                diry = tmp;
              } else {
                tmp = dirx;
                dirx = diry;
                diry = -tmp;
              }
            } else if (r) {
              tmp = dirx;
              dirx = -diry;
              diry = tmp;
            } else if (!l) {
              tmp = dirx;
              dirx = diry;
              diry = -tmp;
            }
          }
          return path2;
        }
        function xorPath(path2) {
          var y1 = path2.pt[0].y, len = path2.len, x, y, maxX, minY, i, j, indx;
          for (i = 1; i < len; i++) {
            x = path2.pt[i].x;
            y = path2.pt[i].y;
            if (y !== y1) {
              minY = y1 < y ? y1 : y;
              maxX = path2.maxX;
              for (j = x; j < maxX; j++) {
                indx = blackMap.pointToIndex(j, minY);
                blackMap.data[indx] = blackMap.data[indx] ? 0 : 1;
              }
              y1 = y;
            }
          }
        }
        this._pathlist = [];
        while (currentPoint = findNext(currentPoint)) {
          path = findPath(currentPoint);
          xorPath(path);
          if (path.area > self._params.turdSize) {
            this._pathlist.push(path);
          }
        }
      },
      /**
       * Processes path list created by _bmToPathlist method creating and optimizing {@link Curve}'s
       * @private
       */
      _processPath: function() {
        var self = this;
        function calcSums(path2) {
          var i2, x, y;
          path2.x0 = path2.pt[0].x;
          path2.y0 = path2.pt[0].y;
          path2.sums = [];
          var s = path2.sums;
          s.push(new Sum(0, 0, 0, 0, 0));
          for (i2 = 0; i2 < path2.len; i2++) {
            x = path2.pt[i2].x - path2.x0;
            y = path2.pt[i2].y - path2.y0;
            s.push(new Sum(
              s[i2].x + x,
              s[i2].y + y,
              s[i2].xy + x * y,
              s[i2].x2 + x * x,
              s[i2].y2 + y * y
            ));
          }
        }
        function calcLon(path2) {
          var n = path2.len, pt = path2.pt, dir, pivk = new Array(n), nc = new Array(n), ct = new Array(4);
          path2.lon = new Array(n);
          var constraint = [new Point(), new Point()], cur = new Point(), off = new Point(), dk = new Point(), foundk;
          var i2, j, k1, a, b, c, d, k = 0;
          for (i2 = n - 1; i2 >= 0; i2--) {
            if (pt[i2].x != pt[k].x && pt[i2].y != pt[k].y) {
              k = i2 + 1;
            }
            nc[i2] = k;
          }
          for (i2 = n - 1; i2 >= 0; i2--) {
            ct[0] = ct[1] = ct[2] = ct[3] = 0;
            dir = (3 + 3 * (pt[utils2.mod(i2 + 1, n)].x - pt[i2].x) + (pt[utils2.mod(i2 + 1, n)].y - pt[i2].y)) / 2;
            ct[dir]++;
            constraint[0].x = 0;
            constraint[0].y = 0;
            constraint[1].x = 0;
            constraint[1].y = 0;
            k = nc[i2];
            k1 = i2;
            while (1) {
              foundk = 0;
              dir = (3 + 3 * utils2.sign(pt[k].x - pt[k1].x) + utils2.sign(pt[k].y - pt[k1].y)) / 2;
              ct[dir]++;
              if (ct[0] && ct[1] && ct[2] && ct[3]) {
                pivk[i2] = k1;
                foundk = 1;
                break;
              }
              cur.x = pt[k].x - pt[i2].x;
              cur.y = pt[k].y - pt[i2].y;
              if (utils2.xprod(constraint[0], cur) < 0 || utils2.xprod(constraint[1], cur) > 0) {
                break;
              }
              if (Math.abs(cur.x) <= 1 && Math.abs(cur.y) <= 1) {
              } else {
                off.x = cur.x + (cur.y >= 0 && (cur.y > 0 || cur.x < 0) ? 1 : -1);
                off.y = cur.y + (cur.x <= 0 && (cur.x < 0 || cur.y < 0) ? 1 : -1);
                if (utils2.xprod(constraint[0], off) >= 0) {
                  constraint[0].x = off.x;
                  constraint[0].y = off.y;
                }
                off.x = cur.x + (cur.y <= 0 && (cur.y < 0 || cur.x < 0) ? 1 : -1);
                off.y = cur.y + (cur.x >= 0 && (cur.x > 0 || cur.y < 0) ? 1 : -1);
                if (utils2.xprod(constraint[1], off) <= 0) {
                  constraint[1].x = off.x;
                  constraint[1].y = off.y;
                }
              }
              k1 = k;
              k = nc[k1];
              if (!utils2.cyclic(k, i2, k1)) {
                break;
              }
            }
            if (foundk === 0) {
              dk.x = utils2.sign(pt[k].x - pt[k1].x);
              dk.y = utils2.sign(pt[k].y - pt[k1].y);
              cur.x = pt[k1].x - pt[i2].x;
              cur.y = pt[k1].y - pt[i2].y;
              a = utils2.xprod(constraint[0], cur);
              b = utils2.xprod(constraint[0], dk);
              c = utils2.xprod(constraint[1], cur);
              d = utils2.xprod(constraint[1], dk);
              j = 1e7;
              if (b < 0) {
                j = Math.floor(a / -b);
              }
              if (d > 0) {
                j = Math.min(j, Math.floor(-c / d));
              }
              pivk[i2] = utils2.mod(k1 + j, n);
            }
          }
          j = pivk[n - 1];
          path2.lon[n - 1] = j;
          for (i2 = n - 2; i2 >= 0; i2--) {
            if (utils2.cyclic(i2 + 1, pivk[i2], j)) {
              j = pivk[i2];
            }
            path2.lon[i2] = j;
          }
          for (i2 = n - 1; utils2.cyclic(utils2.mod(i2 + 1, n), j, path2.lon[i2]); i2--) {
            path2.lon[i2] = j;
          }
        }
        function bestPolygon(path2) {
          function penalty3(path3, i3, j2) {
            var n2 = path3.len, pt = path3.pt, sums = path3.sums;
            var x, y, xy, x2, y2, k2, a, b, c2, s, px, py, ex, ey, r = 0;
            if (j2 >= n2) {
              j2 -= n2;
              r = 1;
            }
            if (r === 0) {
              x = sums[j2 + 1].x - sums[i3].x;
              y = sums[j2 + 1].y - sums[i3].y;
              x2 = sums[j2 + 1].x2 - sums[i3].x2;
              xy = sums[j2 + 1].xy - sums[i3].xy;
              y2 = sums[j2 + 1].y2 - sums[i3].y2;
              k2 = j2 + 1 - i3;
            } else {
              x = sums[j2 + 1].x - sums[i3].x + sums[n2].x;
              y = sums[j2 + 1].y - sums[i3].y + sums[n2].y;
              x2 = sums[j2 + 1].x2 - sums[i3].x2 + sums[n2].x2;
              xy = sums[j2 + 1].xy - sums[i3].xy + sums[n2].xy;
              y2 = sums[j2 + 1].y2 - sums[i3].y2 + sums[n2].y2;
              k2 = j2 + 1 - i3 + n2;
            }
            px = (pt[i3].x + pt[j2].x) / 2 - pt[0].x;
            py = (pt[i3].y + pt[j2].y) / 2 - pt[0].y;
            ey = pt[j2].x - pt[i3].x;
            ex = -(pt[j2].y - pt[i3].y);
            a = (x2 - 2 * x * px) / k2 + px * px;
            b = (xy - x * py - y * px) / k2 + px * py;
            c2 = (y2 - 2 * y * py) / k2 + py * py;
            s = ex * ex * a + 2 * ex * ey * b + ey * ey * c2;
            return Math.sqrt(s);
          }
          var i2, j, m, k, n = path2.len, pen = new Array(n + 1), prev = new Array(n + 1), clip0 = new Array(n), clip1 = new Array(n + 1), seg0 = new Array(n + 1), seg1 = new Array(n + 1), thispen, best, c;
          for (i2 = 0; i2 < n; i2++) {
            c = utils2.mod(path2.lon[utils2.mod(i2 - 1, n)] - 1, n);
            if (c == i2) {
              c = utils2.mod(i2 + 1, n);
            }
            if (c < i2) {
              clip0[i2] = n;
            } else {
              clip0[i2] = c;
            }
          }
          j = 1;
          for (i2 = 0; i2 < n; i2++) {
            while (j <= clip0[i2]) {
              clip1[j] = i2;
              j++;
            }
          }
          i2 = 0;
          for (j = 0; i2 < n; j++) {
            seg0[j] = i2;
            i2 = clip0[i2];
          }
          seg0[j] = n;
          m = j;
          i2 = n;
          for (j = m; j > 0; j--) {
            seg1[j] = i2;
            i2 = clip1[i2];
          }
          seg1[0] = 0;
          pen[0] = 0;
          for (j = 1; j <= m; j++) {
            for (i2 = seg1[j]; i2 <= seg0[j]; i2++) {
              best = -1;
              for (k = seg0[j - 1]; k >= clip1[i2]; k--) {
                thispen = penalty3(path2, k, i2) + pen[k];
                if (best < 0 || thispen < best) {
                  prev[i2] = k;
                  best = thispen;
                }
              }
              pen[i2] = best;
            }
          }
          path2.m = m;
          path2.po = new Array(m);
          for (i2 = n, j = m - 1; i2 > 0; j--) {
            i2 = prev[i2];
            path2.po[j] = i2;
          }
        }
        function adjustVertices(path2) {
          function pointslope(path3, i3, j2, ctr2, dir2) {
            var n2 = path3.len, sums = path3.sums, x, y, x2, xy, y2, k2, a, b, c, lambda2, l2, r = 0;
            while (j2 >= n2) {
              j2 -= n2;
              r += 1;
            }
            while (i3 >= n2) {
              i3 -= n2;
              r -= 1;
            }
            while (j2 < 0) {
              j2 += n2;
              r -= 1;
            }
            while (i3 < 0) {
              i3 += n2;
              r += 1;
            }
            x = sums[j2 + 1].x - sums[i3].x + r * sums[n2].x;
            y = sums[j2 + 1].y - sums[i3].y + r * sums[n2].y;
            x2 = sums[j2 + 1].x2 - sums[i3].x2 + r * sums[n2].x2;
            xy = sums[j2 + 1].xy - sums[i3].xy + r * sums[n2].xy;
            y2 = sums[j2 + 1].y2 - sums[i3].y2 + r * sums[n2].y2;
            k2 = j2 + 1 - i3 + r * n2;
            ctr2.x = x / k2;
            ctr2.y = y / k2;
            a = (x2 - x * x / k2) / k2;
            b = (xy - x * y / k2) / k2;
            c = (y2 - y * y / k2) / k2;
            lambda2 = (a + c + Math.sqrt((a - c) * (a - c) + 4 * b * b)) / 2;
            a -= lambda2;
            c -= lambda2;
            if (Math.abs(a) >= Math.abs(c)) {
              l2 = Math.sqrt(a * a + b * b);
              if (l2 !== 0) {
                dir2.x = -b / l2;
                dir2.y = a / l2;
              }
            } else {
              l2 = Math.sqrt(c * c + b * b);
              if (l2 !== 0) {
                dir2.x = -c / l2;
                dir2.y = b / l2;
              }
            }
            if (l2 === 0) {
              dir2.x = dir2.y = 0;
            }
          }
          var m = path2.m, po = path2.po, n = path2.len, pt = path2.pt, x0 = path2.x0, y0 = path2.y0, ctr = new Array(m), dir = new Array(m), q = new Array(m), v = new Array(3), d, i2, j, k, l, s = new Point();
          path2.curve = new Curve(m);
          for (i2 = 0; i2 < m; i2++) {
            j = po[utils2.mod(i2 + 1, m)];
            j = utils2.mod(j - po[i2], n) + po[i2];
            ctr[i2] = new Point();
            dir[i2] = new Point();
            pointslope(path2, po[i2], j, ctr[i2], dir[i2]);
          }
          for (i2 = 0; i2 < m; i2++) {
            q[i2] = new Quad();
            d = dir[i2].x * dir[i2].x + dir[i2].y * dir[i2].y;
            if (d === 0) {
              for (j = 0; j < 3; j++) {
                for (k = 0; k < 3; k++) {
                  q[i2].data[j * 3 + k] = 0;
                }
              }
            } else {
              v[0] = dir[i2].y;
              v[1] = -dir[i2].x;
              v[2] = -v[1] * ctr[i2].y - v[0] * ctr[i2].x;
              for (l = 0; l < 3; l++) {
                for (k = 0; k < 3; k++) {
                  q[i2].data[l * 3 + k] = v[l] * v[k] / d;
                }
              }
            }
          }
          var Q, w, dx, dy, det, min, cand, xmin, ymin, z;
          for (i2 = 0; i2 < m; i2++) {
            Q = new Quad();
            w = new Point();
            s.x = pt[po[i2]].x - x0;
            s.y = pt[po[i2]].y - y0;
            j = utils2.mod(i2 - 1, m);
            for (l = 0; l < 3; l++) {
              for (k = 0; k < 3; k++) {
                Q.data[l * 3 + k] = q[j].at(l, k) + q[i2].at(l, k);
              }
            }
            while (1) {
              det = Q.at(0, 0) * Q.at(1, 1) - Q.at(0, 1) * Q.at(1, 0);
              if (det !== 0) {
                w.x = (-Q.at(0, 2) * Q.at(1, 1) + Q.at(1, 2) * Q.at(0, 1)) / det;
                w.y = (Q.at(0, 2) * Q.at(1, 0) - Q.at(1, 2) * Q.at(0, 0)) / det;
                break;
              }
              if (Q.at(0, 0) > Q.at(1, 1)) {
                v[0] = -Q.at(0, 1);
                v[1] = Q.at(0, 0);
              } else if (Q.at(1, 1)) {
                v[0] = -Q.at(1, 1);
                v[1] = Q.at(1, 0);
              } else {
                v[0] = 1;
                v[1] = 0;
              }
              d = v[0] * v[0] + v[1] * v[1];
              v[2] = -v[1] * s.y - v[0] * s.x;
              for (l = 0; l < 3; l++) {
                for (k = 0; k < 3; k++) {
                  Q.data[l * 3 + k] += v[l] * v[k] / d;
                }
              }
            }
            dx = Math.abs(w.x - s.x);
            dy = Math.abs(w.y - s.y);
            if (dx <= 0.5 && dy <= 0.5) {
              path2.curve.vertex[i2] = new Point(w.x + x0, w.y + y0);
              continue;
            }
            min = utils2.quadform(Q, s);
            xmin = s.x;
            ymin = s.y;
            if (Q.at(0, 0) !== 0) {
              for (z = 0; z < 2; z++) {
                w.y = s.y - 0.5 + z;
                w.x = -(Q.at(0, 1) * w.y + Q.at(0, 2)) / Q.at(0, 0);
                dx = Math.abs(w.x - s.x);
                cand = utils2.quadform(Q, w);
                if (dx <= 0.5 && cand < min) {
                  min = cand;
                  xmin = w.x;
                  ymin = w.y;
                }
              }
            }
            if (Q.at(1, 1) !== 0) {
              for (z = 0; z < 2; z++) {
                w.x = s.x - 0.5 + z;
                w.y = -(Q.at(1, 0) * w.x + Q.at(1, 2)) / Q.at(1, 1);
                dy = Math.abs(w.y - s.y);
                cand = utils2.quadform(Q, w);
                if (dy <= 0.5 && cand < min) {
                  min = cand;
                  xmin = w.x;
                  ymin = w.y;
                }
              }
            }
            for (l = 0; l < 2; l++) {
              for (k = 0; k < 2; k++) {
                w.x = s.x - 0.5 + l;
                w.y = s.y - 0.5 + k;
                cand = utils2.quadform(Q, w);
                if (cand < min) {
                  min = cand;
                  xmin = w.x;
                  ymin = w.y;
                }
              }
            }
            path2.curve.vertex[i2] = new Point(xmin + x0, ymin + y0);
          }
        }
        function reverse(path2) {
          var curve = path2.curve, m = curve.n, v = curve.vertex, i2, j, tmp;
          for (i2 = 0, j = m - 1; i2 < j; i2++, j--) {
            tmp = v[i2];
            v[i2] = v[j];
            v[j] = tmp;
          }
        }
        function smooth(path2) {
          var m = path2.curve.n, curve = path2.curve;
          var i2, j, k, dd, denom, alpha, p2, p3, p4;
          for (i2 = 0; i2 < m; i2++) {
            j = utils2.mod(i2 + 1, m);
            k = utils2.mod(i2 + 2, m);
            p4 = utils2.interval(1 / 2, curve.vertex[k], curve.vertex[j]);
            denom = utils2.ddenom(curve.vertex[i2], curve.vertex[k]);
            if (denom !== 0) {
              dd = utils2.dpara(curve.vertex[i2], curve.vertex[j], curve.vertex[k]) / denom;
              dd = Math.abs(dd);
              alpha = dd > 1 ? 1 - 1 / dd : 0;
              alpha = alpha / 0.75;
            } else {
              alpha = 4 / 3;
            }
            curve.alpha0[j] = alpha;
            if (alpha >= self._params.alphaMax) {
              curve.tag[j] = "CORNER";
              curve.c[3 * j + 1] = curve.vertex[j];
              curve.c[3 * j + 2] = p4;
            } else {
              if (alpha < 0.55) {
                alpha = 0.55;
              } else if (alpha > 1) {
                alpha = 1;
              }
              p2 = utils2.interval(0.5 + 0.5 * alpha, curve.vertex[i2], curve.vertex[j]);
              p3 = utils2.interval(0.5 + 0.5 * alpha, curve.vertex[k], curve.vertex[j]);
              curve.tag[j] = "CURVE";
              curve.c[3 * j + 0] = p2;
              curve.c[3 * j + 1] = p3;
              curve.c[3 * j + 2] = p4;
            }
            curve.alpha[j] = alpha;
            curve.beta[j] = 0.5;
          }
          curve.alphaCurve = 1;
        }
        function optiCurve(path2) {
          function opti_penalty(path3, i3, j2, res, opttolerance, convc2, areac2) {
            var m2 = path3.curve.n, curve2 = path3.curve, vertex = curve2.vertex, k, k1, k2, conv, i12, area2, alpha2, d, d1, d2, p02, p1, p2, p3, pt2, A, R, A1, A2, A3, A4, s2, t2;
            if (i3 == j2) {
              return 1;
            }
            k = i3;
            i12 = utils2.mod(i3 + 1, m2);
            k1 = utils2.mod(k + 1, m2);
            conv = convc2[k1];
            if (conv === 0) {
              return 1;
            }
            d = utils2.ddist(vertex[i3], vertex[i12]);
            for (k = k1; k != j2; k = k1) {
              k1 = utils2.mod(k + 1, m2);
              k2 = utils2.mod(k + 2, m2);
              if (convc2[k1] != conv) {
                return 1;
              }
              if (utils2.sign(utils2.cprod(vertex[i3], vertex[i12], vertex[k1], vertex[k2])) != conv) {
                return 1;
              }
              if (utils2.iprod1(vertex[i3], vertex[i12], vertex[k1], vertex[k2]) < d * utils2.ddist(vertex[k1], vertex[k2]) * -0.999847695156) {
                return 1;
              }
            }
            p02 = curve2.c[utils2.mod(i3, m2) * 3 + 2].copy();
            p1 = vertex[utils2.mod(i3 + 1, m2)].copy();
            p2 = vertex[utils2.mod(j2, m2)].copy();
            p3 = curve2.c[utils2.mod(j2, m2) * 3 + 2].copy();
            area2 = areac2[j2] - areac2[i3];
            area2 -= utils2.dpara(vertex[0], curve2.c[i3 * 3 + 2], curve2.c[j2 * 3 + 2]) / 2;
            if (i3 >= j2) {
              area2 += areac2[m2];
            }
            A1 = utils2.dpara(p02, p1, p2);
            A2 = utils2.dpara(p02, p1, p3);
            A3 = utils2.dpara(p02, p2, p3);
            A4 = A1 + A3 - A2;
            if (A2 == A1) {
              return 1;
            }
            t2 = A3 / (A3 - A4);
            s2 = A2 / (A2 - A1);
            A = A2 * t2 / 2;
            if (A === 0) {
              return 1;
            }
            R = area2 / A;
            alpha2 = 2 - Math.sqrt(4 - R / 0.3);
            res.c[0] = utils2.interval(t2 * alpha2, p02, p1);
            res.c[1] = utils2.interval(s2 * alpha2, p3, p2);
            res.alpha = alpha2;
            res.t = t2;
            res.s = s2;
            p1 = res.c[0].copy();
            p2 = res.c[1].copy();
            res.pen = 0;
            for (k = utils2.mod(i3 + 1, m2); k != j2; k = k1) {
              k1 = utils2.mod(k + 1, m2);
              t2 = utils2.tangent(p02, p1, p2, p3, vertex[k], vertex[k1]);
              if (t2 < -0.5) {
                return 1;
              }
              pt2 = utils2.bezier(t2, p02, p1, p2, p3);
              d = utils2.ddist(vertex[k], vertex[k1]);
              if (d === 0) {
                return 1;
              }
              d1 = utils2.dpara(vertex[k], vertex[k1], pt2) / d;
              if (Math.abs(d1) > opttolerance) {
                return 1;
              }
              if (utils2.iprod(vertex[k], vertex[k1], pt2) < 0 || utils2.iprod(vertex[k1], vertex[k], pt2) < 0) {
                return 1;
              }
              res.pen += d1 * d1;
            }
            for (k = i3; k != j2; k = k1) {
              k1 = utils2.mod(k + 1, m2);
              t2 = utils2.tangent(p02, p1, p2, p3, curve2.c[k * 3 + 2], curve2.c[k1 * 3 + 2]);
              if (t2 < -0.5) {
                return 1;
              }
              pt2 = utils2.bezier(t2, p02, p1, p2, p3);
              d = utils2.ddist(curve2.c[k * 3 + 2], curve2.c[k1 * 3 + 2]);
              if (d === 0) {
                return 1;
              }
              d1 = utils2.dpara(curve2.c[k * 3 + 2], curve2.c[k1 * 3 + 2], pt2) / d;
              d2 = utils2.dpara(curve2.c[k * 3 + 2], curve2.c[k1 * 3 + 2], vertex[k1]) / d;
              d2 *= 0.75 * curve2.alpha[k1];
              if (d2 < 0) {
                d1 = -d1;
                d2 = -d2;
              }
              if (d1 < d2 - opttolerance) {
                return 1;
              }
              if (d1 < d2) {
                res.pen += (d1 - d2) * (d1 - d2);
              }
            }
            return 0;
          }
          var curve = path2.curve, m = curve.n, vert = curve.vertex, pt = new Array(m + 1), pen = new Array(m + 1), len = new Array(m + 1), opt = new Array(m + 1), om, i2, j, r, o = new Opti(), p0, i1, area, alpha, ocurve, s, t;
          var convc = new Array(m), areac = new Array(m + 1);
          for (i2 = 0; i2 < m; i2++) {
            if (curve.tag[i2] == "CURVE") {
              convc[i2] = utils2.sign(utils2.dpara(vert[utils2.mod(i2 - 1, m)], vert[i2], vert[utils2.mod(i2 + 1, m)]));
            } else {
              convc[i2] = 0;
            }
          }
          area = 0;
          areac[0] = 0;
          p0 = curve.vertex[0];
          for (i2 = 0; i2 < m; i2++) {
            i1 = utils2.mod(i2 + 1, m);
            if (curve.tag[i1] == "CURVE") {
              alpha = curve.alpha[i1];
              area += 0.3 * alpha * (4 - alpha) * utils2.dpara(curve.c[i2 * 3 + 2], vert[i1], curve.c[i1 * 3 + 2]) / 2;
              area += utils2.dpara(p0, curve.c[i2 * 3 + 2], curve.c[i1 * 3 + 2]) / 2;
            }
            areac[i2 + 1] = area;
          }
          pt[0] = -1;
          pen[0] = 0;
          len[0] = 0;
          for (j = 1; j <= m; j++) {
            pt[j] = j - 1;
            pen[j] = pen[j - 1];
            len[j] = len[j - 1] + 1;
            for (i2 = j - 2; i2 >= 0; i2--) {
              r = opti_penalty(
                path2,
                i2,
                utils2.mod(j, m),
                o,
                self._params.optTolerance,
                convc,
                areac
              );
              if (r) {
                break;
              }
              if (len[j] > len[i2] + 1 || len[j] == len[i2] + 1 && pen[j] > pen[i2] + o.pen) {
                pt[j] = i2;
                pen[j] = pen[i2] + o.pen;
                len[j] = len[i2] + 1;
                opt[j] = o;
                o = new Opti();
              }
            }
          }
          om = len[m];
          ocurve = new Curve(om);
          s = new Array(om);
          t = new Array(om);
          j = m;
          for (i2 = om - 1; i2 >= 0; i2--) {
            if (pt[j] == j - 1) {
              ocurve.tag[i2] = curve.tag[utils2.mod(j, m)];
              ocurve.c[i2 * 3 + 0] = curve.c[utils2.mod(j, m) * 3 + 0];
              ocurve.c[i2 * 3 + 1] = curve.c[utils2.mod(j, m) * 3 + 1];
              ocurve.c[i2 * 3 + 2] = curve.c[utils2.mod(j, m) * 3 + 2];
              ocurve.vertex[i2] = curve.vertex[utils2.mod(j, m)];
              ocurve.alpha[i2] = curve.alpha[utils2.mod(j, m)];
              ocurve.alpha0[i2] = curve.alpha0[utils2.mod(j, m)];
              ocurve.beta[i2] = curve.beta[utils2.mod(j, m)];
              s[i2] = t[i2] = 1;
            } else {
              ocurve.tag[i2] = "CURVE";
              ocurve.c[i2 * 3 + 0] = opt[j].c[0];
              ocurve.c[i2 * 3 + 1] = opt[j].c[1];
              ocurve.c[i2 * 3 + 2] = curve.c[utils2.mod(j, m) * 3 + 2];
              ocurve.vertex[i2] = utils2.interval(
                opt[j].s,
                curve.c[utils2.mod(j, m) * 3 + 2],
                vert[utils2.mod(j, m)]
              );
              ocurve.alpha[i2] = opt[j].alpha;
              ocurve.alpha0[i2] = opt[j].alpha;
              s[i2] = opt[j].s;
              t[i2] = opt[j].t;
            }
            j = pt[j];
          }
          for (i2 = 0; i2 < om; i2++) {
            i1 = utils2.mod(i2 + 1, om);
            ocurve.beta[i2] = s[i2] / (s[i2] + t[i1]);
          }
          ocurve.alphaCurve = 1;
          path2.curve = ocurve;
        }
        for (var i = 0; i < this._pathlist.length; i++) {
          var path = this._pathlist[i];
          calcSums(path);
          calcLon(path);
          bestPolygon(path);
          adjustVertices(path);
          if (path.sign === "-") {
            reverse(path);
          }
          smooth(path);
          if (self._params.optCurve) {
            optiCurve(path);
          }
        }
      },
      /**
       * Validates some of parameters
       * @param params
       * @private
       */
      _validateParameters: function(params) {
        if (params && params.turnPolicy && SUPPORTED_TURNPOLICY_VALUES.indexOf(params.turnPolicy) === -1) {
          var goodVals = "'" + SUPPORTED_TURNPOLICY_VALUES.join("', '") + "'";
          throw new Error("Bad turnPolicy value. Allowed values are: " + goodVals);
        }
        if (params && params.threshold != null && params.threshold !== Potrace2.THRESHOLD_AUTO) {
          if (typeof params.threshold !== "number" || !utils2.between(params.threshold, 0, 255)) {
            throw new Error("Bad threshold value. Expected to be an integer in range 0..255");
          }
        }
        if (params && params.optCurve != null && typeof params.optCurve !== "boolean") {
          throw new Error("'optCurve' must be Boolean");
        }
      },
      _processLoadedImage: function(image) {
        var bitmap = new Bitmap2(image.bitmap.width, image.bitmap.height);
        var pixels = image.bitmap.data;
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
          var opacity = pixels[idx + 3] / 255, r = 255 + (pixels[idx + 0] - 255) * opacity, g = 255 + (pixels[idx + 1] - 255) * opacity, b = 255 + (pixels[idx + 2] - 255) * opacity;
          bitmap.data[idx / 4] = utils2.luminance(r, g, b);
        });
        this._luminanceData = bitmap;
        this._imageLoaded = true;
      },
      /**
       * Reads given image. Uses {@link Jimp} under the hood, so target can be whatever Jimp can take
       *
       * @param {string|Buffer|Jimp} target Image source. Could be anything that {@link Jimp} can read (buffer, local path or url). Supported formats are: PNG, JPEG or BMP
       * @param {Function} callback
       */
      loadImage: function(target, callback) {
        var self = this;
        var jobId = {};
        this._imageLoadingIdentifier = jobId;
        this._imageLoaded = false;
        if (target instanceof Jimp) {
          this._imageLoadingIdentifier = null;
          this._imageLoaded = true;
          self._processLoadedImage(target);
          callback.call(self, null);
        } else {
          Jimp.read(target, function(err, img) {
            var sourceChanged = self._imageLoadingIdentifier !== jobId;
            if (sourceChanged) {
              var error = err ? err : new Error("Another image was loaded instead");
              return callback.call(self, error);
            }
            self._imageLoadingIdentifier = null;
            self._processLoadedImage(img);
            callback.call(self, null);
          });
        }
      },
      /**
       * Sets algorithm parameters
       * @param {Potrace~Options} newParams
       */
      setParameters: function(newParams) {
        var key, tmpOldVal;
        this._validateParameters(newParams);
        for (key in this._params) {
          if (this._params.hasOwnProperty(key) && newParams.hasOwnProperty(key)) {
            tmpOldVal = this._params[key];
            this._params[key] = newParams[key];
            if (tmpOldVal !== this._params[key] && ["color", "background"].indexOf(key) === -1) {
              this._processed = false;
            }
          }
        }
      },
      /**
       * Generates just <path> tag without rest of the SVG file
       *
       * @param {String} [fillColor] - overrides color from parameters
       * @returns {String}
       */
      getPathTag: function(fillColor, scale) {
        fillColor = arguments.length === 0 ? this._params.color : fillColor;
        if (fillColor === Potrace2.COLOR_AUTO) {
          fillColor = this._params.blackOnWhite ? "black" : "white";
        }
        if (!this._imageLoaded) {
          throw new Error("Image should be loaded first");
        }
        if (!this._processed) {
          this._bmToPathlist();
          this._processPath();
          this._processed = true;
        }
        var tag = '<path d="';
        tag += this._pathlist.map(function(path) {
          return utils2.renderCurve(path.curve, scale);
        }).join(" ");
        tag += '" stroke="none" fill="' + fillColor + '" fill-rule="evenodd"/>';
        return tag;
      },
      /**
       * Returns <symbol> tag. Always has viewBox specified and comes with no fill color,
       * so it could be changed with <use> tag
       *
       * @param id
       * @returns {string}
       */
      getSymbol: function(id) {
        return '<symbol viewBox="0 0 ' + this._luminanceData.width + " " + this._luminanceData.height + '" id="' + id + '">' + this.getPathTag("") + "</symbol>";
      },
      /**
       * Generates SVG image
       * @returns {String}
       */
      getSVG: function() {
        var width = this._params.width || this._luminanceData.width;
        var height = this._params.height || this._luminanceData.height;
        var scale = {
          x: this._params.width ? this._params.width / this._luminanceData.width : 1,
          y: this._params.height ? this._params.height / this._luminanceData.height : 1
        };
        return '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + " " + height + '" version="1.1">\n' + (this._params.background !== Potrace2.COLOR_TRANSPARENT ? '	<rect x="0" y="0" width="100%" height="100%" fill="' + this._params.background + '" />\n' : "") + "	" + this.getPathTag(this._params.color, scale) + "\n</svg>";
      }
    };
    module.exports = Potrace2;
  }
});

// ../../.gemini/antigravity-ide/brain/707012b4-7cd2-44d9-a41a-2adb7ae1ed50/scratch/potrace_entry.js
var Bitmap = require_Bitmap();
var Potrace = require_Potrace();
var utils = require_utils();
function traceMaskToPathD(mask, width, height, options = {}) {
  const potrace = new Potrace({
    optCurve: options.optCurve !== void 0 ? options.optCurve : true,
    alphaMax: options.alphaMax !== void 0 ? options.alphaMax : 1.0,
    turdSize: options.turdSize !== void 0 ? options.turdSize : 18,
    optTolerance: options.optTolerance !== void 0 ? options.optTolerance : 0.22,
    turnPolicy: options.turnPolicy || Potrace.TURNPOLICY_MINORITY
  });
  const bitmap = new Bitmap(width, height);
  for (let i = 0; i < mask.length; i++) {
    bitmap.data[i] = mask[i] ? 0 : 255;
  }
  potrace._luminanceData = bitmap;
  potrace._imageLoaded = true;
  potrace._params.threshold = 128;
  potrace._params.blackOnWhite = true;
  potrace._bmToPathlist();
  potrace._processPath();
  potrace._processed = true;
  const scale = { x: 1, y: 1 };
  const d = potrace._pathlist.map((p) => utils.renderCurve(p.curve, scale)).join(" ");
  return d;
}
export {
  Potrace,
  traceMaskToPathD
};
