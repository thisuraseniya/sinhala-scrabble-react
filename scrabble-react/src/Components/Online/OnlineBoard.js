import React, { Component } from "react";
import OnlinePlayerRack from "./OnlinePlayerRack";
import { findPlayedWords } from "../../FindPlayedWords";
import { scoreCalculator } from "../../ScoreCalculator";
import firebase from "../../Config/firebase";
import { convertMapToArray, createBoard } from "./utils";
import moment from "moment";

let db = firebase.firestore();
// let this.duration = 600;
// let boardSize = 15;
// let this.midTile = 7;
let boardClass = "scrabbleTile";

class OnlineBoard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      board: null,
      tempBoard: null,
      dropsuccess: false,
      resetRack: false,
      resetCount: 0,
      currentPlayer: 1,
      turn: 1,
      errors: null,
      wordsPlayed: [],
      hostScore: 0,
      joinerScore: 0,
      clickedLetter: null,
      loadingWords: false,
      scrabbleWords: null,
      notFoundWords: null,
      hostTime: this.duration,
      joinerTime: this.duration,
      winMsg: null,
      winScores: null,
    };
  }
  componentDidMount() {
    this.duration = this.props.dbData.duration;
    this.boardSize = this.props.dbData.boardSize;
    this.midTile = Math.round(this.boardSize / 2) - 1;
    if (this.boardSize !== 15) {
      boardClass = "scrabbleTile-" + this.boardSize.toString();
    }

    let emptyBoard = this.updateBoardArray();
    this.setState({
      board: emptyBoard,
      tempBoard: emptyBoard,
    });

    //send empty board to firebase
    if (this.props.type === "host") {
      try {
        db.collection("scrabble_online")
          .doc(this.props.dbData.host)
          .update({
            board: { ...emptyBoard },
            wordsPlayed: [],
            currentPlayer: 1,
            hostScore: 0,
            joinerScore: 0,
            hostTime: this.duration,
            joinerTime: this.duration,
          });
      } catch (error) {
        console.log(error);
      }
    }

    this.getScrabbleWords();

    this.timer = setInterval(() => {
      if (this.state.joinerTime >= 1 && this.state.hostTime >= 1) {
        if (this.state.currentPlayer === 1) {
          let c = this.state.hostTime;
          this.setState({ hostTime: c - 1 });
        } else if (this.state.currentPlayer === 2) {
          let c = this.state.joinerTime;
          this.setState({ joinerTime: c - 1 });
        }
      }
    }, 1000);
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.props.dbData.board &&
      this.props.dbData.board !== prevProps.dbData.board
    ) {
      let newBoard = convertMapToArray(
        this.props.dbData.board,
        this.props.dbData.boardSize
      );
      this.setState({
        board: newBoard,
        tempBoard: newBoard,
      });
    }
    if (
      this.props.dbData.wordsPlayed &&
      this.props.dbData.wordsPlayed !== prevProps.dbData.wordsPlayed
    ) {
      this.setState({
        wordsPlayed: this.props.dbData.wordsPlayed,
      });
    }
    if (
      this.props.dbData.currentPlayer &&
      this.props.dbData.currentPlayer !== prevProps.dbData.currentPlayer
    ) {
      this.setState({
        currentPlayer: this.props.dbData.currentPlayer,
        hostTime: this.props.dbData.hostTime,
        joinerTime: this.props.dbData.joinerTime,
      });
    }
    if (
      this.props.dbData.hostScore &&
      this.props.dbData.hostScore !== prevProps.dbData.hostScore
    ) {
      this.setState({
        hostScore: this.props.dbData.hostScore,
      });
    }
    if (
      this.props.dbData.joinerScore &&
      this.props.dbData.joinerScore !== prevProps.dbData.joinerScore
    ) {
      this.setState({
        joinerScore: this.props.dbData.joinerScore,
      });
    }
    if (
      this.state.currentPlayer !== 3 &&
      (this.state.hostTime === 0 || this.state.joinerTime === 0)
    ) {
      this.endGame();
    }
  }

  getScrabbleWords = () => {
    this.setState({ loadingWords: true });
    let db = firebase.firestore();
    db.collection("scrabble_words")
      .doc("si_words")
      .onSnapshot((doc) => {
        let data = doc.data();
        if (data) {
          this.setState({ loadingWords: false, scrabbleWords: data.words });
        } else {
          this.setState({ loadingWords: false });
        }
      });
  };

  addToArray = (val, col_n, row_n) => {
    let disposeBoard = [...this.state.board];
    let outBoard = [];
    disposeBoard.filter((row, i) => {
      let outRow = [];
      row.filter((cell, j) => {
        if (i.toString() === row_n && j.toString() === col_n) {
          outRow.push(val);
        } else {
          outRow.push(cell);
        }
        return true;
      });
      outBoard.push(outRow);
      outRow = [];
      return true;
    });
    return outBoard;
  };

  updateBoardArray = (prevBoard, val, row_n, col_n, add = true) => {
    if (prevBoard && val && row_n && col_n && add) {
      return this.addToArray(val, col_n, row_n);
    } else {
      const board = createBoard(this.props.dbData.boardSize);
      return board;
    }
  };

  playWord = () => {
    let {
      wordsFound,
      disconnectedWordCount,
      invalidWords,
      orphanedLetters,
    } = findPlayedWords(
      this.state.scrabbleWords,
      this.state.board,
      this.boardSize
    );

    if (wordsFound.length === 0) {
      this.setState({
        errors: "Please play a word (should be more than 1 letter)",
      });
      return;
    }

    if (
      this.state.turn === 1 &&
      this.state.board[this.midTile][this.midTile] === ""
    ) {
      this.setState({
        errors: "First word should cover the center tile of the board",
      });
      return;
    }
    if (orphanedLetters > 0) {
      this.setState({
        errors: "All the words should be connected together",
      });
      return;
    }

    // first word on the first turn can be disconnected, so we make an adjustment
    if (this.state.turn === 1) {
      disconnectedWordCount -= 1;
    }

    if (disconnectedWordCount > 0) {
      this.setState({
        errors: "All the words should be connected together",
      });
      return;
    }

    if (invalidWords.length > 0) {
      this.setState({
        errors:
          "Below words were not found in the dictionary. Press 'Suggest' to recommend them to be added to the dictionary ",
        notFoundWords: invalidWords,
      });
      return;
    }

    // calculate score function
    let { newWords, score } = scoreCalculator(
      wordsFound,
      this.state.wordsPlayed
    );

    if (newWords.length === 0) {
      this.setState({
        errors: "Please play a word (should be more than 1 letter)",
      });
      return;
    }

    if (this.state.currentPlayer === 1) {
      try {
        db.collection("scrabble_online")
          .doc(this.props.dbData.host)
          .update({
            board: { ...this.state.board },
            wordsPlayedHost: firebase.firestore.FieldValue.arrayUnion(
              ...newWords
            ),
            wordsPlayed: [...wordsFound],
            currentPlayer: this.state.currentPlayer === 1 ? 2 : 1,
            hostScore: firebase.firestore.FieldValue.increment(score),
            hostTime: this.state.hostTime,
          });
      } catch (error) {
        console.log(error);
      }
    } else if (this.state.currentPlayer === 2) {
      try {
        db.collection("scrabble_online")
          .doc(this.props.dbData.host)
          .update({
            board: { ...this.state.board },
            wordsPlayedJoiner: firebase.firestore.FieldValue.arrayUnion(
              ...newWords
            ),
            wordsPlayed: [...wordsFound],
            currentPlayer: this.state.currentPlayer === 1 ? 2 : 1,
            joinerScore: firebase.firestore.FieldValue.increment(score),
            joinerTime: this.state.joinerTime,
          });
      } catch (error) {
        console.log(error);
      }
    }

    this.setState({
      errors: null,
      notFoundWords: null,
    });
  };

  resetRack = () => {
    let c = this.state.resetCount;
    this.setState({
      resetRack: true,
      restCount: (c += 1),
      board: [...this.state.tempBoard],
      errors: null,
      notFoundWords: null,
    });
  };

  passTurn = () => {
    this.resetRack();
    this.setState({
      clickedLetter: null,
    });
    if (this.state.currentPlayer === 1) {
      try {
        db.collection("scrabble_online")
          .doc(this.props.dbData.host)
          .update({
            currentPlayer: this.state.currentPlayer === 1 ? 2 : 1,
            hostTime: this.state.hostTime,
          });
      } catch (error) {
        console.log(error);
      }
    } else if (this.state.currentPlayer === 2) {
      try {
        db.collection("scrabble_online")
          .doc(this.props.dbData.host)
          .update({
            currentPlayer: this.state.currentPlayer === 1 ? 2 : 1,
            joinerTime: this.state.joinerTime,
          });
      } catch (error) {
        console.log(error);
      }
    }
  };

  onTileClickCallback = (e) => {
    this.setState({ clickedLetter: e, dropsuccess: false });
  };

  addLetterToBoard = (e) => {
    e.preventDefault();
    let row = e.target.attributes.row.value;
    let col = e.target.attributes.column.value;
    if (this.state.clickedLetter && this.state.board[row][col] === "") {
      let letter = this.state.clickedLetter;
      let newBoard = this.updateBoardArray(
        [...this.state.board],
        letter,
        row,
        col
      );
      this.setState({
        board: [...newBoard],
        dropsuccess: true,
        resetRack: false,
        errors: null,
        clickedLetter: null,
        notFoundWords: null,
      });
    } else if (this.state.board[row][col] !== "") {
      this.setState({ errors: "Can not place letter here" });
    } else {
      this.setState({ errors: "Select a letter first" });
    }
  };

  highlightTile = (e) => {
    if (this.state.clickedLetter) {
      let id = e.target.attributes.id.value;
      document.getElementById(id).classList.add("highlight");
    }
  };

  removeHighlightTile = (e) => {
    if (this.state.clickedLetter) {
      let id = e.target.attributes.id.value;
      document.getElementById(id).classList.remove("highlight");
    }
  };

  suggestWord = async (word, id) => {
    document.getElementById(id).setAttribute("disabled", true);
    document.getElementById(id).classList.add("btn-secondary");
    document.getElementById(id).classList.remove("btn-outline-primary");
    let db = firebase.firestore();
    await db
      .collection("scrabble_words")
      .doc("si_suggestions")
      .update({
        words: firebase.firestore.FieldValue.arrayUnion(word),
      })
      .then(() => {
        document.getElementById(id).style.display = "none";
      })
      .catch((error) => {
        try {
          document.getElementById(id).removeAttribute("disabled");
          document.getElementById(id).classList.remove("btn-secondary");
          document.getElementById(id).classList.add("btn-outline-primary");
        } catch (error) {
          console.log(error);
        }
      });
  };

  endGame = () => {
    // 10 seconds = 1 point
    const { hostScore, hostTime, joinerScore, joinerTime } = this.state;
    let msg = "";
    let hostScoreAdj = hostScore + Math.round(hostTime / 10);
    let joinerScoreAdj = joinerScore + Math.round(joinerTime / 10);
    let winScore = 0;
    let winBonus = 0;
    let outcome = "win";
    if (hostScoreAdj > joinerScoreAdj && hostScore !== 0 && joinerScore !== 0) {
      msg =
        "The winner is " +
        this.props.dbData.hostName +
        " with " +
        hostScoreAdj +
        " points";
      winScore = hostScore;
      winBonus = Math.round(hostTime / 10);
    } else if (
      hostScoreAdj < joinerScoreAdj &&
      hostScore !== 0 &&
      joinerScore !== 0
    ) {
      msg =
        "The winner is " +
        this.props.dbData.joinerName +
        " with " +
        joinerScoreAdj +
        " points";
      winScore = joinerScore;
      winBonus = Math.round(joinerScore / 10);
    } else {
      msg = "The game is drawn";
      outcome = "draw";
    }
    this.setState({
      winMsg: msg,
      currentPlayer: 3,
      winScores: { score: winScore, bonus: winBonus, outcome: outcome },
    });
  };

  render() {
    const {
      board,
      dropsuccess,
      resetRack,
      errors,
      currentPlayer,
      resetCount,
      hostScore,
      joinerScore,
      clickedLetter,
      scrabbleWords,
      loadingWords,
      notFoundWords,
      joinerTime,
      hostTime,
      winMsg,
      winScores,
    } = this.state;
    const { type, dbData } = this.props;
    let hostFormattedTime = moment.utc(hostTime * 1000).format("HH:mm:ss");
    let joinerFormattedTime = moment.utc(joinerTime * 1000).format("HH:mm:ss");

    return (
      <>
        {loadingWords && "Loading sinhala words. Please wait..."}
        {scrabbleWords && (
          <div className="container-fluid">
            {/* <div className="row mt-3"></div> */}
            <div className="row mt-3">
              <div className="col col-lg-5 col-sm-12 col-12 mb-3">
                <table id="scrabble-table">
                  <tbody>
                    {board &&
                      board.map((row, i) => {
                        return (
                          <tr key={"row" + i}>
                            {row.map((cell, j) => {
                              return (
                                <td
                                  className={
                                    boardClass +
                                    " board-tiles " +
                                    (cell !== "" ? " filled" : "") +
                                    (i === this.midTile && j === this.midTile
                                      ? " center-tile"
                                      : "")
                                  }
                                  key={"row" + i + "cell" + j}
                                  row={i}
                                  column={j}
                                  id={"boardTile" + i + "_" + j}
                                  onClick={(e) => this.addLetterToBoard(e)}
                                  onMouseOver={(e) => this.highlightTile(e)}
                                  onMouseLeave={(e) =>
                                    this.removeHighlightTile(e)
                                  }
                                >
                                  {cell}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
                {clickedLetter && (
                  <div className="selected-letter-text">
                    Selected Letter{" "}
                    <span className="clicked-letter">{clickedLetter}</span>
                  </div>
                )}
              </div>
              <div className="col col-lg-4 col-sm-12 col-12 justify-content-center">
                <div className="row">
                  <div className="col-12">
                    <OnlinePlayerRack
                      type={type}
                      dbData={dbData}
                      onclickcallback={this.onTileClickCallback}
                      dropsuccess={dropsuccess}
                      reset={resetRack}
                      currentplayer={currentPlayer}
                      resetcount={resetCount}
                    />
                  </div>
                </div>
                {(type === "host" && currentPlayer === 1) ||
                (type === "joiner" && currentPlayer === 2) ? (
                  <>
                    <div className="row mt-3">
                      <div className="col col-4">
                        <button
                          onClick={this.playWord}
                          className="btn btn-outline-primary btn-block"
                        >
                          Play
                        </button>
                      </div>
                      <div className="col col-4">
                        <button
                          onClick={this.resetRack}
                          className="btn btn-outline-danger btn-block"
                        >
                          Reset
                        </button>
                      </div>
                      <div className="col col-4">
                        <button
                          onClick={this.passTurn}
                          className="btn btn-outline-warning btn-block"
                        >
                          Pass
                        </button>
                      </div>
                    </div>
                    {errors && (
                      <div className="error mt-3 mb-3">
                        <div className="row">
                          <div className="col col-12">
                            <span className="align-middle">{errors}</span>
                          </div>
                        </div>
                        {notFoundWords &&
                          notFoundWords.map((word, i) => {
                            return (
                              <div className="row mt-2" key={"suggest_" + i}>
                                <div className="col col-7">
                                  <span className="align-middle">{word}</span>
                                </div>
                                <div className="col col-5">
                                  <button
                                    id={"suggestBtn_" + i}
                                    className="btn btn-outline-primary btn-block"
                                    onClick={() =>
                                      this.suggestWord(word, "suggestBtn_" + i)
                                    }
                                  >
                                    Suggest
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                    <hr className="d-block d-sm-none" />
                  </>
                ) : (
                  <>
                    {currentPlayer === 1 || currentPlayer === 2 ? (
                      <div className="row mb-3">
                        <div className="col-12 text-center">
                          Waiting for the other player
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="overlay"></div>
                        <div
                          className="card text-center"
                          style={{ zIndex: 50 }}
                        >
                          <div className="card-header">Game Over!</div>
                          <div className="card-body">
                            <h5 className="card-title">{winMsg}</h5>
                            {winScores && winScores.outcome !== "draw" && (
                              <p>
                                Words score: {winScores.score}
                                <br />
                                Time bonus (1 point per 10s): {winScores.bonus}
                              </p>
                            )}

                            <button
                              className="btn btn-primary mt-3"
                              onClick={() => {
                                window.location.reload(false);
                              }}
                            >
                              New Game
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
              <div className="col col-lg-3 col-sm-12 col-12">
                <div className="row mb-2">
                  <div className="col col-12">
                    <div className="score-card player1-card">
                      <span className="font-weight-bold">
                        {dbData.hostName}
                      </span>
                      <span className="player1-score">
                        <span className="score">{hostScore}</span>
                      </span>
                      <div className="row mt-3 mb-0 pb-0 pl">
                        <div className="col col-12 paddingAdjust">
                          {"Time left " + hostFormattedTime}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col col-12">
                    <div className="score-card player2-card">
                      <span className="font-weight-bold">
                        {dbData.joinerName}
                      </span>
                      <span className="player1-score">
                        <span className="score">{joinerScore}</span>
                      </span>
                      <div className="row mt-3 mb-0 pb-0 pl">
                        <div className="col col-12 pl-0 paddingAdjust">
                          {"Time left " + joinerFormattedTime}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <hr className="d-block d-sm-none" />
                <div className="words-played mb-5 mt-3">
                  <div className="words-played-text">Words Played</div>
                  <div className="row">
                    <div className="col col-6">
                      <span>{dbData.hostName}</span>
                      <span>
                        {dbData &&
                          dbData.wordsPlayedHost &&
                          dbData.wordsPlayedHost.map((word, i) => {
                            return (
                              <div className="word" key={"word_" + i}>
                                {word}
                              </div>
                            );
                          })}
                      </span>
                    </div>
                    <div className="col col-6">
                      <span>{dbData.joinerName}</span>
                      <span>
                        {dbData &&
                          dbData.wordsPlayedJoiner &&
                          dbData.wordsPlayedJoiner.map((word, i) => {
                            return (
                              <div className="word" key={"word_" + i}>
                                {word}
                              </div>
                            );
                          })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
}

export default OnlineBoard;

// make once dropped it stays unless reset
// min 2 letter word
