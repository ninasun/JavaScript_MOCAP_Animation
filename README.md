# JavaScript_MOCAP_Animation
Javascript parsing and stick figure browser animation for ASF/AMC MOCAP files. Final project for CS 290: 3D Digital Geometry at Duke University Spring 2016. 

Project contributers: Nina Sun, Brandon Choi, and Cosi Goldstein

To run the project in the browser, open up index.html. This is our intro page with a brief introduction to our project. You will then be guided to animation.html where our project actually lives. All the files should remain where they are as to not change paths. Doing so will cause errors in our html code because of the way CSS and Javascript files are imported.

Relevant JS files:
ASFparser.js
AMCparser.js
Scene.js
Trajectories.js

These are the main files that allow us to parse and animate MOCAP data. Scene.js holds the animation and rendering code. We utilized parts of the GUI code from Group Assignment 1 in this. Trajectories.js is where we utilize quaternions to calculate the positions of the joints. 

The test_data folder holds example amc and asf files from the CMU MOCAP database that we used. These can be used to test our program. Other folders and files are other dependencies for CSS or Javascript functions. Some of these are not written by us but proved to be useful. 

Note: if you wish to bypass our intro page, feel free to just open animation.html directly for testing purposes. index.html was just something fun we put together at the very end. 

Hope you enjoy!

### Controls
A,S,D,W,E,C to move the camera

Click and drag to rotate

### Options

Use the "Show Bones" and "Show Joints" toggle to show/hide the bones and joints

### TODO
-Default framerate is set to 120 FPS in Scene.js. Add framerate option since some ASF/AMC files use 60 FPS as specified in database.

-Add capability to input MOCAP database link instead of uploading ASF/AMC files

