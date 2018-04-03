# Reactive Docs
- Back-End side: https://github.com/fxm84625/Reactive-Docs-Server

## Features
- Rich Text Editor, using DraftJS, with the app on ElectronJS
  - Many common text editing features, such as Bold, Italics, Underscore, and Font Family / Size / Color
- Real-Time text editor, using Websockets on an Express Server
  - Users editing the same document will see changes immediately
  - Users see where other Users are selecting, through highlighting
  - Each User is highlighted their own color
- Documents saved in MongoDB
  - Autosave feature
  - Able to view Document History

## Purpose
- To create a collaborative Text Editor that has real-time change detection
- To create a simple App that doesn't eat up memory like Google Docs (since it runs on Chrome)
