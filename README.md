WebRTC Share Bar Example App
=========

Source code of a **WebRTC application** providing webRTC audio call and other sharing capabilities.
The application combines the capabilities of these two systems:
+ [Oracle Communications WebRTC Session Controller (OCWSC)](http://www.oracle.com/us/products/applications/communications/web-rtc-session-controller/overview/index.html)
+ [TogetherJS](https://togetherjs.com/) 

Version
----

1.0

Usage
----

Follow this steps:

+ Request your credentials on the [Oracle's TADHack website](http://tadhack.optaresolutions.com).
+ Download the source code included in this repository using the `Download ZIP button` or using the clone option
```sh
git clone https://github.com/OTADHack/WebRTC_Example_App.git
```
+ Build the togetherjs project 
```sh
cd togetherjs4oracle
grunt build buildsite --no-hardlink --force
```
+ Run the nodejs server
```sh
node devserver.js
```
+ Open a first instance of your WebRTC compatible browser (Chrome or Firefox).  
Enter the url 'http://localhost:8080/tadhack/test_user.html'.  
Cancel if a popup window appears.  
Click the button 'Login to Oracle Communications WebRTC platform for TADHack 2014'. Enter your credentials here.  
Enter 'user1' as username in the prompt window.  
Click the button 'Start TogetherJS'. A blue bar appears at the right of the web page.
+ Open a second instance of your WebRTC compatible browser (Chrome or Firefox), this time in incognito mode.  
Repeat the same steps as with first instance, but now entering the 'user2' value as username.
+ Proceed with the webRTC audio call from any of the two browser instances.  
Click on the microphone button with the label 'Begin/End a WebRTC audio connection'.  
In the other browser window, accept the 'Incoming call' notification.
+ Start the conversation and enjoy!  
Note that if you are executing the two instances from the same computer, you will probably hear some echo.
+ End your conversation.  
Click on the microphone button with the label 'Begin/End a WebRTC audio connection'.

Developer notes
----

+ The togetherJS code has been modified in order to replace the standard webRTC with the [API offered by Oracle Communications WebRTC Session Controller 7.1](http://docs.oracle.com/cd/E55119_01/doc.71/e55126/toc.htm)  
The main changes are located in the `togetherjs\webrtc.js` file.
+ You can easily test this application with your own web page, in order to include this WebRTC sharing bar.  
Replace the 'test_user.html' file with your web page.
+ When testing or debugging your own application with the browser, it is strongly recommended to enable the Javascript console (try to press F12)

Documentation
----

WebRTC Documentation can be found at [Oracle's TADHack WebRTC website](http://tadhack.optaresolutions.com/?page_id=60).

Support
----

If you have any doubt, ask it in [the Issues section](https://github.com/OTADHack/WebRTC/issues).
