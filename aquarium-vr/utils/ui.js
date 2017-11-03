tdl.require('tdl.textures');
tdl.require('tdl.io');
tdl.require('tdl.fast');
tdl.require('tdl.webgl');

var Ui = (function() {

  "use strict";

  //-----------
  // FPS Graph
  //-----------
  
  var menuPrimitiveVS = [
    "uniform mat4 projectionMat;",
    "uniform mat4 modelViewMat;",
    "uniform vec2 position;",

    "void main() {",
    "  gl_Position = projectionMat * modelViewMat * vec4(position, 0.0, 1.0);",
    "  gl_PointSize = 5.0;",
    "}",
  ].join("\n");

  var menuPrimitiveFS = [
    "precision mediump float;",
    "uniform vec4 color;",
    "void main() {",
    "  gl_FragColor = color;",
    "}",
  ].join("\n");

  var menuLabelVS = [
    "uniform mat4 projectionMat;",
    "uniform mat4 modelViewMat;",
    "attribute vec2 position;",
    "attribute vec2 texCoord;",
    "varying vec2 v_TexCoord;",

    "void main() {",
    "  v_TexCoord = texCoord;",
    "  gl_Position = projectionMat * modelViewMat * vec4( position, 0.0, 1.0 );",
    "}",
  ].join("\n");

  var menuLabelFS= [
    "precision mediump float;",
    "uniform sampler2D u_Sampler;",
    "varying vec2 v_TexCoord;",

    "void main() {",
    "  //gl_FragColor = vec4(0.5, 0.0, 0.0, 1.0);//texture2D(u_Sampler, v_TexCoord);",
    "  gl_FragColor = texture2D(u_Sampler, v_TexCoord);",
    "}",
  ].join("\n");

  //-------------------
  // Utility functions
  //-------------------

  function linkProgram(gl, vertexSource, fragmentSource, attribLocationMap) {
    // No error checking for brevity.
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexSource);
    gl.compileShader(vertexShader);
    var compiled = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
    var compilationLog = gl.getShaderInfoLog(vertexShader);

    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentSource);
    gl.compileShader(fragmentShader);
    compiled = gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS);
    compilationLog = gl.getShaderInfoLog(fragmentShader);


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

  var Menu = function(gl, numFish) {
    this.gl = gl;
    this.loaded = false;
    this.url = null;
    this.textures = {};
    this.primitiveProgram = null;
    this.labelProgram = null;
    this.cursorProgram = null;
    this.primitiveAttribs = {
      position : 0,
    };
    this.labelAttribs = {
      position : 0,
      texCoord : 1
    };
    this.primitiveUniforms = null;
    this.labelUniforms = null;

    this.vertBuffer = null;
    this.indexBuffer = null;
    this.labelVertBuffer = null;
    this.labelIndexBuffer = null;
    this.textCoordBuffer = null;

    this.verts = [];
    this.indices = [];

    this.labelVerts = [];
    this.labelIndices = [];
    this.label = [];

    this.numberOfFish = numFish;
    this.textRenderer = new VRTextRenderer(gl);

    this.showOptions = false;
    this.u_Sampler = 0;

    this.option = false;
    this.labelLayout = [];

    this.clock = 0;
    this.lastLabelName = null;

    this.fps = 0;
    this.menuMode = true;

    this.cursorModelViewMat = new Float32Array(16);
  }

  function segmentPlaneInteracts(segmentBeginPoint, orientation) {
    // 1. orientation is stored as quaternion and we need to calculate our line equation.
    var q1 = orientation[0];
    var q2 = orientation[1];
    var q3 = orientation[2];
    var q0 = orientation[3];

    var x_factor = 2 * (q1 * q3 - q0 * q2);
    var y_factor = 2 * (q2 * q3 + q0 * q1);
    var z_factor = (1 - 2 * q1 * q1 - 2 * q2 * q2);

    // 2. Read our plane equation.
    var planeEquation = [0, 0, 1, 10];

    // 3. calculate the interact point and decide which label it clicked.
    var t = 10.0 / z_factor;

    return [x_factor * t, y_factor * t];
  }

  function updateLabelStatus(segmentBeginPoint, orientation, that) {
    // All the bound magic number need to be recoreded by a variable
    var interactPoint = segmentPlaneInteracts(segmentBeginPoint, orientation);
    var leftIndex = 0;
    var bottomIndex = 1;
    var rightIndex = 2;
    var topIndex = 3;
    var updatedStatus = [];
    if (interactPoint[0] < -1.0 || interactPoint[0] > 1.0 || interactPoint[1] > 5.5) return;
    if (that.option) {
      if (interactPoint[1] < -5.3) return;
      for (var label in that.labelLayout) {
        if (that.labelLayout[label].vertex[bottomIndex] < interactPoint[1] 
              && that.labelLayout[label].vertex[topIndex] >= interactPoint[1]
              && that.labelLayout[label].vertex[leftIndex] < interactPoint[0]
              && that.labelLayout[label].vertex[rightIndex] >= interactPoint[0]) {
          if (that.lastLabelName != that.labelLayout[label].name) {
            that.lastLabelName = that.labelLayout[label].name;
            that.clock = new Date().getTime();
            break;
          } else {
            that.clock = new Date().getTime() - that.clock;
            if (that.clock > 3000) {
              updatedStatus.push(that.labelLayout[label].name);
              that.lastLabelName = null;
              break;
            }
          }
        }
      }
    } else {
      if (interactPoint[1] < -1.8) return;
      for (var label in that.labelLayout) {
        if (that.labelLayout[label].vertex[bottomIndex] < interactPoint[1]
              && that.labelLayout[label].vertex[topIndex] >= interactPoint[1]
              && that.labelLayout[label].vertex[leftIndex] < interactPoint[0]
              && that.labelLayout[label].vertex[rightIndex] >= interactPoint[0]) {
          if (that.lastLabelName != that.labelLayout[label].name) {
            that.lastLabelName = that.labelLayout[label].name;
            that.clock = new Date().getTime();
            break;
          } else {
            that.clock = new Date().getTime() - that.clock;
            if (that.clock > 3000) {
              updatedStatus.push(that.labelLayout[label].name);
              that.lastLabelName = null;
              break;
            }
          }
        }
      }
    }
    return updatedStatus;
  }

  function generateVerts(verts, indices, data) {
    var left = data.vertex[0];
    var bottom = data.vertex[1];
    var right = data.vertex[2];
    var top = data.vertex[3];
    var idx = verts.length / 2;    
    verts.push(
      left, top,
      right, top,
      right, bottom,
      left, bottom);
    indices.push(
      idx, idx + 2, idx + 1,
      idx, idx + 3, idx + 2
    );
  }

  function generateTexVerts(verts, indices, data) {
    var left = data.vertex[0];
    var bottom = data.vertex[1];
    var right = data.vertex[2];
    var top = data.vertex[3];
    var idx = verts.length / 4;
    verts.push(
      left, top,
      right, top,
      right, bottom,
      left, bottom,
      0.0, 1.0,
      1.0, 1.0,
      1.0, 0.0,
      0.0, 0.0);
    indices.push(
      idx, idx + 2, idx + 1,
      idx, idx + 3, idx + 2
    );
  }

  Menu.prototype.load = function(url) {
    var that = this;

    tdl.io.loadJSON(url, function(data, exception) {
      that.onload_(data, exception);
    });

    this.primitiveProgram = linkProgram(gl, menuPrimitiveVS, menuPrimitiveFS, this.primitiveAttribs);
    this.labelProgram = linkProgram(gl, menuLabelVS, menuLabelFS, this.labelAttribs);

    this.primitiveUniforms = getProgramUniforms(gl, this.primitiveProgram);
    this.labelUniforms = getProgramUniforms(gl, this.labelProgram);

    tdl.fast.matrix4.inverse(this.cursorModelViewMat, fast.matrix4.translation(this.cursorModelViewMat, [0,0,6]));
  }

  Menu.prototype.onload_ = function(data, exception) {
    if (exception) {
      tdl.error("tdl load json file with exception : " + exception);
      return;
    } else {
      // Load background
      /*this.mainBackgroundVertexOffset = 0;
      this.mainBackgroundIndexOffset = 0;
      generateVerts(this.verts, this.indices, data.menu.background.main);

      this.optionBackgroundVertexOffset = this.verts.length * 4;
      this.optionBackgroundIndexOffset = this.indices.length * 2; // 2 Byte per elements
      generateVerts(this.verts, this.indices, data.menu.background.options);*/
      /*generateVerts(this.verts, this.indices, data.menu.background.cursor);

      this.vertBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.verts), gl.DYNAMIC_DRAW);

      this.indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);*/

      // Load labels
      for (var name in data.menu.labels) {
        var label = {};
        label.vertexOffset = this.labelVerts.length * 2;
        label.indexOffset = this.labelIndices.length * 2;
        label.alwaysPresent = data.menu.labels[name].alwaysPresent;
        generateTexVerts(this.labelVerts, this.labelIndices, data.menu.labels[name]);
        if (data.menu.labels[name].isSwitch) {
          label.presentTexture =  tdl.textures.loadTexture(
             './vr_assets/ui/' + data.menu.labels[name].texture.on, true);
          label.backupTexture = tdl.textures.loadTexture(
            './vr_assets/ui/' + data.menu.labels[name].texture.off, true);
        } else {
          label.presentTexture = tdl.textures.loadTexture(
             './vr_assets/ui/' + data.menu.labels[name].texture, true);
        }
        this.label.push(label);

        var labelLayout = {};
        if (data.menu.labels[name].clickable) {
          labelLayout.name = data.menu.labels[name].name;
          labelLayout.isOption = !data.menu.labels[name].alwaysPresent;
          labelLayout.vertex = data.menu.labels[name].vertex;
          this.labelLayout.push(labelLayout);
        }

      }
      for (var index in this.numberOfFish) {
        var labelLayout = {};
        labelLayout.name = index.toString();
        labelLayout.isOption = false;
        labelLayout.vertex = [-0.8, 3.5 - index * 0.5, 1.5, 4.0 - index * 0.5];
        this.labelLayout.push(labelLayout);
      }

      this.labelVertBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.labelVertBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.labelVerts), gl.DYNAMIC_DRAW);

      this.labelIndicesBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.labelIndicesBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.labelIndices), gl.STATIC_DRAW);

      this.loaded = true;
    }
  }

  Menu.prototype.render = function(projectionMat, modelViewMat, orientations) {
    if (this.loaded == false)
      return;
    var gl = this.gl;
    if (this.menuMode) {
      gl.useProgram(this.primitiveProgram);

      //gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
      //gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      gl.uniformMatrix4fv(this.primitiveUniforms.projectionMat, false, projectionMat);
      gl.uniformMatrix4fv(this.primitiveUniforms.modelViewMat, false, this.cursorModelViewMat);
      gl.uniform4f(this.primitiveUniforms.color, 0.0, 1.0, 0.0, 1.0);
      gl.uniform2f(this.primitiveUniforms.position, 0.0, 0.0);
      //gl.disableVertexAttribArray(this.primitiveAttribs.position);
      //gl.vertexAttrib2f(this.primitiveAttribs.position, 0.0, 0.0);
      //gl.enableVertexAttribArray(this.primitiveAttribs.position);
      //gl.vertexAttribPointer(this.primitiveAttribs.position, 2, gl.FLOAT, false, 8, 0);
      gl.drawArrays(gl.POINTS, 0, 1);
      //gl.vertexAttrib2f(this.primitiveAttribs.position, 0.0, 0.0);
      //gl.drawArrays(gl.POINTS, 0, 1);

      /*gl.uniformMatrix4fv(this.primitiveUniforms.projectionMat, false, projectionMat);
      gl.uniformMatrix4fv(this.primitiveUniforms.modelViewMat, false, modelViewMat);
      gl.uniform4f(this.primitiveUniforms.color, 0.125, 0.125, 0.125, 0.5);

      gl.enableVertexAttribArray(this.primitiveAttribs.position);
      gl.vertexAttribPointer(this.primitiveAttribs.position, 2, gl.FLOAT, false, 8, this.mainBackgroundVertexOffset);

      if (this.option) {
        gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_SHORT, 0);
      } else {
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
      }*/
      var textMatrix = [0.175, 0, 0, 0, 0, 0.175, 0, 0, 0, 0, 0, 1, -0.8, 4.0, 0, 1];
      for (var number in this.numberOfFish) {
        this.textRenderer.render(projectionMat, modelViewMat, textMatrix, this.numberOfFish[number]);
        textMatrix[13] -= 0.5;
      }

      gl.useProgram(this.labelProgram);
      gl.uniformMatrix4fv(this.labelUniforms.projectionMat, false, projectionMat);
      gl.uniformMatrix4fv(this.labelUniforms.modelViewMat, false, modelViewMat);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.labelVertBuffer);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.labelIndicesBuffer);

      for (var name in this.label) {
        if (this.label[name].alwaysPresent || this.option) {
          gl.enableVertexAttribArray(this.labelAttribs.position);
          gl.vertexAttribPointer(this.labelAttribs.position, 2 , gl.FLOAT, false, 8, this.label[name].vertexOffset);
          gl.enableVertexAttribArray(this.labelAttribs.texCoord)
          gl.vertexAttribPointer(this.labelAttribs.texCoord, 2, gl.FLOAT, false, 8, this.label[name].vertexOffset + 32);
          this.label[name].presentTexture.bindToUnit(0);
          gl.uniform1i(this.labelUniforms.u_Sampler, 0);
          gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, this.label[name].indexOffset);
        }
      }

      var update = updateLabelStatus([0, 0, 0] , orientations[0], this);
      console.log(update);
    } else {
      var textMatrix = new Float32Array([0.075, 0, 0, 0, 0, 0.075, 0, 0, 0, 0, 1, 0, -0.3625, 0.3625, 0.02, 1]);
      var statViewMatrix = new Float32Array(16);
      var modelViewMat = fast.matrix4.inverse(statViewMatrix, fast.matrix4.translation(statViewMatrix, [0, 0, 6]));
      this.textRenderer.render(projectionMat, modelViewMat, textMatrix, this.fps);
    }
  }

  Menu.prototype.setFps = function(fps) {
    this.fps = fps + "FP5";
  }

  return Menu;
})();
