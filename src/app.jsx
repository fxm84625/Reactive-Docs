import React from 'react';
import {Link, Route, BrowserRouter as Router} from 'react-router-dom';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {currentPage: 'Login'};
  }

  redirect(page, documentId) {
    this.setState({currentPage: page});
    if (documentId) this.setState({documentId: documentId})
  }

  login(e, username, password) {
    e.preventDefault();
    fetch("https://reactive-docs.herokuapp.com/login", {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "username": username,
        "password": password
      }),
    })
    .then(res => res.json())
    .then(res => {
      if (res.success) {
        alert('Successfully logged in!')
        localStorage.setItem('userId', res.userId);
        localStorage.setItem('username', username);
        this.setState({currentPage : 'Main'})
      } else {
        alert(res.error)
      }
    })
  }

  register(e, username, password) {
    e.preventDefault();
    fetch("https://reactive-docs.herokuapp.com/register", {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "username": username,
        "password": password
      }),
    })
    .then(res => res.json())
    .then(res => {
      if (res.success) {
        alert('Successfully registered!');
        this.setState({currentPage: 'Login'});
      } else {
        alert(res.error)
      }
    })
  }

  render() {
    return (
      <div>
        {this.state.currentPage === 'Login' ? <Login redirect={this.redirect.bind(this)} login={this.login.bind(this)} /> : null}
        {this.state.currentPage === 'Register' ? <Register redirect={this.redirect.bind(this)} register={this.register.bind(this)} /> : null}
        {this.state.currentPage === 'Main' ? <Main redirect={this.redirect.bind(this)}/> : null}
        {this.state.currentPage === 'Document' ? <Document redirect={this.redirect.bind(this)} docId={this.state.documentId} /> : null}
      </div>);
  }
}

class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state={username: 'brian', password: '123456'}
  }
  render() {
    return (
      <div style={{display: 'flex', justifyContent: 'center', flexDirection: 'column'}}>
        <h1 style={{textAlign: 'center', color: 'blue', marginBottom: '100px'}}>Welcome to Doodle Docz!</h1>
        <form style={{minWidth: "50%", margin: "0 auto"}}>
          <div className="form-group">
            <label>Username: </label>
            <input type="email" className="form-control" placeholder="Username" value={this.state.username} onChange={(e) => this.setState({username: e.target.value})}/>
          </div>
          <div className="form-group">
            <label >Password: </label>
            <input type="password" className="form-control" placeholder="Password" value={this.state.password} onChange={(e) => this.setState({password: e.target.value})}/>
          </div>
          <button style={{minWidth: "100%"}} type="submit" className="btn btn-primary" onClick={e => this.props.login(e, this.state.username, this.state.password)}>Login</button>
        </form>

        <div style={{display: 'flex', justifyContent: 'space-around', marginTop: '100px'}}>
          <button onClick={() => this.props.redirect('Register')} className="btn btn-danger btn-lg">Registration</button>
        </div>
      </div>
    )
  }
}

class Register extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div style={{display: 'flex', justifyContent: 'center', flexDirection: 'column'}}>
        <h1 style={{textAlign: 'center', color: 'blue', marginBottom: '100px'}}>Welcome to Doodle Docz!</h1>
        <form style={{minWidth: "50%", margin: "0 auto"}}>
          <div className="form-group">
            <label>Username: </label>
            <input type="email" className="form-control" placeholder="Username" onChange={(e) => this.setState({username: e.target.value})}/>
          </div>
          <div className="form-group">
            <label >Password: </label>
            <input type="password" className="form-control" placeholder="6 characters minimum" onChange={(e) => this.setState({password: e.target.value})}/>
          </div>
          <button style={{minWidth: "100%"}} type="submit" className="btn btn-danger" onClick={e => this.props.register(e, this.state.username, this.state.password)}>Register</button>
        </form>

        <div style={{display: 'flex', justifyContent: 'space-around', marginTop: '100px'}}>
          <button onClick={() => this.props.redirect('Login')} className="btn btn-primary btn-lg">Login Page</button>
        </div>
      </div>
    )
  }
}

class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = {userId: localStorage.getItem('userId'), 
      username: localStorage.getItem('username'),
      docList: []
    };
  }

  componentWillMount() {
    fetch("https://reactive-docs.herokuapp.com/user/" + this.state.userId)
    .then(res => res.json())
    .then(res => {
      if (res.success) {
        //console.log(res.docList)
        this.setState({docList: res.docList})
      } else {
        alert(res.error)
      }
    })
  }

  createDocument(e, title) {
    e.preventDefault();
    fetch("https://reactive-docs.herokuapp.com/doc/new", {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "userId": this.state.userId,
        "title": title,
      }),
    })
    .then(res => res.json())
    .then(res => {
      if (res.success) {
        alert('Successfully created new document!');
        this.props.redirect('Document', res.documentId);
      } else {
        alert(res.error)
      }
    })
  }

  render() {
    return (
      <div>
        <h1 style={{textAlign: 'center', color: 'green', marginBottom: '100px'}}>Welcome, {this.state.username}!</h1>

        <div className="list-group" style={{display: 'flex', justifyContent: 'center', flexDirection: 'column', maxWidth: "70%", margin: "0 auto"}}>
          {this.state.docList.map(doc => (

            <a href="#" className="list-group-item list-group-item-action flex-column align-items-start"
               onClick={() => this.props.redirect('Document', doc._id)}>
              <div className="d-flex w-100 justify-content-between">
                <h3 className="mb-1">{doc.title}</h3>
                <h5>Created on: {doc.createdTime.toString()}</h5>
                <h5>Last edited on: {doc.lastEditTime.toString()}</h5>
              </div>
            </a>
            )
          )}
        </div>


      </div>
    )
  }
}


              // <div onClick={() => this.props.redirect('Document', doc._id)} className="list-group-item">
              //   <h5>{doc.title}</h5>
