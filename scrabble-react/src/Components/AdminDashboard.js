import React, { Component } from "react";
import firebase from "../Config/firebase";
let wordListener;
let db = firebase.firestore();

export default class AdminDashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      words: null
    };
  }

  componentDidMount() {
    wordListener = db
      .collection("scrabble_words")
      .doc("si_suggestions")
      .onSnapshot(doc => {
        let data = doc.data();
        if (data) {
          this.setState({ words: data.words });
        }
      });
  }

  componentWillUnmount() {
    wordListener();
  }

  approveWord = async word => {
    db.collection("scrabble_words")
      .doc("si_suggestions")
      .update({
        words: firebase.firestore.FieldValue.arrayRemove(word)
      })
      .then(() => {
        console.log("removed from suggestions");
      })
      .catch(error => {
        console.log(error);
      });

    let field = "words." + word;
    await db
      .collection("scrabble_words")
      .doc("si_words")
      .update({
        [field]: 1
      })
      .then(() => {
        console.log("added to dictionary");
      })
      .catch(error => {
        console.log(error);
      });
  };

  removeWord = word => {
    db.collection("scrabble_words")
      .doc("si_suggestions")
      .update({
        words: firebase.firestore.FieldValue.arrayRemove(word)
      })
      .then(() => {
        console.log("removed from suggestions");
      })
      .catch(error => {
        console.log(error);
      });
  };

  render() {
    const { words } = this.state;
    return (
      <div className="container">
        <table className="table">
          <thead>
            <tr>
              <th scope="col"></th>
              <th scope="col">Word</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {words &&
              words.map((word, i) => {
                return (
                  <tr key={"row_" + i}>
                    <th scope="row">{i}</th>
                    <td>{word}</td>
                    <td>
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => this.removeWord(word)}
                        id={"btnRemove_" + i}
                      >
                        Remove
                      </button>{" "}
                      <button
                        className="btn btn-success"
                        onClick={() => this.approveWord(word)}
                        id={"btnApprove_" + i}
                      >
                        Approve
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    );
  }
}
