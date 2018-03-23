import React from 'react';
import moment from 'moment';
import Modal from 'react-modal';
import {Editor, EditorState, convertFromRaw} from 'draft-js';

export default class History extends React.Component {
  constructor(props) {
    super(props);
    this.state={history: null}
  }

  componentWillMount() {
    fetch("https://reactive-docs.herokuapp.com/doc/" + this.props.docId)
    .then(res => res.json())
    .then(res => {
      if (!res.success) {
        alert(res.error)
      } else {
        this.setState({history: res.document.content.reverse()})
      }
    })
  }

  render() {
    if (this.state.history === null) {
      return <div>Loading...</div>
    } else {
      return (
        <div className="list-group"  style={{display: 'flex', justifyContent: 'center', flexDirection: 'column', maxWidth: "50%", margin: "0 auto"}}>
        {
          this.state.history.map( ( historyObj, i ) => 
            (<div key={i} onClick={() => this.props.openModal(historyObj)}
              className="list-group-item flex-column align-items-start"
            style={{borderRadius: "10px", marginBottom: "10px", border: "1px solid black", display: 'flex', flexDirection: 'column'}}> 
              <div><span style={{textDecoration: 'underline'}}>Title</span>: <span style={{fontWeight: 'bold', color: 'green'}}>{historyObj.title}</span></div>
              <div>Saved on <span style={{fontStyle: 'italic'}}>{moment(new Date(historyObj.saveTime), 'YYYY-MM-DDThh:mm:ss.SSSZ').format("dddd, M/D/YYYY, h:mm:ss a")}</span> by <span style={{fontWeight: 'bold', color: 'blue'}}>{historyObj.username}</span></div>
            </div>)
          )
        }
        </div>
      )
    }
  }
}