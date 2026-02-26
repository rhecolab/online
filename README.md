## Overview
This is an explainer on setting up an online experiment task in Qualtrics via Github. The hope is that it should be understandable with no familiarity with web design, Github, or Qualtrics (if you already have experience, skip to tedirect steps at the end). There’s a lot of moving parts in this, so apologies for the length - but all the parts are pretty simple! 

The ten thousand foot view is that we’re making a website, hosting it through Github, and then embedding it in Qualtrics and saving the data securely directly to Qualtrics. The participants and their data are on Qualtrics the entire time, but we get a lot more customization and flexibility in the tasks we’re doing.

*Author:* Kira Wegner-Clemens (@kirawc)
*Last updated:* 2/26/26

## Step by step (detailed explanations below)
Initial set up (general) 
1. Set up your IDE
2. Set up your github account & get added as a collaborator for this repo
3. Clone this repo 
4. Install dependencies 

Initial set up (each new task)
1. Initial task code (html, css, js) 
2. Write config file and create initial bundle
3. Push everything to Gitub
3. Edit javascript on question in Qualtrics 
4. Edit "embedded data" value in Qualtrics 

Updating/testing tasks  
1.	Make changes to code on your computer 
2.	Save changes!
3.	In terminal, run configuration script to bundle together all your files
4.	Push the scripts and the newly created bundle to Github 
5.	Wait a couple minutes for Pages to update. Sometimes you have to close your browser or go to an incognito window. 
6.	Preview the task in Qualtrics 
7.	Right click inspect on your browser to bring up the console & check for console.log messages and errors  


## HTML + CSS + JS
This is the core of the task. Every single task has it's owThere’s overlap between them but in general this is the division between the three languages: 
•	HTML is the content of the webpage – instruction text, stimulus images, etc 
•	CSS is how that content looks – spacing, fonts, background color, etc
•	Javascript is the behavior of that content – elements appearing/disappearing, capturing clicks, etc 

You will need to edit these outside of Github/Quatrics. I use Visual Studio, but any IDE will work. 

Troubleshooting web experiments can also be a bit tricky compared to experiments that are running directly on your computer because of browser permission issues.  You need to either be running a local server with node js or bundle/linking the bundle through Qualtrics. I would recommend just setting it up in Qualtrics from the start. To see error messages or console logs, you'll need to right click and "inspect" to see the console.

## Github
Github is a platform for collaborating on code and version control. You can clone everything from this repo to your desktop and edit it from there. The best practice is to add your own account as a collaborator on the rhecolab-owned “online” repo. You’ll make changes to your code, save them, then “push” updates to the “online” repo. You can use either the Github Desktop app or commit/pus directly from terminal. 

The other great part of Github is the Pages function. This basically allows you to host a website for free through Github. The “online” repo for rhecolab is already set up through Pages so you don’t need to do any set up here, unless you’re making a new repo. 

## Bundling 
You’ll see in the main folder a series of js files that are “webpack.TASK.config.js”. There is one of these for each task and they all need to stay in the main folder. These tasks create the bundles and other changes that go in the dist. The bundle is what Qualtrics will directly link to. 

```
npx webpack --config webpack.TASK.config.js
```

## Qualtrics set up
The easiest way to do the set up on Qualtrics is to just make a copy of an existing working task. However, you’ll still have to customize it so it references the correct task. 
1.	In Builder, create an experiment block and any type of question. 
2.	On the left under “Edit question”, there is a “Question behavior” drop down with a “Javascript” option. You should also see the </> symbol on the question once you’ve added.  
3.	This is a general idea of the script for Qulatrics. Where it says “TASK”, you’ll replace with the task name that you used it your webpack config file (under output > library > name). The script will be -this needs to be the bundle, not the task directly. 

```
Qualtrics.SurveyEngine.addOnload(function() {
    this.hideNextButton();
    this.getQuestionTextContainer().style.display = "none";

    if (window.TASKLoaded) return;
    window.TASKLoaded = true;

    const script = document.createElement("script");
    script.src = "https://rhecolab.github.io/online/dist/BUNDLENAME.js";

    script.onload = function() {
        TASK.startTask("${e://Field/ResponseID}");
    };
    document.body.appendChild(script);
});
```

In Survey Flow, you should see the experiment block. You’ll. This needed to match the name you’re using to send the data at the end of your javascript. If this is the line in your code  (Qualtrics.SurveyEngine.setEmbeddedData("blinkData", jsonData) – the embedded data value would be “blinkData”. You don’t need to make values for each piece of information in that data (e.g., you don’t need a value for subject, response time, etc).     

4.	In “Look and feel”, go to Style and scroll down to Custom CSS. The bulk of the CSS we want/need is going to be part of the main bundle, but we want to remove some of Qulatrics default question so we can get our task . 

```
.QuestionOuter {  display: none !important; }
```
