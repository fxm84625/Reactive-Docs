import React from 'react';
//import PropTypes from 'prop-types'
import {ContentState, Editor, EditorState, RichUtils, getDefaultKeyBinding} from 'draft-js'

const BLOCK_TYPES = [
    {label: 'H1', style: 'header-one'},
    {label: 'H2', style: 'header-two'},
    {label: 'H3', style: 'header-three'},
    {label: 'H4', style: 'header-four'},
    {label: 'H5', style: 'header-five'},
    {label: 'H6', style: 'header-six'},
    {label: 'Blockquote', style: 'blockquote'},
    {label: 'UL', style: 'unordered-list-item'},
    {label: 'OL', style: 'ordered-list-item'},
    {label: 'Code Block', style: 'code-block'},
  ];

var INLINE_STYLES = [
  {label: 'Bold', style: 'BOLD'},
  {label: 'Italic', style: 'ITALIC'},
  {label: 'Underline', style: 'UNDERLINE'},
  {label: 'Monospace', style: 'CODE'},
];

export default class Document extends React.Component {
  // constructor(props) {
  //   super(props)
  // }

  // render() {
  //   return (
  //     <div>Hi this is document {this.props.docId}</div>
  //     )
  // }

  constructor(props){
    super(props)
    this.state = {userId: localStorage.getItem('userId'),
                  editorState: EditorState.createEmpty(),
                  document: {}}
    this.onChange = (editorState) => this.setState({editorState})
    this.placeholder = "Type something here!"

    this.handleKeyCommand = this.handleKeyCommand.bind(this)
    this.toggleBlockType = this.toggleBlockType.bind(this)
    this.toggleInlineStyle = this.toggleInlineStyle.bind(this)
  }


  componentWillMount() {
    fetch("https://reactive-docs.herokuapp.com/doc/" + this.props.docId)
    .then(res => res.json())
    .then(res => {
      if (res.success) {
        this.setState({document: res.document})
      } else {
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

  toggleBlockType(blockType){
    this.onChange(
      RichUtils.toggleBlockType(
        this.state.editorState,
        blockType
      )
    )
  }

  toggleInlineStyle(inlineStyle){
    this.onChange(
      RichUtils.toggleInlineStyle(
        this.state.editorState,
        inlineStyle
      )
    )
  }

//rendering function
  render(){
    return (
        <div className = "container">
          <h2><i className="medium material-icons">note_add</i> Horrible Text Editor</h2>

          <h1 style={{textAlign: 'center', color: 'indigo', marginBottom: '50px'}}>Text Editor</h1>
          <h3 style={{textAlign: 'center', color: 'indigo', marginBottom: '50px'}}>Document Title: {this.state.document.title}</h3>

          <div style={{display: 'flex', justifyContent: 'space-around', marginBottom: "40px"}}>
            <button className="btn btn-success btn-lg">Save</button>
            <button className="btn btn-warning btn-lg" onClick={() => this.props.redirect('Main')}>View All Documents</button>
          </div>

          <button className="btn waves-effect waves-light" type="submit" name="action">Save Changes</button>
          <div>
            <ul className="tabs tabsContainer">
              <li className="tab"><a href="#Undo">Undo</a></li>
              <li className="tab"><a href="#Redo">Redo</a></li>
              <li className="tab"><a href="#Font">Font</a></li>
              <li className="tab"><a href="#FontSize">Font Size</a></li>
              <li className="tab"><a href="#Bold">Bold</a></li>
              <li className="tab"><a href="#Italic">Italic</a></li>
              <li className="tab"><a href="#Underline">Underline</a></li>
              <li className="tab"><a href="#Text">Text Color</a></li>
              <li className="tab"><a href="#Highlight">Highlight Color</a></li>
            </ul>
            <div className = 'textContainer'>
              <Editor
                editorState={this.state.editorState}
                onChange={this.onChange}
                placeholder= {this.placeholder}/>
            </div>
          </div>
        </div>
    )
  }
}
