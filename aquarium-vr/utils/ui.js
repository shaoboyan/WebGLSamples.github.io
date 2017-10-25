/*
Copyright (c) 2016, Brandon Jones.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/*
Heavily inspired by Mr. Doobs stats.js, this FPS counter is rendered completely
with WebGL, allowing it to be shown in cases where overlaid HTML elements aren't
usable (like WebVR), or if you want the FPS counter to be rendered as part of
your scene.

See stats-test.html for basic usage.
*/
var Ui = (function() {

  "use strict";

  //-------------------
  // Utility functions
  //-------------------

  function linkProgram(gl, vertexSource, fragmentSource, attribLocationMap) {
    // No error checking for brevity.
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexSource);
    gl.compileShader(vertexShader);

    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentSource);
    gl.compileShader(fragmentShader);

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    for (var attribName in attribLocationMap)
      gl.bindAttribLocation(program, attribLocationMap[attribName], attribName);

    gl.linkProgram(program);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return program;
  }

  function getProgramUniforms(gl, program) {
    var uniforms = {};
    var uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    var uniformName = "";
    for (var i = 0; i < uniformCount; i++) {
      var uniformInfo = gl.getActiveUniform(program, i);
      uniformName = uniformInfo.name.replace("[0]", "");
      uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
    }
    return uniforms;
  }

  //-----------
  // FPS Graph
  //-----------

  var statsVS = [
    "uniform mat4 projectionMat;",
    "uniform mat4 modelViewMat;",
    "attribute vec3 position;",
    "attribute vec3 color;",
    "varying vec4 vColor;",

    "void main() {",
    "  vColor = vec4(color, 1.0);",
    "  gl_Position = projectionMat * modelViewMat * vec4( position, 1.0 );",
    "}",
  ].join("\n");

  var statsFS = [
    "precision mediump float;",
    "varying vec4 vColor;",

    "void main() {",
    "  gl_FragColor = vColor;",
    "}",
  ].join("\n");

  /*var segments = 30;
  var maxFPS = 90;

  function segmentToX(i) {
    return ((0.9/segments) * i) - 0.45;
  }

  function fpsToY(value) {
    return (Math.min(value, maxFPS) * (0.7 / maxFPS)) - 0.45;
  }

  function fpsToRGB(value) {
    return {
      r: Math.max(0.0, Math.min(1.0, 1.0 - (value/60))),
      g: Math.max(0.0, Math.min(1.0, ((value-15)/(maxFPS-15)))),
      b: Math.max(0.0, Math.min(1.0, ((value-15)/(maxFPS-15))))
    };
  }

  var now = (window.performance && performance.now) ? performance.now.bind(performance) : Date.now;*/

  var Stats = function(gl) {
    this.gl = gl;
    //this.enablePerformanceMonitoring = enablePerformanceMonitoring;

    /*this.sevenSegmentText = new SevenSegmentText(gl);

    this.startTime = now();
    this.prevFrameTime = this.startTime;
    this.prevGraphUpdateTime = this.startTime;
    this.frames = 0;
    this.fpsAverage = 0;
    this.fpsMin = 0;
    this.fpsStep = enablePerformanceMonitoring ? 1000 : 250;

    this.orthoProjMatrix = new Float32Array(16);
    this.orthoViewMatrix = new Float32Array(16);*/
    this.modelViewMatrix = new Float32Array(16);

    // Hard coded because it doesn't change:
    // Scale by 0.075 in X and Y
    // Translate into upper left corner w/ z = 0.02
    /*this.textMatrix = new Float32Array([
      0.075, 0, 0, 0,
      0, 0.075, 0, 0,
      0, 0, 1, 0,
      -0.3625, 0.3625, 0.02, 1
    ]);

    this.lastSegment = 0;*/

    this.attribs = {
      position: 0,
      color: 1
    };

    this.program = linkProgram(gl, statsVS, statsFS, this.attribs);
    this.uniforms = getProgramUniforms(gl, this.program);

    var fpsVerts = [];
    var fpsIndices = [];

    // Graph geometry
    /*for (var i = 0; i < segments; ++i) {
      // Bar top
      fpsVerts.push(segmentToX(i), fpsToY(0), 0.02, 0.0, 1.0, 1.0);
      fpsVerts.push(segmentToX(i+1), fpsToY(0), 0.02, 0.0, 1.0, 1.0);

      // Bar bottom
      fpsVerts.push(segmentToX(i), fpsToY(0), 0.02, 0.0, 1.0, 1.0);
      fpsVerts.push(segmentToX(i+1), fpsToY(0), 0.02, 0.0, 1.0, 1.0);

      var idx = i * 4;
      fpsIndices.push(idx, idx+3, idx+1,
                      idx+3, idx, idx+2);
    }*/

    function addBGSquare(left, bottom, right, top, z, r, g, b) {
      var idx = fpsVerts.length / 6;

      fpsVerts.push(left, bottom, z, r, g, b);
      fpsVerts.push(right, top, z, r, g, b);
      fpsVerts.push(left, top, z, r, g, b);
      fpsVerts.push(right, bottom, z, r, g, b);

      fpsIndices.push(idx, idx+1, idx+2,
                     idx, idx+3, idx+1);
    };

    // Panel Background
    addBGSquare(-6.0, -6.0, 6.0, 6.0, 0.0, 0.125, 0.125, 0.125);

    // FPS Background
    addBGSquare(-0.45, -0.45, 0.45, 0.25, 0.01, 0.4, 0.4, 0.4);

    // 30 FPS line
    //addBGSquare(-0.45, fpsToY(30), 0.45, fpsToY(32), 0.015, 0.5, 0.0, 0.5);

    // 60 FPS line
    //addBGSquare(-0.45, fpsToY(60), 0.45, fpsToY(62), 0.015, 0.2, 0.0, 0.75);

    this.fpsVertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.fpsVertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fpsVerts), gl.DYNAMIC_DRAW);

    this.fpsIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.fpsIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(fpsIndices), gl.STATIC_DRAW);

    this.fpsIndexCount = fpsIndices.length;
  };

  Stats.prototype.render = function(projectionMat, modelViewMat) {
    var gl = this.gl;

    gl.useProgram(this.program);

    gl.uniformMatrix4fv(this.uniforms.projectionMat, false, projectionMat);
    gl.uniformMatrix4fv(this.uniforms.modelViewMat, false, modelViewMat);

    gl.enableVertexAttribArray(this.attribs.position);
    gl.enableVertexAttribArray(this.attribs.color);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.fpsVertBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.fpsIndexBuffer);

    gl.vertexAttribPointer(this.attribs.position, 3, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(this.attribs.color, 3, gl.FLOAT, false, 24, 12);

    // Draw the graph and background in a single call
    gl.drawElements(gl.TRIANGLES, this.fpsIndexCount, gl.UNSIGNED_SHORT, 0);
  }

  return Stats;
})();
