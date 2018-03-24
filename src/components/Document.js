import React from 'react';
import {ContentState, EditorState, RichUtils, getDefaultKeyBinding, convertToRaw, convertFromRaw, Modifier, KeyBindingUtil} from 'draft-js';
import SelectionState from './SelectionState.js';
import Editor, { createEditorStateWithText } from 'draft-js-plugins-editor';
import createUndoPlugin from 'draft-js-undo-plugin';
import createCounterPlugin from 'draft-js-counter-plugin';
// import createEmojiPlugin from 'draft-js-emoji-plugin';
import ColorPicker, { colorPickerPlugin } from 'draft-js-color-picker';
import io from 'socket.io-client';
import History from './History';
import Modal from 'react-modal';
import moment from 'moment';

const undoPlugin = createUndoPlugin();
const { UndoButton, RedoButton } = undoPlugin;

const counterPlugin = createCounterPlugin();
const { CharCounter, WordCounter, LineCounter } = counterPlugin;

//const emojiPlugin = createEmojiPlugin({useNativeArt: true});
//const { EmojiSuggestions, EmojiSelect } = emojiPlugin;

const {hasCommandModifier} = KeyBindingUtil;

const styleMap = {
  'UPPERCASE': {
    textTransform: 'uppercase',
  },
  'LOWERCASE': {
    textTransform: 'lowercase',
  },
  'SUBSCRIPT': { 
    fontSize: '0.6em',
    verticalAlign: 'sub' 
  },
  'SUPERSCRIPT': { 
    fontSize: '0.6em', 
    verticalAlign: 'super' 
  }
}

var userColorArray = [ '#ff9999', '#ff9933', '#99ff66', '#99ffcc', '#cc99ff' ];
                    // pink,      orange,    green,     blue,      purple
userColorArray.forEach( color => {
  styleMap[ "HIGHLIGHT"+color ] = {
    backgroundColor: color
  }
  styleMap[ "CURSOR"+color ] = {
    borderRight: "5px solid "+color
  }
});

var fontSizeArray = [8,10,12,14,16,18,20,24,28,32,36,48,72];
fontSizeArray.forEach( fontSize => {
  styleMap[ "FONT-SIZE-"+fontSize ] = {
    fontSize: fontSize+'px'
  };
});

var fontFamilyArray = ['Arial', 'Helvetica', 'Tahoma', 'Lucida Sans Unicode', 'Times New Roman', 'Courier New','Palatino', 'Garamond', 'Bookman', 'Verdana', 'Georgia', 'Comic Sans MS', 'Trebuchet MS', 'Impact'];

fontFamilyArray.forEach(font => {
  styleMap["FONT-FAMILY-"+font] = {
    fontFamily: font
  }
})

