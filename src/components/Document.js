import React from 'react';
//import PropTypes from 'prop-types'
import {ContentState, EditorState, RichUtils, getDefaultKeyBinding, convertToRaw, convertFromRaw} from 'draft-js'
import Editor, { createEditorStateWithText } from 'draft-js-plugins-editor';
import createUndoPlugin from 'draft-js-undo-plugin';
import createCounterPlugin from 'draft-js-counter-plugin';
import createEmojiPlugin from 'draft-js-emoji-plugin';
//import createHashtagPlugin from 'draft-js-hashtag-plugin';
//import hashtagStyles from './hashtagStyles.css';

//import styles from "../../node_modules/draft-js-emoji-plugin/lib/plugin.css";

const undoPlugin = createUndoPlugin();
const { UndoButton, RedoButton } = undoPlugin;

const counterPlugin = createCounterPlugin();
const { CharCounter, WordCounter, LineCounter } = counterPlugin;

const emojiPlugin = createEmojiPlugin({useNativeArt: true});
const { EmojiSuggestions, EmojiSelect } = emojiPlugin;

//const hashtagPlugin = createHashtagPlugin({ theme: hashtagStyles });


export default class Document extends React.Component {
  constructor(props){
    super(props)
    this.state = {userId: localStorage.getItem('userId'), editorState: null};
    this.onChange = (editorState) => this.setState({editorState});
    // this.handleKeyCommand = this.handleKeyCommand.bind(this)
    // this.toggleBlockType = this.toggleBlockType.bind(this)
    // this.toggleInlineStyle = this.toggleInlineStyle.bind(this)
  }


  componentDidMount() {
    fetch("https://reactive-docs.herokuapp.com/doc/" + this.props.docId)
    .then(res => res.json())
    .then(res => {
      if (res.success) {
        if (res.document.content.length === 0)  {
          this.setState({title: res.document.title, editorState: EditorState.createEmpty()})
        } else {
          let rawContent = res.document.content[0];
          let contentState = convertFromRaw(rawContent);
          this.setState({
            title: res.document.title,
            editorState: EditorState.createWithContent(contentState)
          });
        }
      } else {
        alert(res.error)
      }
    })
  }

  saveDocument() {
    var convertedContent = [ convertToRaw(this.state.editorState.getCurrentContent() ) ];
    fetch("https://reactive-docs.herokuapp.com/doc/" + this.props.docId, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "userId": this.state.userId,
        "content": convertedContent
      }),
    })
    .then(res => res.json())
    .then(res => {
      if (!res.success) {
        alert(res.error)
      }
    })
  }

  // handleKeyCommand(command, editorState) {
  //     const newState = RichUtils.handleKeyCommand(editorState, command);
  //     if (newState) {
  //       this.onChange(newState);
  //       return true;
  //     }
  //     return false;
  //   }

  toggleBlockType(e, blockType){
    e.preventDefault();
    this.onChange(
      RichUtils.toggleBlockType(
        this.state.editorState,
        blockType
      )
    )
  }

  toggleInlineStyle(e, inlineStyle){
    e.preventDefault();
    this.onChange(
      RichUtils.toggleInlineStyle(
        this.state.editorState,
        inlineStyle
      )
    )
  }



//rendering function
  render(){
    if (this.state.editorState === null) {
      return (
        <div>Loading....</div>
        )      
    } else {
      return (
        <div className = "container">
          <h3 style={{textAlign: 'center', color: 'indigo', marginBottom: '20px'}}>Document Title: {this.state.title}</h3>
          <div style={{display: 'flex', justifyContent: 'space-around', marginBottom: "20px"}}>
            <button className="btn btn-success" onClick={() => this.saveDocument()}>Save</button>
            <button className="btn btn-warning" onClick={() => this.props.redirect('Main')}>View All Documents</button>
          </div>
          <div>
            <div style={{display: 'flex', justifyContent: 'space-around', marginBottom: "20px"}}>
              <button className="btn" onMouseDown={(e) => this.toggleInlineStyle(e, 'BOLD')}>BOLD</button>
              <button className="btn" onMouseDown={(e) => this.toggleInlineStyle(e, 'ITALIC')}>Italicize</button>
              <button className="btn" onMouseDown={(e) => this.toggleInlineStyle(e, 'UNDERLINE')}>Underline</button>
              <button className="btn" onMouseDown={(e) => this.toggleInlineStyle(e, 'STRIKETHROUGH')}>Strikethrough</button>


              <button className="btn" onMouseDown={(e) => this.toggleBlockType(e, 'unordered-list-item')}>UL</button>
              <button className="btn" onMouseDown={(e) => this.toggleBlockType(e, 'ordered-list-item')}>OL</button>
              <button className="btn" onMouseDown={(e) => this.toggleBlockType(e, 'blockquote')}>Quote</button>

              <UndoButton className="btn"/>
              <RedoButton className="btn"/>
            </div>

            <div className='textContainer' style={{border: 'solid 1px black', borderRadius: '10px', padding: "20px 20px", minHeight: "500px"}}>
              <Editor
                editorState={this.state.editorState}
                onChange={this.onChange}
                plugins={[undoPlugin, counterPlugin, emojiPlugin]}/>
                <EmojiSuggestions />
            </div>
            <div><CharCounter /> characters | <WordCounter /> words | <LineCounter /> lines</div>
          </div>
        </div>
      )
    }
  }
}

            // <div>
            //    <CharCounter/> characters, <WordCounter /> words, <LineCounter/> lines
            // </div>
            // // 
