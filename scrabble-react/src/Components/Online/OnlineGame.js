import React, { Component } from "react";
import firebase from "../../Config/firebase";
import OnlineBoard from "./OnlineBoard";
import NavBar from "./NavBar";

let gameListener = null;
let db = firebase.firestore();

export default class OnlineGame extends Component {
  constructor(props) {
    super(props);
    this.state = {
      authenticated: false,
      authUser: null,
      authUID: null,
      errors: null,
      type: null,
      loading: true,
      hostCode: null,
      joinCode: null,
      joinEmail: null,
      hostUID: null,
      dbData: null,
      loadingHost: false,
      loadingJoin: false,
      duration: 600,
      boardSize: 15,
    };
  }

  componentDidMount() {
    firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        this.setState({
          authUser: user,
          authenticated: true,
          authUID: user.uid,
        });
        db.collection("scrabble_online")
          .doc(this.state.authUID)
          .set({
            hostCode: null,
          })
          .catch((error) => {
            console.log(error);
          });
      } else {
        this.setState({ authUser: null, authenticated: false, authUID: null });
      }
      this.setState({ loading: false });
    });
  }

  componentWillUnmount() {
    gameListener && gameListener();
  }

  signinGoogle = () => {
    let provider = new firebase.auth.GoogleAuthProvider();
    firebase
      .auth()
      .signInWithPopup(provider)
      .then((result) => {
        let user = result.user;
        this.setState({
          authenticated: true,
          authUser: user,
          authUID: user.uid,
        });
      })
      .catch((error) => {
        console.log(error);
        this.setState({ authenticated: false, authUser: null, authUID: null });
      });
  };

  signOut = () => {
    firebase
      .auth()
      .signOut()
      .then(
        function () {
          console.log("Signed Out");
        },
        function (error) {
          console.error("Sign Out Error", error);
        }
      );
  };

  hostGame = async () => {
    gameListener && gameListener();
    const { authUser, duration, boardSize } = this.state;
    this.setState({ loadingHost: true });
    let hostCode = Math.floor(Math.random() * 100000);
    await db
      .collection("scrabble_online")
      .doc(this.state.authUID)
      .set({
        host: authUser.uid,
        hostEmail: authUser.email,
        hostName: authUser.displayName,
        hostCode: hostCode,
        duration: duration,
        boardSize: boardSize,
      })
      .then(() => {
        this.setState({ hostCode: hostCode });
        this.getGameRealTime(authUser.uid);
      })
      .catch((error) => {
        console.log(error);
      });
    this.setState({ loadingHost: false });
  };

  joinGame = async () => {
    gameListener && gameListener();
    this.setState({ errors: null, loadingJoin: true });
    const { joinEmail, joinCode, authUser } = this.state;

    try {
      const gameData = await db
        .collection("scrabble_online")
        .where("hostEmail", "==", joinEmail)
        .get()
        .then((snapshot) => {
          let data = [];
          snapshot.forEach((doc) => {
            data.push(doc.data());
          });
          return data[0];
        });

      if (gameData) {
        if (gameData.hostCode.toString() === joinCode) {
          this.setState({ hostUID: gameData.host });
          await db.collection("scrabble_online").doc(gameData.host).update({
            joiner: authUser.uid,
            joinerEmail: authUser.email,
            joinerName: authUser.displayName,
          });
          this.getGameRealTime(gameData.host);
        } else {
          this.setState({ errors: "Incorrect Code" });
        }
      } else {
        this.setState({ errors: "Could not find a game with these details" });
      }
    } catch (error) {
      console.log(error);
    }
    this.setState({ loadingJoin: false });
  };

  updateJoinData = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  getGameRealTime = (authUID) => {
    const { authUser } = this.state;
    gameListener = db
      .collection("scrabble_online")
      .doc(authUID)
      .onSnapshot((doc) => {
        let data = doc.data();
        if (data) {
          if (data.joiner && data.joiner === data.host) {
            this.setState({ errors: "You cant join your own game" });
          } else if (data.joiner && data.host === authUser.uid) {
            this.setState({ dbData: data, type: "host" });
          } else if (data.joiner && data.joiner === authUser.uid) {
            this.setState({ dbData: data, type: "joiner" });
          } else {
            this.setState({ dbData: data, type: null });
          }
        }
      });
  };

  updateHostOptions = (e) => {
    this.setState({
      [e.target.name]: parseInt(e.target.value),
      hostCode: null,
    });
  };

  render() {
    const {
      authenticated,
      authUser,
      type,
      loading,
      hostCode,
      errors,
      dbData,
      loadingHost,
      loadingJoin,
    } = this.state;
    if (loading === true) {
      return "Loading";
    } else if (authenticated === true && authUser && type && dbData) {
      return (
        <>
          <NavBar
            signOut={this.signOut}
            code={hostCode}
            type={type}
            user={authUser}
          />
          <OnlineBoard dbData={dbData} type={type} />
        </>
      );
    } else if (authenticated === true && authUser) {
      return (
        <>
          <NavBar signOut={this.signOut} user={authUser} />
          <div className="container">
            <div className="pricing-header px-3 py-3 pt-md-5 pb-md-4 mx-auto text-center align-middle"></div>
            <div className="card-deck mb-3 text-center container">
              <div className="card mb-4 shadow-sm">
                <div className="card-header">
                  <h4 className="my-0 font-weight-normal">Host Game</h4>
                </div>
                <div className="card-body">
                  <p className="lead">Be the one starting the game</p>
                  <div className="row mb-3">
                    <div className="col col-5 col-md-3 text-left">
                      Board size
                    </div>
                    <div className="col col-7 col-md-9">
                      <select
                        className="custom-select"
                        name="boardSize"
                        onChange={this.updateHostOptions}
                        defaultValue={15}
                      >
                        <option value={9}>9x9</option>
                        <option value={11}>11x11</option>
                        <option value={15}>15x15</option>
                      </select>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col col-5 col-md-3 text-left">Duration</div>
                    <div className="col col-7 col-md-9">
                      <select
                        className="custom-select"
                        name="duration"
                        onChange={this.updateHostOptions}
                        defaultValue={600}
                      >
                        <option value={7200}>2 hours</option>
                        <option value={3600}>1 hour</option>
                        <option value={900}>15 minutes</option>
                        <option value={600}>10 minutes</option>
                        <option value={300}>5 minutes</option>
                      </select>
                    </div>
                  </div>
                  {hostCode && (
                    <>
                      <p className="lead">
                        Give this data to the other player to join <br />
                      </p>
                      <p className="lead">Code: {hostCode}</p>
                      <p className="lead">Email: {authUser.email}</p>
                    </>
                  )}

                  <button
                    className={
                      loadingHost
                        ? "btn btn-secondary"
                        : "btn btn-outline-primary"
                    }
                    disabled={loadingHost}
                    onClick={this.hostGame}
                  >
                    {loadingHost ? "Loading..." : "Host"}
                  </button>
                </div>
              </div>
              <div className="card mb-4 shadow-sm">
                <div className="card-header">
                  <h4 className="my-0 font-weight-normal">Join Game</h4>
                </div>
                <div className="card-body">
                  <p className="lead">
                    Connect to a game started by another player.
                  </p>
                  <p className="lead">
                    Enter the details to join the game <br />
                  </p>
                  <p className="lead">
                    Code{" "}
                    <input name="joinCode" onChange={this.updateJoinData} />
                  </p>
                  <p className="lead">
                    Email{" "}
                    <input name="joinEmail" onChange={this.updateJoinData} />
                  </p>
                  {errors && <p className="lead">{errors}</p>}

                  <button
                    className={
                      loadingJoin
                        ? "btn btn-secondary"
                        : "btn btn-outline-primary"
                    }
                    disabled={loadingJoin}
                    onClick={this.joinGame}
                  >
                    {loadingJoin ? "Loading..." : "Join"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      );
    } else {
      return (
        <div className="container">
          <div className="row justify-content-center align-items-center full-height">
            <div className="text-center col col-12 col-md-4">
              <h1 className="h3 mb-3 font-weight-normal">Please sign in</h1>
              <button
                className="btn btn-block btn-danger"
                onClick={this.signinGoogle}
              >
                Sign in with Google
              </button>
            </div>
          </div>
        </div>
      );
    }
  }
}
