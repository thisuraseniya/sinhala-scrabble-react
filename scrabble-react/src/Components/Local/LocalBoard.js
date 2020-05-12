import React, { Component } from "react";
import LocalPlayerRack from "./LocalPlayerRack";
import { findPlayedWords } from "../../FindPlayedWords";
import { scoreCalculator } from "../../ScoreCalculator";
import firebase from "../../Config/firebase";

class LocalBoard extends Component {
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
      player1Score: 0,
      player2Score: 0,
      clickedLetter: null,
      loadingWords: false,
      scrabbleWords: null,
      notFoundWords: null,
    };
  }

  componentDidMount() {
    this.setState({
      board: this.updateBoardArray(),
      tempBoard: this.updateBoardArray(),
    });
    this.getScrabbleWords();
  }

  getScrabbleWords = () => {
    this.setState({ loadingWords: true });
    let db = firebase.firestore();
    db.collection("scrabble_words")
      .doc("si_words")
      .onSnapshot((doc) => {
        let data = doc.data();
        console.log(data);
        if (data) {
          this.setState({ loadingWords: false, scrabbleWords: data.words });
        } else {
          this.setState({ loadingWords: false });
        }
      });
  };

  componentDidUpdate(prevProps, prevState) {}

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
      const board = [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
      ];

      return board;
    }
  };

  playWord = () => {
    let {
      wordsFound,
      disconnectedWordCount,
      invalidWords,
      orphanedLetters,
    } = findPlayedWords(this.state.scrabbleWords, this.state.board, 15);

    if (wordsFound.length === 0) {
      this.setState({
        errors: "Please play a word (should be more than 1 letter)",
      });
      return;
    }

    if (this.state.turn === 1 && this.state.board[7][7] === "") {
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

    // first word on the first turn is obv is disconnected, so we make an adjustment
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
      let currentScore = this.state.player1Score;
      this.setState({ player1Score: (currentScore += score) });
    } else if (this.state.currentPlayer === 2) {
      let currentScore = this.state.player2Score;
      this.setState({ player2Score: (currentScore += score) });
    }

    this.setState({
      currentPlayer: this.state.currentPlayer === 1 ? 2 : 1,
      wordsPlayed: [...wordsFound],
      tempBoard: [...this.state.board],
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
      currentPlayer: this.state.currentPlayer === 1 ? 2 : 1,
      clickedLetter: null,
    });
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
        console.log(error);
        document.getElementById(id).removeAttribute("disabled");
        document.getElementById(id).classList.remove("btn-secondary");
        document.getElementById(id).classList.add("btn-outline-primary");
      });
  };

  render() {
    const {
      board,
      dropsuccess,
      resetRack,
      errors,
      currentPlayer,
      wordsPlayed,
      resetCount,
      player1Score,
      player2Score,
      clickedLetter,
      scrabbleWords,
      loadingWords,
      notFoundWords,
    } = this.state;
    return (
      <>
        {loadingWords && "Loading sinhala words. Please wait..."}
        {scrabbleWords && (
          <div className="container-fluid">
            <div className="row mt-3">
              <div className="col col-12 text-center">
                <h3>Sinhala Scrabble</h3>
              </div>
            </div>
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
                                    "scrabbleTile board-tiles " +
                                    (cell !== "" ? " filled" : "") +
                                    (i === 7 && j === 7 ? " center-tile" : "")
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
                    <LocalPlayerRack
                      onclickcallback={this.onTileClickCallback}
                      dropsuccess={dropsuccess}
                      reset={resetRack}
                      currentplayer={currentPlayer}
                      resetcount={resetCount}
                    />
                  </div>
                </div>
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
              </div>
              <div className="col col-lg-3 col-sm-12 col-12">
                <div className="row">
                  <div className="col col-6 col-md-12">
                    <div className="score-card player1-card">
                      <span>Player 1 </span>
                      <span className="player1-score">
                        <span className="score">{player1Score}</span>
                      </span>
                    </div>
                  </div>
                  <div className="col col-6 col-md-12">
                    <div className="score-card player2-card">
                      <span>Player 2 </span>
                      <span className="player1-score">
                        <span className="score">{player2Score}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <hr className="d-block d-sm-none" />
                <div className="words-played mb-5 mt-3">
                  <div className="words-played-text">Words Played</div>
                  {[...new Set(wordsPlayed)].map((word, i) => {
                    return (
                      <div className="word" key={"word_" + i}>
                        {word}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
}

export default LocalBoard;

// make once dropped it stays unless reset
// min 2 letter word
