##1. Building

### Install npm
Install Node Package Manager(npm), for your platform [http://nodejs.org/download/](http://nodejs.org/download/)

If npm is correctly installed; typing ```npm``` should return usage and show some options.

If you are using windows and you see the following error after running npm : 
> Error: ENOENT, stat C:\some directory...

ensure the directory exists and create it if not.

### Install gulp
Use npm to install gulp which is the build tool which is currently only used to prettify the code files.

```sh
npm install --global gulp
```

change to the project directory

```sh
cd /path/to/pcbuilder
```

### Install gulp plugins
Install some gulp plugins used by pcbuilder

```sh
npm install gulp --save-dev
npm install gulp-jshint --save-dev
npm install gulp-ignore --save-dev
npm install gulp-jsbeautifier --save-dev
```

Now run
```sh 
gulp
``` 
and it should build the project

## 2. Installing the extension
1. navigate to [chrome://extensions/](chrome://extensions/)
2. choose "Load unpacked extension" and point it to the pcbuilder directory