const getBlockStyle = (block) => {
    switch (block.getType()) {
        case 'left':
            return 'align-left';
        case 'center':
            return 'align-center';
        case 'right':
            return 'align-right';
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

// function editorIsHighlighted( editorState ) {
//   const selection = editorState.getSelection();
//   const start = selection.getStartOffset();
//   const end = selection.getEndOffset();
//   return start !== end;
// };
function selectionIsHighlighted( selectionState ) {
  const start = selectionState.getStartOffset();
  const end = selectionState.getEndOffset();
  return start !== end;
}

function myKeyBindingFn(e) {
  return getDefaultKeyBinding(e);
}

export default class Document extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      userId: localStorage.getItem('userId'),
      username: localStorage.getItem('username'),
      editorState: null,
      showHistory: false,
      modalHistoryIsOn: false,
      title: this.props.docTitle,
      titleFocus: false
    };

    this.socket = io( "https://reactive-docs.herokuapp.com/" );

    this.onChange = (editorState) => {
      let currentContent = editorState.getCurrentContent()
      const currentSelection = editorState.getSelection()
      const firstBlock = currentContent.getFirstBlock()
      const lastBlock = currentContent.getLastBlock()
      const allSelection = SelectionState.createEmpty(firstBlock.getKey()).merge({
        focusKey: lastBlock.getKey(),
        focusOffset: lastBlock.getLength(),
      })

      this.selectionObj[ this.color ] = currentSelection;

      for( var color in this.selectionObj ) {
        // Clear all Highlighs for the entire document for each User's color
        var userSelection = SelectionState.createWithObj( this.selectionObj[ color ] );
        currentContent = Modifier.removeInlineStyle(currentContent, allSelection, 'HIGHLIGHT'+color);
        //currentContent = Modifier.removeInlineStyle(currentContent, allSelection, 'CURSOR'+color);
        // Highlight the User's selection with their Highlight Color
        if( selectionIsHighlighted( userSelection ) ) currentContent = Modifier.applyInlineStyle(currentContent, userSelection, 'HIGHLIGHT'+color);
        //else currentContent = Modifier.applyInlineStyle(currentContent, userSelection, 'CURSOR'+color);
        editorState = EditorState.createWithContent(currentContent);
      }

      if( !this.state.titleFocus ) editorState = EditorState.forceSelection(editorState, currentSelection)

      // Save EditorState, then send an update event the server
      this.setState({editorState}, () => {
        if( this.editorToken ) { this.editorToken = false; return; }
        var dataObj = {
          content: convertToRaw(this.state.editorState.getCurrentContent()),
          token: this.state.userId,
          docId: this.props.docId,
          userColor: this.color,
          selectionObj: this.selectionObj,
          title: this.state.title,
        }
        this.socket.emit('editDoc', dataObj );
      });
     this.handleKeyCommand = this.handleKeyCommand.bind(this)
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
      this.selectionObj = ack.selectionObj || {};
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
      const { content, token, selectionObj, title} = data
      if( String(this.state.userId) === String(token) ) return;
      this.editorToken = true;
      let newContent = EditorState.createWithContent(convertFromRaw(content));
      this.selectionObj = selectionObj || {};
      this.setState({ editorState: newContent, title });
    })

    this.socket.on( 'updateTitle', data => {
      const { title } = data;
      this.setState({ title });
    });

    this.socket.on( 'autosave', () => {
      var convertedContent = convertToRaw(this.state.editorState.getCurrentContent() );
      fetch("https://reactive-docs.herokuapp.com/doc/autosave/" + this.props.docId, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "content": convertedContent,
          "title": this.state.title
        }),
      })
      .then(res => res.json())
      .then(res => {
        if (!res.success) {
          alert(res.error)
        }
      })
    });
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
        "title": this.state.title
      }),
    })
    .then(res => res.json())
    .then(res => {
      if (!res.success) {
        alert(res.error)
      }
    })
  }

  handleKeyCommand(command, editorState) {
      const newState = RichUtils.handleKeyCommand(editorState, command);
      if (newState) {
        this.onChange(newState);
        return true;
      }
      return false;
    }

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

  onTitleChange(e) {
    e.preventDefault();
    this.setState({title: e.target.value});
    var dataObj = {
      docId: this.props.docId,
      title: this.state.title,
    }
    this.socket.emit('editTitle', dataObj );
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
          <div style={{display: 'flex', justifyContent: 'center'}}>
            <input type='text' style={{marginTop: '15px', borderRadius: '5px', textAlign: 'center', color: 'indigo', fontSize: '32px', marginBottom: '20px'}} 
                   onBlur={(e) => this.setState({titleFocus: false})}
                   onClick={(e) => this.setState({titleFocus: true})}
                   onChange={(e) => this.onTitleChange(e)} value={this.state.title} />
          </div>

          <h5 style={{textAlign: 'center', color: 'blue', marginBottom: '20px'}}>ID: {this.props.docId}</h5>

          <div style={{display: 'flex', justifyContent: 'space-around', marginBottom: "20px"}}>
            <button className="btn btn-success" onClick={() => this.saveDocument()}>Save</button>
            <button className="btn btn-danger" onClick={() => this.setState({editorState: EditorState.push(this.state.editorState, ContentState.createFromText(''))})}>CLEAR ALL</button>
            <button className="btn btn-warning" onClick={() => {this.props.redirect('Main')}}>View All Documents</button>
          </div>

          <div className='textContainer' style={{border: 'solid 1px black', padding: "0 20px", minHeight: "500px"}} onClick={this.state.editorState.focus}>
            <div id="toolbar" style={{display: 'flex', justifyContent: 'flex-start', marginBottom: "20px", borderBottom: '1px solid black', flexWrap: "wrap"}}>
              <div className="dropdown">
                <button className="btn btn-default" style={{minHeight: '100%'}}>Font  <span className="caret"></span></button>
                <div className="dropdown-content">
                {fontFamilyArray.map(font => (
                  <a href="#" onClick={(e) => this.toggleInlineStyle(e, 'FONT-FAMILY-' + font)} style={{padding: '5px'}}>{font}</a>
                  ))}
                </div>
              </div>

              <div className="dropdown">
                <button className="btn btn-default" style={{minHeight: '100%'}}>Font Size  <span className="caret"></span></button>
                <div className="dropdown-content">
                {fontSizeArray.map(size => (
                  <a href="#" onClick={(e) => this.toggleInlineStyle(e, 'FONT-SIZE-' + size)} style={{padding: '5px'}}>{size}</a>
                  ))}
                </div>
              </div>
              <div className="btn btn-default" style={{ display: 'flex', alignItems: 'center', height: "100%" }}>
                <ColorPicker
                  toggleColor={color => this.picker.addColor(color)}
                  presetColors={presetColors}
                  color={this.picker.currentColor(editorState)}
                />
              </div>
              <button className="btn btn-default" onMouseDown={(e) => this.toggleInlineStyle(e, 'BOLD')}><span style={{fontWeight: 'bold'}}>B</span></button>
              <button className="btn btn-default" onMouseDown={(e) => this.toggleInlineStyle(e, 'ITALIC')}><span style={{fontStyle: 'italic'}}>I</span></button>
              <button className="btn btn-default" onMouseDown={(e) => this.toggleInlineStyle(e, 'UNDERLINE')}><span style={{textDecoration: 'underline'}}>U</span></button>
              <button className="btn btn-default" onMouseDown={(e) => this.toggleInlineStyle(e, 'STRIKETHROUGH')}><span style={{textDecoration: 'line-through'}}>ABC</span></button>

              <button className="btn btn-default" onMouseDown={(e) => this.toggleInlineStyle(e, 'UPPERCASE')}>ABC</button>
              <button className="btn btn-default" onMouseDown={(e) => this.toggleInlineStyle(e, 'LOWERCASE')}>xyz</button>

              <button className="btn btn-default" onMouseDown={(e) => this.toggleInlineStyle(e, 'SUPERSCRIPT')}>X<span style={{verticalAlign: 'sub'}}>2</span></button>
              <button className="btn btn-default" onMouseDown={(e) => this.toggleInlineStyle(e, 'SUBSCRIPT')}>X<span style={{verticalAlign: 'super'}}>2</span></button>

              <button className="btn btn-default" onMouseDown={(e) => this.toggleBlockType(e, 'unordered-list-item')}><i className="fa fa-list-ul" style={{fontSize:"20px"}}></i></button>
              <button className="btn btn-default" onMouseDown={(e) => this.toggleBlockType(e, 'ordered-list-item')}><i className="fa fa-list-ol" style={{fontSize: "20px"}}></i></button>
              <button className="btn btn-default" onMouseDown={(e) => this.toggleBlockType(e, 'blockquote')}><i className="fa fa-quote-right" style={{fontSize: "20px"}}></i></button>

              <button className="btn btn-default" onMouseDown={(e) => this.toggleBlockType(e, 'left')}><span className="glyphicon glyphicon-align-left"></span></button>
              <button className="btn btn-default" onMouseDown={(e) => this.toggleBlockType(e, 'center')}><span className="glyphicon glyphicon-align-center"></span></button>
              <button className="btn btn-default" onMouseDown={(e) => this.toggleBlockType(e, 'right')}><span className="glyphicon glyphicon-align-right"></span></button>

              <UndoButton className="btn btn-default"/>
              <RedoButton className="btn btn-default"/>
            </div>

            <Editor
              customStyleMap={styleMap}
              blockStyleFn={getBlockStyle}
              customStyleFn={this.picker.customStyleFn}
              editorState={this.state.editorState}
              onChange={(editorState) => this.onChange(editorState)}
              plugins={[undoPlugin, counterPlugin]}
              handleKeyCommand={this.handleKeyCommand} 
              keyBindingFn={myKeyBindingFn}
            />
          </div>

          <div style={{display: 'flex', justifyContent: 'flex-end'}}>
            <div><CharCounter /> characters | <WordCounter /> words | <LineCounter /> lines</div>
          </div>

          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: "20px"}}>
            <button className='btn btn-primary' 
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
                    onChange={() => {}}
                    readOnly={true} />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <div style={{marginBottom: '20px'}}>Saved on {moment(new Date(this.docHistoryInfo.saveTime), 'YYYY-MM-DDThh:mm:ss.SSSZ').format("dddd, M/D/YYYY, h:mm:ss a")} { this.docHistoryInfo.username ? "by " + this.docHistoryInfo.username : ''}</div>
              <button type="button" className="btn btn-secondary" onClick={() => this.closeModal()}>Close</button>
            </div>
          </Modal>
        </div>
      )
    }
  }
}
