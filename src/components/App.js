import React, { Component } from 'react';
import {
  Button,
  Image,
  Nav,
  OverlayTrigger,
  Popover,
  Tab,
  Modal,
  InputGroup,
  FormControl,
  Container,
  Row,
  Col,
  Collapse
} from 'react-bootstrap';
import { auth, provider, firestore } from '../firebase';
import Friends from './Friends/Friends';
import Home from './Home/Home';
import UserTrips from './UserTrips/UserTrips';
import './App.scss';

class App extends Component {
  constructor() {
    super();

    this.state = {
      activeTab: 'home',
      showLoginModal: true,
      currentUser: null,
      messengerName: '',
      messengerHelp: false,
      trips: [],
      users: []
    };
  }

  componentDidMount() {
    auth.onAuthStateChanged(currentUser => {
      if (currentUser) {
        this.setState({ currentUser }, () => {
          this.getAllTrips();
          this.getAllUsers();
        });
      }
    });
  }

  getAllTrips() {
    if (this.state.currentUser) {
      firestore.collection('trips').onSnapshot(
        tripsSnapshot => {
          if (!tripsSnapshot.empty) {
            var trips = [];
            tripsSnapshot.forEach(tripDoc => {
              var trip = tripDoc.data();
              trip.id = tripDoc.id;
              trips.push(trip);
            });

            this.setState({ trips });
          }
        },
        err => {
          console.log("Can't get user trips; are you logged in? ");
        }
      );
    }
  }

  getAllUsers() {
    if (this.state.currentUser) {
      firestore.collection('users').onSnapshot(
        usersSnapshot => {
          if (!usersSnapshot.empty) {
            var users = [];
            usersSnapshot.forEach(userDoc => {
              var user = userDoc.data();
              user.id = userDoc.id;
              users.push(user);
            });

            this.setState({ users });
          }
        },
        err => {
          console.log("Can't get users; are you logged in?");
        }
      );
    }
  }

  login = () => {
    auth.signInWithPopup(provider).then(res => {
      var user = res.user;
      var additionalInfo = res.additionalUserInfo;

      this.setState({ currentUser: user });

      var userRef = firestore.collection('users').doc(user.uid);
      var userData = {};
      var messengerURL = 'https://m.me/' + this.state.messengerName;

      userRef.get().then(docSnapshot => {
        // Create new user
        if (!docSnapshot.exists) {
          userData.email = user.email;
          userData.fullName = additionalInfo.profile.name;
          userData.firstName = additionalInfo.profile.first_name;
          userData.lastName = additionalInfo.profile.last_name;
          userData.fbUID = additionalInfo.profile.id;
          userData.photoURL = user.photoURL;
          userData.messengerURL = messengerURL;

          userRef.set(userData);
        } else if (messengerURL !== docSnapshot.get('messengerURL')) {
          // Update username if different
          userRef.update({ messengerURL });
        }
      });
    });
  };

  logout = () => {
    auth.signOut().then(() => {
      this.setState({ currentUser: null, messengerName: '', activeTab: 'home' });
    });
  };

  toggleModal = () => {
    this.setState({ showLoginModal: !this.state.showLoginModal });
  };

  toggleLoginHelp = () => {
    this.setState({ messengerHelp: !this.state.messengerHelp });
  };

  handleChange = e => {
    this.setState({
      [e.target.name]: e.target.value
    });
  };

  tabSelected = e => {
    this.setState({ activeTab: e });
  };

  render() {
    return (
      <>
        <OverlayTrigger
          trigger="click"
          rootClose={true}
          placement="bottom"
          overlay={
            <Popover id="popover-basic" title={this.state.currentUser ? this.state.currentUser.displayName : ''}>
              <Button className="fb-login" onClick={this.state.currentUser ? this.logout : this.toggleModal}>
                {this.state.currentUser ? 'Logout' : 'Login'}
              </Button>
            </Popover>
          }
        >
          <Image
            className="profile-img"
            src={
              this.state.currentUser ? this.state.currentUser.photoURL : require('../pictures/missing-user-image.png')
            }
            rounded
            height="50"
            width="50"
          />
        </OverlayTrigger>

        <Modal show={this.state.currentUser === null && this.state.showLoginModal} onHide={this.toggleModal} centered>
          <Modal.Header>
            <Modal.Title>Login</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Container className="login-modal">
              <Row>
                <Col>
                  Please provide your{' '}
                  <a
                    className="link"
                    href="https://www.facebook.com/help/1740158369563165"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Facebook Username
                  </a>{' '}
                  to chat:
                </Col>
              </Row>
              <Row className="username-help">
                <Col>
                  <InputGroup className="mb-3">
                    <InputGroup.Prepend>
                      <InputGroup.Text>m.me/</InputGroup.Text>
                    </InputGroup.Prepend>
                    <FormControl
                      type="text"
                      className="form-control"
                      placeholder="Facebook Username"
                      aria-label="Facebook Username"
                      name="messengerName"
                      value={this.state.messengerName}
                      onChange={this.handleChange}
                    />
                    <InputGroup.Append>
                      <Button
                        variant="outline-secondary"
                        href={'https://m.me/' + this.state.messengerName}
                        disabled={this.state.messengerName === ''}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        Test
                      </Button>
                    </InputGroup.Append>
                  </InputGroup>
                </Col>
              </Row>
              <Row className="username-help d-flex justify-content-end">
                <Button
                  variant="outline-primary"
                  onClick={this.toggleLoginHelp}
                  aria-expanded={this.state.messengerHelp}
                >
                  Find my username
                </Button>
              </Row>
              <Row className="username-help">
                <Collapse in={this.state.messengerHelp}>
                  <div>
                    <Image className="messenger-help-img" src={require('../pictures/messenger-info.png')} rounded />
                  </div>
                </Collapse>
              </Row>
            </Container>
          </Modal.Body>
          <Modal.Footer>
            <Button className="fb-login" onClick={this.login} disabled={this.state.messengerName === ''}>
              Login with Facebook
            </Button>
          </Modal.Footer>
        </Modal>

        <Tab.Container defaultActiveKey="home" activeKey={this.state.activeTab} onSelect={this.tabSelected}>
          <Nav justify variant="pills" className="fixed-bottom">
            <Nav.Item>
              <Nav.Link className="nav-item" eventKey="routes" disabled={this.state.currentUser === null}>
                <i className="material-icons">directions_car</i>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link className="nav-item" eventKey="home">
                <i className="material-icons">home</i>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link className="nav-item" eventKey="friends" disabled={this.state.currentUser === null}>
                <i className="material-icons">people</i>
              </Nav.Link>
            </Nav.Item>
          </Nav>
          <Tab.Content>
            <Tab.Pane eventKey="routes">
              <UserTrips currentUser={this.state.currentUser} trips={this.state.trips} />
            </Tab.Pane>
            <Tab.Pane id="home-tab" eventKey="home">
              <Home currentUser={this.state.currentUser} trips={this.state.trips} users={this.state.users} />
            </Tab.Pane>
            <Tab.Pane id="friends-tab" eventKey="friends">
              <Friends />
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>

        {/* App Routes */}
        {/* <Switch>
          <Route exact path="/" component={Home} />
          <Route exact path="/privacy-policy" component={Friends} />
          <Route path="/routes/:dest" render={props => <Routes {...props} />} />
          <Route component={Home} />
        </Switch> */}
      </>
    );
  }
}

export default App;
