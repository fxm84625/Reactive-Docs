import React from 'react';

export default class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state={username: '', password: ''}
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
        //storing the userId and username for future use
        localStorage.setItem('userId', res.userId);
        localStorage.setItem('username', username);
        //go to main page with list of documents (if any)
        this.props.redirect('Main')
      } else {
        alert(res.error)
      }
    })
  }

  render() {
    return (
      <div style={{display: 'flex', justifyContent: 'center', flexDirection: 'column'}}>
        <h1 style={{textAlign: 'center', color: 'blue', marginBottom: '100px'}}>Welcome to Reactive Docs!</h1>
        <form style={{minWidth: "50%", margin: "0 auto"}}>
          <div className="form-group">
            <label>Username: </label>
            <input type="email" className="form-control" placeholder="Username" value={this.state.username} onChange={(e) => this.setState({username: e.target.value})}/>
          </div>
          <div className="form-group">
            <label >Password: </label>
            <input type="password" className="form-control" placeholder="Password" value={this.state.password} onChange={(e) => this.setState({password: e.target.value})}/>
          </div>
          <button style={{minWidth: "100%"}} type="submit" className="btn btn-primary" onClick={e => this.login(e, this.state.username, this.state.password)}>Login</button>
        </form>

        <div style={{display: 'flex', justifyContent: 'space-around', marginTop: '100px'}}>
          <button onClick={() => this.props.redirect('Register')} className="btn btn-danger btn-lg">Registration</button>
        </div>
      </div>
    )
  }
}