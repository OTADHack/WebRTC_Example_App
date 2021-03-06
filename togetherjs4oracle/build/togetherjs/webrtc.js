// WebRTC Audio via Oracle Communication webRTC Session Controller (OCWSC). 
// Created for TADhack 2014 event.
// The webRTC capabilities have been replaced from togetherjs default ones  

define(["require", "jquery", "util", "session", "ui", "peers", "storage", "windowing"], function (require, $, util, session, ui, peers, storage, windowing) {
  var webrtc = util.Module("webrtc");
  var assert = util.assert;

  session.RTCSupported = !!(window.mozRTCPeerConnection ||
                            window.webkitRTCPeerConnection ||
                            window.RTCPeerConnection);

  /****************************************
   * Audio OCWSC support
   */

  session.on("ui-ready", function () {
  
	// Action to execute when click on the audio button
	$("#togetherjs-audio-button").click(function () {
      if (session.RTCSupported) {
        enableAudio();
      } else {
        console.log("#togetherjs-rtc-not-supported");
      }
    });


	///////////////////////////////////////////
	// OCWSC parameters (Optare Solutions)
	///////////////////////////////////////////
	
	var wscSession, callPackage, userName, caller, callee, call;
	wsc.setLogLevel(wsc.LOGLEVEL.DEBUG);
	 
	// Save the location from where the user accessed this application.
	var savedUrl = window.location;
	 
	// This application is deployed on WebRTC Session Controller (WSC).
	var wsUri = "ws://ocwsc71se.optaresolutions.com:7001/ws/webrtc/guest";
	var stunUrl = "ocwsc71me.optaresolutions.com:3478";
		
	// Create a CallConfig object.
	var audioMediaDirection = wsc.MEDIADIRECTION.SENDRECV;
	var videoMediaDirection = wsc.MEDIADIRECTION.NONE;
	var callConfig = new wsc.CallConfig(audioMediaDirection, videoMediaDirection);
	console.log("Created CallConfig with audio stream only.");
	var fullname;
	var inacall = false;

	function register(userName) {
		//Create a Session
		console.log("userName = " + userName);
		wscSession = new wsc.Session(userName, wsUri, sessionSuccessHandler, sessionErrorHandler); // last parameter sessionId not needed in this case, because we are not refreshing
		
		// Creation of AuthHandler
	    var authHandler = new wsc.AuthHandler(wscSession);
		authHandler.refresh = refreshAuth;
	}
	
    // The function called when a session is instantiated. 
    // The next steps are processed here.
    function sessionSuccessHandler() {
        console.log(" In sessionSuccesshandler.");

        // Create a CallPackage.
        callPackage = new wsc.CallPackage(wscSession);
        // Bind the event handler of incoming call.
        if(callPackage){
			callPackage.onIncomingCall = onIncomingCall;
        }
        console.log(" Created CallPackage..");
        console.log (" ");
        // Get user Id.
        userName = wscSession.getUserName();
        console.log (" Our user is " + userName);
        console.log (" ");
    }
 
    // The function called when a session is not instantiated.
    function sessionErrorHandler(error) {
		console.log("onSessionError: error code=" + error.code + ", reason=" + error.reason);
		setControls("<h1>Session Failed, please logout and try again.</h1>");
	}

    // Function when authHandler.refresh 
	function refreshAuth(authType,authHeaders){
		console.log("on refreshAuth...");
		var authInfo = null;
		if(authType==wsc.AUTHTYPE.SERVICE){
			console.log("authType = wsc.AUTHTYPE.SERVICE");
			authInfo = getServiceAuth(authHeaders);
		}else if(authType==wsc.AUTHTYPE.TURN){
			console.log("authType = wsc.AUTHTYPE.TURN");
			authInfo = getTurnAuth();
			console.log("Current the turn auth server is: "+JSON.stringify(authInfo));
		}
		return authInfo;
	}
	
	function getTurnAuth(){
		console.log("***********invoke getTurnAuthInfo");
		// set STUN server to null so that candidate gathering
		// can be quickly in LAN. if in WAN, set a reachable STUN
		// server in statement above and comment the statement below.

		if (stunUrl) {
			console.log("STUN: returning " + stunUrl); 
			return {
			  "iceServers" : [ {
				"url" : "stun:"+stunUrl
			  } ]
			};        
		}
		  
		console.log("STUN: returning null"); 
		return null;
	};
	
	// This event handler is invoked when "Call" button is clicked.
	function callSomeOne(caller, callee) {
		console.log ("In callSomeOne()");
		console.log ("Callee is " + callee);
		console.log ("Caller is " + caller);
    
		// Same domain case. The caller/callee may not have given the entire name.     
		if (callee.indexOf("@") < 0) {
			callee = callee + "@example.com";
			console.log("Complete callee ID is " + callee);
		}
		if (caller.indexOf("@") < 0) {
			caller = caller + "@example.com";
			console.log("Complete caller ID is " + caller);
		}

		console.log(" Caller, " + caller + ", wants to call " + callee + ", the Callee.");
		console.log (" ");

		// To call someone, create a Call object first.
		call = callPackage.createCall(callee, callConfig, doCallError);
		console.log ("Created the call.");

		if (call != null) {
			// Then start the call.
			console.log ("In callSomeOne(). Starting Call. ");
			//setEventHandlers(call);
			call.start();
			// Allow the user to cancel call before it is set up. End the call.
			// Disable "Call" button and enable "Cancel" button.
			// call.end();
		}
	}

	// This function is called when the call is not created.
	function doCallError(error) {
		alert('Call error reason:' + error.reason);
	}

	// This function is the incoming call callback
	// wsc triggers this function when it receives the invite from the remote caller. 
	function onIncomingCall(callObj, callConfig) {

        if (!callConfig.hasAudio())
          return;

		// Accept the call with an alert message
		console.log ("In onIncomingCall(). Accept the call with an alert message");
        setEventHandlers(callObj);

		alert('Incoming Audio Call');

 		console.log ("You are accepting the call");
		callee = userName;
        caller = callObj.getCaller;
        console.log (callee + " accepted the call from caller " + caller);
        console.log (" ");
        // Send the message back.
        callObj.accept(callConfig);
		call = callObj;
	}

	// This function binds the call and media state event handlers to the call object.
	// It is called by when user is the caller or the callee.
	function setEventHandlers(callobj) {
		console.log ("In setEventHandlers");
		console.log (" ");
		callobj.onCallStateChange = function(newState){
			callStateChangeHandler(callobj, newState);
		};
		callobj.onMediaStreamEvent= mediaStreamEventHandler;
	}
			
	// This function is an event handler for changes of call state.
	function callStateChangeHandler(callObj, callState) {
		console.log (" In callStateChangeHandler().");
		console.log("callstate : " + JSON.stringify(callState));
		call = callObj;
		if (callState.state == wsc.CALLSTATE.ESTABLISHED) {
			console.log (" Call is established. Calling callMonitor. ");
			console.log (" ");
			inacall = true;
			//callMonitor(callObj);
		} else if (callState.state == wsc.CALLSTATE.ENDED) {
			console.log (" Call ended. Displaying controls again.");
			console.log (" ");
			inacall = false;
			//displayInitialControls();
		} else if (callState.state == wsc.CALLSTATE.FAILED) {
			console.log (" Call failed. Displaying controls again.");
			console.log (" ");	
			inacall = false;
			//displayInitialControls();
		}
	}
 
	// This event handler is invoked when a  media stream event is fired.
	// Attach media stream to HTML5 audio element.
	function mediaStreamEventHandler(mediaState, stream) {
		console.log (" In mediaStreamEventHandler.");
		console.log("mediastate : " + mediaState);
		console.log (" ");
 
		if (mediaState == wsc.MEDIASTREAMEVENT.LOCAL_STREAM_ADDED) {
			attachMediaStream(document.getElementById("selfAudio"), stream);
		} else if (mediaState == wsc.MEDIASTREAMEVENT.REMOTE_STREAM_ADDED) {
			attachMediaStream(document.getElementById("remoteAudio"), stream);
		}
	}	

	// This function displays the controls set by the application.
    function setControls(controls) {
		var controlsArea = document.getElementById("controls");
		controlsArea.innerHTML = controls;
	}
	
 	// 2. REGISTER
	console.log("Preparing to register to WSC...");
	//var getUserName = TogetherJS.require("peers").Self.name;
	//var getUserName = peers.Self.name;
	//var getUserName = TogetherJS.config("variable", value); //this option is to give a new value
	//var getUserName = TogetherJS.getConfig("getUserName");
	//var getUserName = "user1"; 
	var getUserName = document.getElementById("formCallerName").value;
	console.log("self.name = " + getUserName);

	var name;
	if (getUserName) {
		if (typeof getUserName == "string") {
			name = getUserName;
		} else {
			name = getUserName();
		}
		if (name && typeof name != "string") {
			//TODO: test for HTML safe?  Not that we require it, but
			// <>'s are probably a sign something is wrong.
			console.log("Error in getUserName(): should return a string (got", name, ")");
			name = null;
		}
	}
	fullname = name + "@example.com";
	register(fullname);
			
	///////////////////////////////////////////
	// Streams attachments to Browsers
	///////////////////////////////////////////

  var attachMediaStream = null;
  var reattachMediaStream = null;
  var webrtcDetectedBrowser = null;


  if (navigator.mozGetUserMedia) {

    webrtcDetectedBrowser = "firefox";

    // Attach a media stream to an element.
    attachMediaStream = function(element, stream) {
      console.log("Attaching media stream");
      element.mozSrcObject = stream;
      element.play();
    };

    reattachMediaStream = function(to, from) {
      console.log("Reattaching media stream");
      to.mozSrcObject = from.mozSrcObject;
      to.play();
    };


  } else if (navigator.webkitGetUserMedia) {

    webrtcDetectedBrowser = "chrome";


    // Attach a media stream to an element.
    attachMediaStream = function(element, stream) {
      element.src = webkitURL.createObjectURL(stream);
    };

    reattachMediaStream = function(to, from) {
      to.src = from.src;
    };

	
    // The representation of tracks in a stream is changed in M26.
    // Unify them for earlier Chrome versions in the coexisting period.
    if (!webkitMediaStream.prototype.getVideoTracks) {
      webkitMediaStream.prototype.getVideoTracks = function() {
        return this.videoTracks;
      };
      webkitMediaStream.prototype.getAudioTracks = function() {
        return this.audioTracks;
      };
    }

    // New syntax of getXXXStreams method in M26.
    if (!webkitRTCPeerConnection.prototype.getLocalStreams) {
      webkitRTCPeerConnection.prototype.getLocalStreams = function() {
        return this.localStreams;
      };
      webkitRTCPeerConnection.prototype.getRemoteStreams = function() {
        return this.remoteStreams;
      };
    }
	
	
  } else {
    console.log("Browser does not appear to be WebRTC-capable");
  }
  
	///////////////////////////////////////////
	// OCWSC parameters END
	///////////////////////////////////////////
	
    function enableAudio() {
	
	  if (! inacall) {
	  
		  // We are not in a call, so lets establish it
		  console.log("CALLING...");
		  
		  //var callee = this.peer.name;
		  var callee = document.getElementById("formCalleeName").value;
		  console.log("callee: " + callee);
		  callSomeOne(fullname, callee);
		  inacall = true;
	  }
		
	  else {
		  
		  // We already are calling, so lets terminate it
 		  console.log("ENDING CALL...");

          call.end();
 		  inacall = false;
	  }
	}

  });

  /****************************************
   * getUserMedia Avatar support
   */

  session.on("ui-ready", function () {
    $("#togetherjs-self-avatar").click(function () {
      var avatar = peers.Self.avatar;
      if (avatar) {
        $preview.attr("src", avatar);
      }
      ui.displayToggle("#togetherjs-avatar-edit");
    });
    if (! session.RTCSupported) {
      $("#togetherjs-avatar-edit-rtc").hide();
    }

    var avatarData = null;
    var $preview = $("#togetherjs-self-avatar-preview");
    var $accept = $("#togetherjs-self-avatar-accept");
    var $cancel = $("#togetherjs-self-avatar-cancel");
    var $takePic = $("#togetherjs-avatar-use-camera");
    var $video = $("#togetherjs-avatar-video");
    var $upload = $("#togetherjs-avatar-upload");

    $takePic.click(function () {
      if (! streaming) {
        startStreaming();
        return;
      }
      takePicture();
    });

    function savePicture(dataUrl) {
      avatarData = dataUrl;
      $preview.attr("src", avatarData);
      $accept.attr("disabled", null);
    }

    $accept.click(function () {
      peers.Self.update({avatar:  avatarData});
      ui.displayToggle("#togetherjs-no-avatar-edit");
      //TODO: these probably shouldn't be two elements:
      $("#togetherjs-participants-other").show();
      $accept.attr("disabled", "1");
    });

    $cancel.click(function () {
      ui.displayToggle("#togetherjs-no-avatar-edit");
      //TODO: like above:
      $("#togetherjs-participants-other").show();
    });

    var streaming = false;
    function startStreaming() {
      getUserMedia({
          video: true,
          audio: false
        },
        function(stream) {
          streaming = true;
          $video[0].src = URL.createObjectURL(stream);
          $video[0].play();
        },
        function(err) {
          //TODO: should pop up help or something in the case of a user
          // cancel
          console.error("getUserMedia error:", err);
        }
      );
    }

    function takePicture() {
      assert(streaming);
      var height = $video[0].videoHeight;
      var width = $video[0].videoWidth;
      width = width * (session.AVATAR_SIZE / height);
      height = session.AVATAR_SIZE;
      var $canvas = $("<canvas>");
      $canvas[0].height = session.AVATAR_SIZE;
      $canvas[0].width = session.AVATAR_SIZE;
      var context = $canvas[0].getContext("2d");
      context.arc(session.AVATAR_SIZE/2, session.AVATAR_SIZE/2, session.AVATAR_SIZE/2, 0, Math.PI*2);
      context.closePath();
      context.clip();
      context.drawImage($video[0], (session.AVATAR_SIZE - width) / 2, 0, width, height);
      savePicture($canvas[0].toDataURL("image/png"));
    }

    $upload.on("change", function () {
      var reader = new FileReader();
      reader.onload = function () {
        //TODO: I don't actually know it's JPEG, but it's probably a
        // good enough guess:
        var url = "data:image/jpeg;base64," + util.blobToBase64(this.result);
        convertImage(url, function (result) {
          savePicture(result);
        });
      };
      reader.onerror = function () {
        console.error("Error reading file:", this.error);
      };
      reader.readAsArrayBuffer(this.files[0]);
    });

    function convertImage(imageUrl, callback) {
      var $canvas = $("<canvas>");
      $canvas[0].height = session.AVATAR_SIZE;
      $canvas[0].width = session.AVATAR_SIZE;
      var context = $canvas[0].getContext("2d");
      var img = new Image();
      img.src = imageUrl;
      // Sometimes the DOM updates immediately to call
      // naturalWidth/etc, and sometimes it doesn't; using setTimeout
      // gives it a chance to catch up
      setTimeout(function () {
        var width = img.naturalWidth || img.width;
        var height = img.naturalHeight || img.height;
        width = width * (session.AVATAR_SIZE / height);
        height = session.AVATAR_SIZE;
        context.drawImage(img, 0, 0, width, height);
        callback($canvas[0].toDataURL("image/png"));
      });
    }


  });  
  return webrtc;

});
