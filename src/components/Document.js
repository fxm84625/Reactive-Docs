import React from 'react';
import {ContentState, EditorState, RichUtils, getDefaultKeyBinding, convertToRaw, convertFromRaw} from 'draft-js';
import SelectionState from './SelectionState.js';
import Editor, { createEditorStateWithText } from 'draft-js-plugins-editor';
import createUndoPlugin from 'draft-js-undo-plugin';
import createCounterPlugin from 'draft-js-counter-plugin';
//import createEmojiPlugin from 'draft-js-emoji-plugin';
import ColorPicker, { colorPickerPlugin } from 'draft-js-color-picker';
import io from 'socket.io-client';
import History from './History';
import Modal from 'react-modal';
import moment from 'moment';

//import { stateToHTML } from 'draft-js-export-html';
//import styles from "../../node_modules/draft-js-emoji-plugin/lib/plugin.css";

// const positionSuggestions = ({ state, props }) => {
//   return {};
// };

const undoPlugin = createUndoPlugin();
const { UndoButton, RedoButton } = undoPlugin;

const counterPlugin = createCounterPlugin();
const { CharCounter, WordCounter, LineCounter } = counterPlugin;

// const emojiPlugin = createEmojiPlugin({useNativeArt: true, positionSuggestions: positionSuggestions});
// const { EmojiSuggestions, EmojiSelect } = emojiPlugin;

const styleMap = {
  'UPPERCASE': {
    textTransform: 'uppercase',
  },
  'LOWERCASE': {
    textTransform: 'lowercase',
  },
  'TRANSPARENT':  {
    background: 'none'
  },
  //pink
  'HIGHLIGHT#ff9999': {
    backgroundColor: '#ff9999'
  },
  // orange
  'HIGHLIGHT#ff9933': {
    backgroundColor: '#ff9933'
  },
  // green
  'HIGHLIGHT#99ff66': {
    backgroundColor: '#99ff66'
  },
  // blue
  'HIGHLIGHT#99ffcc': {
    backgroundColor: '#99ffcc'
  },
  // purple
  'HIGHLIGHT#cc99ff': {
    backgroundColor: '#cc99ff'
  },
  // 'HIGHLIGHT': {
  //   backgroundColor: "red"
  // }
}

const getBlockStyle = (block) => {
    switch (block.getType()) {
        case 'left':
            return 'align-left';
        case 'center':
            return 'align-center';
        case 'right':
            return 'align-right';
        // case 'transparent':
        //     return 'background-transparent';
        // case 'HIGHLIGHT#ff9999': 
        //     return 'background-ff9999';
        // case 'HIGHLIGHT#ff9933': 
        //     return 'background-ff9933';
        // case 'HIGHLIGHT#99ff66': 
        //     return 'background-99ff66';
        // case 'HIGHLIGHT#99ffcc': 
        //     return 'background-99ffcc';
        // case 'HIGHLIGHT#cc99ff': 
        //     return 'background-cc99ff';
        default:
            return null;
    }   
}

const presetColors = [
  '#ff0000',
  '#F5A623',
  '#F8E71C',
  '#8B572A',
  '#7ED321',
  '#417505',
  '#BD10E0',
  '#9013FE',
  '#4A90E2',
  '#50E3C2',
  '#B8E986',
  '#000000',
  '#4A4A4A',
  '#9B9B9B',
  '#FFFFFF',
];

function setHighLightColor (color) {
  styleMap.HIGHLIGHT.backgroundColor = color
}

