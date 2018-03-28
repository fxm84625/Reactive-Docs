import React from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Main from './components/Main';
import Document from './components/Document';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {currentPage: 'Login'};
    this.redirect = this.redirect.bind(this);
  }

  //decides which component to render
  redirect(page, documentId, documentTitle) {
    this.setState({currentPage: page});
    if (documentId && documentTitle) this.setState({documentId: documentId, documentTitle: documentTitle})
  }

  //App begins in login page by default
  render() {
    return (
      <div>
        {this.state.currentPage === 'Login' ? <Login redirect={this.redirect}/> : null}
        {this.state.currentPage === 'Register' ? <Register redirect={this.redirect}/> : null}
        {this.state.currentPage === 'Main' ? <Main redirect={this.redirect}/> : null}
        {this.state.currentPage === 'Document' ? <Document redirect={this.redirect} docId={this.state.documentId} docTitle={this.state.documentTitle} /> : null}
      </div>);
  }
}



