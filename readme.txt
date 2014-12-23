Building:

Install npm for your platform http://nodejs.org/download/

test that it works by opening a command prompt and typing "npm"
it should say Usage and show some options
if on windows and you see Error: ENOENT, stat C:\some directory... make sure the directory in the error is created

Use Npm to install gulp which is the build tool
npm install --global gulp

change to the project directory
cd /path/to/pcrigger

Install some gulp plugins the project needs
npm install gulp --save-dev
npm install gulp-jshint --save-dev
npm install gulp-ignore --save-dev
npm install gulp-jsbeautifier --save-dev

now just run "gulp" and it should build the project