export default class Document extends React.Component {
  constructor(props){
    super(props)
    this.state = {userId: localStorage.getItem('userId'), username: localStorage.getItem('username'), editorState: null, showHistory: false,  modalHistoryIsOn: false};

    this.socket = io( "https://reactive-docs.herokuapp.com/" );
    
    this.isHighlighted = (editorState) => {
      const selection = editorState.getSelection();
      // console.log('Selection', selection)
      const start = selection.getStartOffset();
      // console.log('Start', start)
      const end = selection.getEndOffset();
      // console.log('End', end)
      return start !== end;
    };

    this.onChange = (editorState) => {
      // var currentSelection = editorState.getSelection();
      // // console.log(currentSelection.serialize());

      // this.selectionObj[ this.color ] = currentSelection;

      // // Handle each User's selection highlights
      // for( var color in this.selectionObj ) {
      //   var userSelection = SelectionState.createWithObj( this.selectionObj[ color ] );
      //   // if( !this.isHighlighted( editorState ) ) {
      //     if( this.prevSelectionObj[ color ] ) {
      //       var prevSelection = SelectionState.createWithObj( this.prevSelectionObj[ color ] );
      //       editorState = EditorState.forceSelection(editorState, prevSelection );
      //       editorState = RichUtils.toggleInlineStyle(editorState, 'TRANSPARENT');
      //     }
      //     else {
      //       this.prevSelectionObj[ color ] = this.selectionObj[ color ];
      //     }
      //   // } else {
      //     editorState = EditorState.forceSelection(editorState, userSelection );
      //     editorState = RichUtils.toggleInlineStyle(editorState, 'HIGHLIGHT' + color);
      //   // }
      // }
      // this.prevSelectionObj[ this.color ] = editorState.getSelection();

      //Handle User's current selection highlight
     
        // if (!this.isHighlighted(editorState)) {
        //   editorState = EditorState.forceSelection(editorState, this.lastSelect);
        //   editorState = RichUtils.toggleInlineStyle(editorState, 'TRANSPARENT');
        //   editorState = EditorState.forceSelection(editorState, currentSelection);
        // } else {
        //   editorState = EditorState.forceSelection(editorState, currentSelection);
        if (this.isHighlighted(editorState)) editorState = RichUtils.toggleInlineStyle(editorState, 'HIGHLIGHT' + this.color);
        //}
    
      // this.lastSelect = editorState.getSelection();
      // if( !this.selectionObj ) this.selectionObj = {};
      // this.selectionObj[ this.color ] = this.lastSelect;

      // Save EditorState, then send an update event the server
      this.setState({editorState}, () => {
        if( this.editorToken ) { this.editorToken = false; return; }
        var dataObj = {
          content: convertToRaw(this.state.editorState.getCurrentContent()),
          token: this.state.userId,
          docId: this.props.docId,
          userColor: this.color,
          selectionObj: this.selectionObj,
          prevSelectionObj: this.prevSelectionObj
        }
        this.socket.emit('editDoc', dataObj );
      });
     //this.handleKeyCommand = this.handleKeyCommand.bind(this)
    }

    this.getEditorState = () => this.state.editorState;
    this.picker = colorPickerPlugin(this.onChange, this.getEditorState);
    this.historyEditorState = null;
    this.docHistoryInfo = {title: null, saveTime: null, username: null}

  }

  componentDidMount() {
    this.socket.emit('openDoc', {docId: this.props.docId, userId: this.state.userId}, (ack) => {
      if(!ack) console.error('Error joining document!')
      if( ack.error ) {
        alert( ack.error );
        return;
      }
      this.color = ack.color;
      // this.selectionObj = ack.selectionObj || {};
      // this.prevSelectionObj = ack.prevSelectionObj || {};
      if(typeof ack.content !== 'string') {
        this.setState({
          editorState:EditorState.createWithContent(convertFromRaw(ack.content))
        })
      } else {
        fetch("https://reactive-docs.herokuapp.com/doc/" + this.props.docId)
        .then(res => res.json())
        .then(res => {
          if (res.success) {
            if (res.document.content.length === 0)  {
              this.setState({editorState: EditorState.createEmpty()})
            } else {
              let rawContent = res.document.content[ res.document.content.length - 1 ].editorState;
              let contentState = convertFromRaw(rawContent);
              this.setState({
                editorState: EditorState.createWithContent(contentState)
              });
            }
          } else {
            alert(res.error)
          }
        })
      }
    })

    this.socket.on('updateDoc', (data) => {
      const { content, token, selectionObj, prevSelectionObj } = data
      if( String(this.state.userId) === String(token) ) return;
      this.editorToken = true;
      let newContent = EditorState.createWithContent(convertFromRaw(content));
      // this.selectionObj = selectionObj || {};
      // this.prevSelectionObj = prevSelectionObj || {};
      this.setState({ editorState: newContent });
    })
  }

