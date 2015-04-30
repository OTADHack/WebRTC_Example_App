// WebRTC Audio via Oracle Communication webRTC Session Controller (OCWSC).
// The webRTC capabilities have been replaced from togetherjs default ones. 
// This file is based on original webrtc.js, but only to support a video call through OCWSC. 

define(["jquery", "util", "session", "ui", "peers", "storage", "windowing"], function ($, util, session, ui, peers, storage, windowing) {
  var videortc = util.Module("videortc");
  var assert = util.assert;
  var getUserName = document.getElementById("formCallerName").value;
  session.RTCSupported = !!(window.mozRTCPeerConnection ||
                            window.webkitRTCPeerConnection ||
                            window.RTCPeerConnection);

  /****************************************
   * VIDEO OCWSC support
   */

  session.on("ui-ready", function () {  
	// Action to execute when click on the video button
	$("#togetherjs-video-button").click(function () {	
      if (session.RTCSupported) {		
        toggleVideo();
      } 
    });
	// Action to execute when click on the video button
	/*$("#togetherjs-video-button").click(function () {
      if (session.RTCSupported) {	
		/*
		Video button will be enable only if Audio call was established before. 
		So, if we press audio button again, will be closing the audio call and, 
		consequently. the video call will be also closed.

		shutdown();
      } 
    });*/


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
		
	var audioMediaDirection = wsc.MEDIADIRECTION.NONE;
    var videoMediaDirection = wsc.MEDIADIRECTION.SENDRECV;
	
	var callCustomConfig = new wsc.CallConfig(audioMediaDirection,videoMediaDirection);
	var fullname;
	var inVideo = false;
	var remoteMedia = document.getElementById("remoteVideo");
	var img_record = document.getElementById("record");
	var textVideo = document.getElementById("textVideo");
	var textRecord = document.getElementById("textRecord");
  
	///////////////////////////////////////////
	// FUNCTIONS
	///////////////////////////////////////////

	function register(userName) {	
		//Create a Session
		wscSession = new wsc.Session(userName, wsUri, sessionSuccessHandler, sessionErrorHandler); 
		// last parameter sessionId not needed in this case, because we are not refreshing
		// Creation of AuthHandler
	    var authHandler = new wsc.AuthHandler(wscSession);
		authHandler.refresh = refreshAuth;
	}
	
    // The function called when a session is instantiated. 
    // The next steps are processed here.
    function sessionSuccessHandler() {
        // Create a CallPackage.
        callPackage = new wsc.CallPackage(wscSession);
        // Bind the event handler of incoming call.
        if(callPackage){
			callPackage.onIncomingCall = onIncomingCall;
        }
        // Get user Id.
        userName = wscSession.getUserName();
    }
 
    // The function called when a session is not instantiated.
    function sessionErrorHandler(error) {
		console.log("onSessionError: error code=" + error.code + ", reason=" + error.reason);
		setControls("<h1>Session Failed, please logout and try again.</h1>");
	}

    // Function when authHandler.refresh 
	function refreshAuth(authType,authHeaders){
		var authInfo = null;
		if(authType==wsc.AUTHTYPE.SERVICE){
			authInfo = getServiceAuth(authHeaders);
		}else if(authType==wsc.AUTHTYPE.TURN){
			authInfo = getTurnAuth();
		}
		return authInfo;
	}
	
	function getTurnAuth(){
		// set STUN server to null so that candidate gathering
		// can be quickly in LAN. if in WAN, set a reachable STUN
		// server in statement above and comment the statement below.
		if (stunUrl) {
			return {
			  "iceServers" : [ {
				"url" : "stun:"+stunUrl
			  } ]
			};        
		}		  
		return null;
	};
	
	// This event handler is invoked when "Call" button is clicked.
	function callSomeOne(lcaller, lcallee) {
			console.log ("Callee is " + lcallee);
			console.log ("Caller is " + lcaller);    
			// Same domain case. The caller/callee may not have given the entire name.     
			if (lcallee.indexOf("@") < 0) {
				lcallee = lcallee + "@example.com";
			}
			if (lcaller.indexOf("@") < 0) {
				lcaller = lcaller + "@example.com";
			}
			// To call someone, create a Call object first.
			call = callPackage.createCall(lcallee, callCustomConfig, doCallError);
			if (call != null) {
				setEventHandlers(call);
				call.start();
			}
	}

	// This function is called when the call is not created.
	function doCallError(error) {
		alert('Call error reason:' + error.reason);
	}
	
	// This function is the incoming call callback
	// wsc triggers this function when it receives the invite from the remote caller. 
	// callConfig parameter is equal to the callCustomConfig from the remote caller.
	function onIncomingCall(callObj, callConfig) {
        if (!callConfig.hasVideo())
            return;
		if(TogetherJS.getConfig("disableVideoRTC")==false){

			console.log ("In onIncomingCall(). Accept the call with an alert message");
			setEventHandlers(callObj);

			alert('Incoming Video Call');

			console.log ("You are accepting the call");
			callee = userName;
			caller = callObj.getCaller;
			console.log (callee + " accepted the call from caller " + caller);
			console.log (" ");
			// Send the message back.
			callObj.accept(callCustomConfig);
			call = callObj;
		}
	}

	// This function binds the call and media state event handlers to the call object.
	// It is called by when user is the caller or the callee.
	function setEventHandlers(callobj) {
		callobj.onCallStateChange = function(newState){
			callStateChangeHandler(callobj, newState);
		};
		callobj.onMediaStreamEvent= mediaStreamEventHandler;
	}
			
	// This function is an event handler for changes of call state.
	function callStateChangeHandler(callObj, callState) {
		call = callObj;
		if (callState.state == wsc.CALLSTATE.ESTABLISHED) {
            console.log (" Call is established. Calling callMonitor. ");
            console.log (" ");
            videoActive();
			textVideo.style.display = 'none';
		} else if (callState.state == wsc.CALLSTATE.FAILED || callState.state == wsc.CALLSTATE.ENDED){
			attachMediaStream(remoteMedia, null);
            console.log (" Call ended or failed. Displaying controls again.");
            console.log (" ");
			videoInactive();
			textVideo.style.display = 'inline-block';
		}
	}
 
	// This event handler is invoked when a  media stream event is fired.
	// Attach media stream to HTML5 video element.
	function mediaStreamEventHandler(mediaState, stream) {
		if(TogetherJS.getConfig("disableVideoRTC")==false){			
			if (mediaState == wsc.MEDIASTREAMEVENT.REMOTE_STREAM_ADDED) {
				attachMediaStream(remoteMedia, stream);
			}
		}
	}	

	// This function displays the controls set by the application.
    function setControls(controls) {
		var controlsArea = document.getElementById("controls");
		controlsArea.innerHTML = controls;
	}
	
 	// 2. REGISTER
	caller = getUserName;
	callee = document.getElementById("formCalleeName").value;
	
	var name;
	
	if (getUserName) {
		if (typeof getUserName == "string") {
			name = getUserName;
		} else {
			name = getUserName();
		}
		if (name && typeof name != "string") {
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
			element.mozSrcObject = stream;
			if(stream!=null){
				element.play();
			}
		};
		reattachMediaStream = function(to, from) {
		  to.mozSrcObject = from.mozSrcObject;
		  to.play();
		};
	} else if (navigator.webkitGetUserMedia) {
		webrtcDetectedBrowser = "chrome";
		// Attach a media stream to an element.
		attachMediaStream = function(element, stream) {
			element.src = webkitURL.createObjectURL(stream);
			if(element.paused){
				element.play();
			}
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
	
	function videoActive(){
		inVideo = true;		
		$("#togetherjs-video-button").addClass("togetherjs-active");
	}
	
	function videoInactive(){
		inVideo = false;		
		$("#togetherjs-video-button").removeClass("togetherjs-active");
	}  
  
	function shutdown(){
		if(inVideo){
			call.end();
			videoInactive();
		}
	}
	
	/*
	Auxiliar function to terminate or start a Video call if it is 
	established or not.
	*/
    function toggleVideo() {	
		if (! inVideo) {
            console.log("Video Call. callee: " + callee);
			// We are not in a call, so lets establish it
			callSomeOne(fullname, callee);
			videoActive();
		}		
		else {		  
			// We already are calling, so lets terminate it
			shutdown();
		}
	}

  });

  return videortc;

});
