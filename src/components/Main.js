import React from 'react';
import moment from 'moment';
import Modal from 'react-modal';
import createToolbarPlugin, { Separator } from 'draft-js-static-toolbar-plugin';
import {
  ItalicButton,
  BoldButton,
  UnderlineButton,
  CodeButton,
  HeadlineOneButton,
  HeadlineTwoButton,
  HeadlineThreeButton,
  UnorderedListButton,
  OrderedListButton,
  BlockquoteButton,
  CodeBlockButton,
} from 'draft-js-buttons';

export default class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = {userId: localStorage.getItem('userId'), 
      username: localStorage.getItem('username'),
      docList: [],
      modalNewIsOpen: false,
      modalExistingIsOpen: false,
      modalShareIsOpen: false,
      modalDeleteIsOpen: false,
    };
    this.toggleModal = this.toggleModal.bind(this);
  }

  toggleModal(str) {
    if (str === "New") {
      this.setState({modalNewIsOpen: !this.state.modalNewIsOpen})
    } else if (str === 'Existing') {
      this.setState({modalExistingIsOpen: !this.state.modalExistingIsOpen})
    } else if (str === 'Share') {
      this.setState({modalShareIsOpen: !this.state.modalShareIsOpen})
    } else if (str === 'Delete') {
      this.setState({modalDeleteIsOpen: !this.state.modalDeleteIsOpen})
    }

  }

  componentWillMount() {
    fetch("https://reactive-docs.herokuapp.com/user/" + this.state.userId)
    .then(res => res.json())
    .then(res => {
      if (res.success) {
        this.setState({docList: res.docList})
      } else {
        alert(res.error)
      }
    })
  }

  createDocument(e, title, docPass) {
    e.preventDefault();
    if (!docPass) {
      alert('Document password is missing!');
      throw new Error('Password is missing!')
    }
    fetch("https://reactive-docs.herokuapp.com/doc/new", {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "userId": this.state.userId,
        "title": title,
        "password": docPass
      }),
    })
    .then(res => res.json())
    .then(res => {
      if (res.success) {
        //alert('Successfully created new document!');
        this.setState({docTitle: '', docPass: ''});
        this.componentWillMount();
        this.toggleModal('New');
        //this.props.redirect('Document', res.documentId);
      } else {
        alert(res.error)
      }
    })
  }

  addExistingDocument(e, id, docPass) {
    e.preventDefault();
    if (!docPass) {
      alert('Document password is missing!');
      throw new Error('Password is missing!')
    }
    fetch("https://reactive-docs.herokuapp.com/doc/add", {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "userId": this.state.userId,
        "docId": id,
        "password": docPass
      }),
    })
    .then(res => res.json())
    .then(res => {
      if (res.success) {
        //alert('Successfully linked to document!');
        this.setState({docId: '', docPass: ''});
        this.componentWillMount();
        this.toggleModal('Existing');
        //this.props.redirect('Document', res.documentId);
      } else {
        alert(res.error)
      }
    })
  }

  removeDocument() {
    fetch("https://reactive-docs.herokuapp.com/doc/remove", {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "userId": this.state.userId,
        "docId": this.state.docId
      }),
    })
    .then(res => res.json())
    .then(res => {
      if (res.success) {
        this.setState({docId: ''});
        this.componentWillMount();
        this.toggleModal('Delete');
        //this.props.redirect('Document', res.documentId);
      } else {
        alert(res.error)
      }
    })
  }

  render() {
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
      <div>
        <h1 style={{textAlign: 'center', color: 'green', marginBottom: '50px'}}>Welcome, {this.state.username}!</h1>


        <div style={{display: 'flex', justifyContent: 'space-around', marginBottom: "40px"}}>
          <button className="btn btn-success btn-lg" onClick={() => this.toggleModal('New')}>Create New Document</button>
          <button className="btn btn-warning btn-lg" onClick={() => this.toggleModal('Existing')}>Add Existing Document</button>
          <button className="btn btn-danger btn-lg" onClick={() => this.props.redirect('Login')}>Logout</button>
        </div>

        <Modal
          isOpen={this.state.modalNewIsOpen}
          style={customStyles}
          contentLabel="Create New Document"
          ariaHideApp={false}
        >
          <div className="modal-header">
            <h5 className="modal-title">Create New Document</h5>
          </div>
          <div className="modal-body">
            <form style={{minWidth: "50%", margin: "0 auto"}}>
              <div className="form-group">
                <label>Document Title: </label>
                <input type="text" className="form-control" placeholder="title" onChange={(e) => this.setState({docTitle: e.target.value})}/>
              </div>
              <div className="form-group">
                <label>Password: </label>
                <input type="password" className="form-control" placeholder="password (required)" onChange={(e) => this.setState({docPass: e.target.value})}/>
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-success" onClick={(e) => this.createDocument(e, this.state.docTitle, this.state.docPass)}>Create</button>
            <button type="button" className="btn btn-secondary" onClick={() => this.toggleModal('New')}>Close</button>
          </div>
        </Modal>

        <Modal
          isOpen={this.state.modalExistingIsOpen}
          style={customStyles}
          contentLabel="Add Existing Document"
          ariaHideApp={false}
        >
          <div className="modal-header">
            <h5 className="modal-title">Add Existing Document</h5>
          </div>
          <div className="modal-body">
            <form style={{minWidth: "50%", margin: "0 auto"}}>
              <div className="form-group">
                <label>Document ID: </label>
                <input type="text" className="form-control" placeholder="Document ID" onChange={(e) => this.setState({docId: e.target.value})}/>
              </div>
              <div className="form-group">
                <label>Password: </label>
                <input type="password" className="form-control" placeholder="Password (required)" onChange={(e) => this.setState({docPass: e.target.value})}/>
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-warning" onClick={(e) => this.addExistingDocument(e, this.state.docId, this.state.docPass)}>Add</button>
            <button type="button" className="btn btn-secondary" onClick={() => this.toggleModal('Existing')}>Close</button>
          </div>
        </Modal>

        <Modal
          isOpen={this.state.modalShareIsOpen}
          style={customStyles}
          contentLabel="Share Document"
          ariaHideApp={false}
        >
          <div className="modal-header">
            <h5 className="modal-title">Share the document ID below: </h5>
          </div>
          <div className="modal-body">
            <form style={{minWidth: "50%", margin: "0 auto"}}>
              <div className="form-group">
                <h5>{this.state.docId}</h5>
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => this.toggleModal('Share')}>Close</button>
          </div>
        </Modal>

        <Modal
          isOpen={this.state.modalDeleteIsOpen}
          style={customStyles}
          contentLabel="Delete/Unlink Document"
          ariaHideApp={false}
        >
          <div className="modal-header">
            <h3 className="modal-title">Are you sure you want to remove this document?</h3>
          </div>
          <div className="modal-body">
            <form style={{minWidth: "50%", margin: "0 auto"}}>
              <div className="form-group">
                <h5>Only owner can delete document permanently. Collborators can only unlink.</h5>
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-danger" onClick={() => this.removeDocument()}>Yes</button>
            <button type="button" className="btn btn-secondary" onClick={() => this.toggleModal('Delete')}>No</button>
          </div>
        </Modal>

        <div className="list-group"  style={{display: 'flex', justifyContent: 'center', flexDirection: 'column', maxWidth: "70%", margin: "0 auto"}}>
          {this.state.docList.map((doc, i) => (

            <a key={i} href="#" className="list-group-item flex-column align-items-start"
            style={{borderRadius: "10px", marginBottom: "10px", border: "1px solid black", display: 'flex'}}>
              <div style={{minWidth: "80%", maxWidth: "80%", display: 'flex'}} onClick={(e) => this.props.redirect("Document", doc._id, doc.title)}>
                <div style={{display: 'flex', alignItems: "center"}}>
                  <img src="https://cdn2.iconfinder.com/data/icons/social-media-8/128/note3.png" height="100px" width="100px"/>
                </div>
                <div style={{marginLeft: "30px"}}>
                  <h3 style={{color: 'blue'}} className="mb-1">{doc.title}</h3>
                  <h5>Created by <span style={{fontWeight: 'bold', textDecoration: 'underline'}}>{doc.owner.username}</span> on: {moment(new Date(doc.createdTime), 'YYYY-MM-DDThh:mm:ss.SSSZ').format("dddd, M/D/YYYY, h:mm:ss a")}</h5>
                  <h5>Last edited on: {moment(new Date(doc.lastEditTime), 'YYYY-MM-DDThh:mm:ss.SSSZ').format("dddd, M/D/YYYY, h:mm:ss a")}</h5>
                  <h5>Collaborators: {doc.collaboratorList.map((person, i) => (i === 0 ? person.username : ", " + person.username))}</h5>
                </div>
              </div>
              <div style={{minWidth: "10%", display: 'flex', flexDirection: 'column', margin: "auto" }}>
                <button className="btn btn-warning" 
                        style={{maxWidth: "70px", margin: "5px 5px"}} 
                        onClick={() => {this.toggleModal('Share'); this.setState({docId: doc._id})}}>Share</button>
                <button className="btn btn-danger"
                        style={{maxWidth: "70px", margin: "5px 5px"}}
                        onClick={() => {this.toggleModal('Delete'); this.setState({docId: doc._id})}}>
                {doc.owner._id == this.state.userId ? 'Delete' : 'Unlink'}
                </button>
              </div>
            </a>
            )
          )}
        </div>
      </div>
    )
  }
}