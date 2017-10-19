var gamepads = (function() {
	'use strict';

  var gamepadAPI = function() {
    this.controllers = [];
    this.position = [];
    this.clicked = false;
    this.prssedGamepadId = -1;
  	this.pressedButtonId = -1;
  }

  function getGamepads() {
    if (navigator.getGamepads) {
      return navigator.getGamepads();
    }
    return;
  }

  gamepadAPI.prototype.update = function() {
    this.clicked = false;
    var gamepads = getGamepads();
    if (gamepads) {
      if (this.pressedGamepadId >= 0 && this.pressedButtonId >= 0) {
        if (gamepads[this.pressedGamepadId]
        	&& gamepads[this.pressedGamepadId].buttons
        	&& gamepads[this.pressedGamepadId].buttons[this.pressedButtonId].pressed == false) {
        	this.clicked = true;
          this.pressedGamepadId = -1;
          this.pressedButtonId = -1;
        }
        return;
      }
      this.clicked = false;

      for (var id in gamepads) {
        if (gamepads[id] && gamepads[id].buttons) {
          for (var index in gamepads[id].buttons) {
            if (gamepads[id].buttons[index].pressed) {
              this.pressedGamepadId = id;
              this.pressedButtonId = index;
              return;
            }
          }
        }
      }
    }
  }

return gamepadAPI;
})();