  saveDocument() {
    var convertedContent = convertToRaw(this.state.editorState.getCurrentContent() );
    fetch("https://reactive-docs.herokuapp.com/doc/" + this.props.docId, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "username": this.state.username,
        "content": convertedContent,
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

  toggleDocumentHistory(e) {
    e.preventDefault();
    this.showHistory = !this.showHistory;
  }

  componentWillUnmount() {
    this.socket.emit('closeDoc', {docId: this.props.docId, userColor: this.color});
    this.socket.off('updateDoc');
  }

  openModal(historyObj) {
    let {saveTime, username, title} = historyObj;
    this.docHistoryInfo = {saveTime, username, title};
    this.historyEditorState = EditorState.createWithContent(convertFromRaw(historyObj.editorState));
    this.setState({modalHistoryIsOn: true});
  } 

  closeModal() {
    this.setState({modalHistoryIsOn: false});
    this.historyEditorState = null;
    this.docHistoryInfo = {};
  }

//rendering function
  render(){
    if (this.state.editorState === null) {
      return (
        <div>Loading....</div>
        )      
    } else {
      const { editorState } = this.state;
      const inlineStyles = this.picker.exporter(editorState);
      //const html = stateToHTML(this.state.editorState.getCurrentContent(), { inlineStyles });
      const customStyles = {
        content : {
          top                   : '50%',
          left                  : '50%',
          right                 : 'auto',
          bottom                : 'auto',
          marginRight           : '-50%',
          transform             : 'translate(-50%, -50%)'
        }
      };
      return (
        <div className = "container">
          <h3 style={{textAlign: 'center', color: 'indigo', marginBottom: '20px'}}>Document Title: {this.props.docTitle}</h3>
          <h5 style={{textAlign: 'center', color: 'blue', marginBottom: '20px'}}>ID: {this.props.docId}</h5>
          <div style={{display: 'flex', justifyContent: 'space-around', marginBottom: "20px"}}>
            <button className="btn btn-success" onClick={() => this.saveDocument()}>Save</button>
            <button className="btn btn-warning" onClick={() => {this.props.redirect('Main')}}>View All Documents</button>
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
            <div style={{display: 'flex', justifyContent: 'space-around', marginBottom: "20px"}}>
              <button className="btn" onMouseDown={(e) => this.toggleBlockType(e, 'header-one')}>H1</button>
              <button className="btn" onMouseDown={(e) => this.toggleBlockType(e, 'header-two')}>H2</button>
              <button className="btn" onMouseDown={(e) => this.toggleBlockType(e, 'header-three')}>H3</button>
              <button className="btn" onMouseDown={(e) => this.toggleBlockType(e, 'header-four')}>H4</button>
              <button className="btn" onMouseDown={(e) => this.toggleBlockType(e, 'header-five')}>H5</button>
              <button className="btn" onMouseDown={(e) => this.toggleBlockType(e, 'header-six')}>H6</button>

              <button className="btn" onMouseDown={(e) => this.toggleInlineStyle(e, 'UPPERCASE')}>UPPERCASE</button>
              <button className="btn" onMouseDown={(e) => this.toggleInlineStyle(e, 'LOWERCASE')}>lowercase</button>

              <ColorPicker
                toggleColor={color => this.picker.addColor(color)}
                presetColors={presetColors}
                color={this.picker.currentColor(editorState)}
              />
              <button onClick={this.picker.removeColor}>clear</button>
            </div>

            <div style={{display: 'flex', justifyContent: 'space-around', marginBottom: "20px"}}>
              <button className="btn" onMouseDown={(e) => this.toggleBlockType(e, 'left')}>LEFT</button>
              <button className="btn" onMouseDown={(e) => this.toggleBlockType(e, 'center')}>CENTER</button>
              <button className="btn" onMouseDown={(e) => this.toggleBlockType(e, 'right')}>RIGHT</button>
            </div>

            <div className='textContainer' style={{border: 'solid 1px black', borderRadius: '10px', padding: "20px 20px", minHeight: "500px"}}>
              <Editor
                customStyleMap={styleMap}
                blockStyleFn={getBlockStyle}
                customStyleFn={this.picker.customStyleFn}
                editorState={this.state.editorState}
                onChange={(editorState) => this.onChange(editorState)}
                readOnly={this.state.readOnly}
                plugins={[undoPlugin, counterPlugin]}/>
                
            </div>
            <div style={{display: 'block'}}><CharCounter /> characters | <WordCounter /> words | <LineCounter /> lines</div>
          </div>

          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: "20px"}}>
            <button className='btn btn-secondary' 
                    onClick={() => this.setState({showHistory: !this.state.showHistory})}
                    style={{maxWidth: '200px', marginBottom: "20px"}}>View History</button>
            {this.state.showHistory ? <History docId={this.props.docId} openModal={this.openModal.bind(this)}/> : null }
          </div>

          <Modal
            isOpen={this.state.modalHistoryIsOn}
            style={customStyles}
            contentLabel="Document History"
            ariaHideApp={false}
          >
            <div className="modal-header">
              <h3 className="modal-title">{this.docHistoryInfo.title}</h3>
            </div>
            <div className="modal-body">
              <form style={{minWidth: "50%", margin: "0 auto"}}>
                <div className="form-group">
                  <Editor
                    customStyleMap={styleMap}
                    blockStyleFn={getBlockStyle}
                    customStyleFn={this.picker.customStyleFn}
                    editorState={this.historyEditorState}
                    onChange={null}
                    readOnly={true}
                    />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <div>Saved on {moment(new Date(this.docHistoryInfo.saveTime), 'YYYY-MM-DDThh:mm:ss.SSSZ').format("dddd, M/D/YYYY, h:mm:ss a")} by {this.docHistoryInfo.username}</div>
              <button type="button" className="btn btn-secondary" onClick={() => this.closeModal()}>Close</button>
            </div>
          </Modal>
        </div>
      )
    }
  }
}
