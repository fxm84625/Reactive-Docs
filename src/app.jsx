import React from 'react';
//import {Link, Route, BrowserRouter as Router} from 'react-router-dom';
import moment from 'moment';
import Modal from 'react-modal';

import Login from './components/Login';
import Register from './components/Register';
import Main from './components/Main';
import Document from './components/Document';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {currentPage: 'Login'};
  }

  redirect(page, documentId) {
    this.setState({currentPage: page});
    if (documentId) this.setState({documentId: documentId})
  }

  render() {
    return (
      <div>
        {this.state.currentPage === 'Login' ? <Login redirect={this.redirect.bind(this)}/> : null}
        {this.state.currentPage === 'Register' ? <Register redirect={this.redirect.bind(this)}/> : null}
        {this.state.currentPage === 'Main' ? <Main redirect={this.redirect.bind(this)}/> : null}
        {this.state.currentPage === 'Document' ? <Document redirect={this.redirect.bind(this)} docId={this.state.documentId} /> : null}
      </div>);
  }
}



