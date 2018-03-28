import React from 'react';
import moment from 'moment';

export default class History extends React.Component {
  constructor(props) {
    super(props);
    this.state={history: null}
  }

  // get all previously saved versions of document, including latest autosave
  componentWillMount() {
    fetch("https://reactive-docs.herokuapp.com/doc/" + this.props.docId)
    .then(res => res.json())
    .then(res => {
      if (!res.success) {
        alert(res.error)
      } else {

        this.setState({
          autosave: res.document.autosave,
          history: res.document.content.reverse()
        })
      }
    })
  }

  // render a list of versions with the latest autosave always on top 
  render() {
    if (this.state.history === null) {
      return <div>Loading...</div>
    } else {
      return (
        <div className="list-group"  style={{display: 'flex', justifyContent: 'center', flexDirection: 'column', maxWidth: "50%", margin: "0 auto"}}>
        {
          this.state.autosave ? (<div onClick={() => this.props.openModal(this.state.autosave)}
              className="list-group-item flex-column align-items-start"
            style={{borderRadius: "10px", marginBottom: "10px", border: "1px solid black", display: 'flex', flexDirection: 'column'}}> 
              <div><span style={{color: 'red'}}>Last Autosave:</span></div>
              <div><span style={{textDecoration: 'underline'}}>Title</span>: <span style={{fontWeight: 'bold', color: 'green'}}>{this.state.autosave.title}</span></div>
              <div>Saved on <span style={{fontStyle: 'italic'}}>{moment(new Date(this.state.autosave.saveTime), 'YYYY-MM-DDThh:mm:ss.SSSZ').format("dddd, M/D/YYYY, h:mm:ss a")}</span></div>
            </div>) : null
        }
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