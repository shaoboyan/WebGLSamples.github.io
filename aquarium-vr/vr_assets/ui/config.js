{
  "menu" : {
 	"background" : {
      "main" : {
	    "vertex" : [-1.7, -2.0, 1.7, 6.5],
		"color" : [0.125, 0.125, 0.125, 0.5]
	  },
	  "options" : {
        "vertex" : [-1.7, -6.0, 1.7, -2.0],
	    "color" : [0.125, 0.125, 0.125, 0.5]
      }
    },
    "labels" : [
        {
        	"clickable" : true,
			"isSwitch" : true,
			"name" : "fps",
			"alwaysPresent" : true,
			"texture" : {
			  "on" : "fps_red.png",
			  "off" : "fps.png"
			},
			"vertex" : [-1.0, 5.0, 1.0, 5.5]
		},
		{
			"clickable" : false,
			"isSwitch" : false,
			"name" : "numberOfFish",
			"alwaysPresent" : true,
			"texture" : "fish.png",
			"vertex" : [-1.0, 4.3, 1.0, 4.8]
		},
		{
		    "clickable" : true,
		    "isSwitch" : false,
		    "name" : "changeView",
		    "alwaysPresent" : true,
		    "texture" : "view.png",
		    "vertex" : [-1.0, -1.3, 1.0, -0.8]
		},
		{
			"clickable" : true,
		    "isSwitch" : false,
		    "name" : "options",
			"alwaysPresent" : true,
			"texture" : "options.png",
			"vertex" : [-1.0, -1.8, 1.0, -1.3]
	    },
		{
			"clickable" : true,
		    "isSwitch" : true,
		    "name" : "normalMaps",
		    "alwaysPresent" : false,
		    "texture" : {
		      "on" : "normal_map_red.png",
			  "off" : "normal_map.png"
		    },
		    "vertex" : [-1.0, -2.3, 1.0, -1.8]
		},
		{
			"clickable" : true,
		    "isSwitch" : true,
		    "name" : "reflection",
			"alwaysPresent" : false,
			"texture" : {
			  "on" : "reflection_red.png", 
			  "off" : "reflection.png"
			},
			"vertex" : [-1.0, -2.8, 1.0, -2.3]
		},
		{
			"clickable" : true,
		    "isSwitch" : true,
		    "name" : "tank",
			"alwaysPresent" : false,
			"texture" : {
			  "on" : "tank_red.png",
			  "off" : "tank.png"
			},
			"vertex" : [-1.0, -3.3, 1.0, -2.8]
		},
		{
			"clickable" : true,
		    "isSwitch" : true,
		    "name" : "museum",
		    "alwaysPresent" : false,
		    "texture" : {
		      "on" : "museum_red.png", 
			  "off" : "museum.png"
		    },
		    "vertex" : [-1.0, -3.8, 1.0, -3.3]
		},
		{
			"clickable" : true,
		    "isSwitch" : true,
		    "name" : "fog",
			"alwaysPresent" : false,
			"texture" : {
			  "on" : "fog_red.png", 
			  "off" : "fog.png"
			},
			"vertex" : [-1.0, -4.3, 1.0, -3.8]
		},
	    {
	    	"clickable" : true,
		    "isSwitch" : true,
		    "name" : "bubbles",
			"alwaysPresent" : false,
			"texture" : {
			  "on" : "bubbles_red.png", 
			  "off" : "bubbles.png"
			},
		    "vertex" : [-1.0, -4.8, 1.0, -4.3]
		},
		{
			"clickable" : true,
		    "isSwitch" : true,
		    "name" : "ray",
			"alwaysPresent" : false,
			"texture" : {
			  "on" : "light_rays_red.png",
			  "off" : "light_rays.png"
			},
			"vertex" : [-1.0, -5.3, 1.0, -4.8]
		}
	]
  }
}
