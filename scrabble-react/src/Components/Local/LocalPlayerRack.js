import React, { Component } from "react";
import { si_letters, si_variations } from "../../si_letters";
const rackLength = 8;

export default class LocalPlayerRack extends Component {
  constructor(props) {
    super(props);
    this.state = {
      player1Rack: null, // Main rack of player 1 (contains all the letters for a player)
      player1PlayingRack: null, // Contains first n amount of tiles taken from main rack
      player1TempRack: null, // When playing tiles from this rack is taken, at start of each round playingRAck = TempRack
      player1RemovedRack: null, // When playing tiles from this rack is also taken, at start of each round Rack = RemovedRack
      player2Rack: null,
      player2PlayingRack: null,
      player2TempRack: null,
      player2RemovedRack: null,
      dragging: false,
      clickedPosition: null,
      variations: null,
      variationClickedPosition: null,
    };
  }

  componentDidMount() {
    this.dealLettersToPlayers();
  }

  componentDidUpdate(prevProps, prevState) {
    //Resetting the board
    if (
      (this.props.reset === true && prevProps.reset === false) ||
      this.props.resetcount !== prevProps.resetcount
    ) {
      if (this.props.currentplayer === 1) {
        this.setState({
          player1PlayingRack: [...this.state.player1TempRack],
          player1RemovedRack: [...this.state.player1Rack],
          clickedPosition: null,
          variations: null,
        });
      } else if (this.props.currentplayer === 2) {
        this.setState({
          player2PlayingRack: [...this.state.player2TempRack],
          player2RemovedRack: [...this.state.player2Rack],
          clickedPosition: null,
          variations: null,
        });
      }
    }

    //Player changed
    if (this.props.currentplayer !== prevProps.currentplayer) {
      if (this.props.currentplayer === 1) {
        let removedRack = [...this.state.player1RemovedRack];
        let slicedRack = [...removedRack].slice(0, rackLength);
        this.setState({
          player1Rack: removedRack,
          player1PlayingRack: slicedRack,
          player1TempRack: slicedRack,
          clickedPosition: null,
          variations: null,
        });
      } else if (this.props.currentplayer === 2) {
        let removedRack = [...this.state.player2RemovedRack];
        let slicedRack = [...removedRack].slice(0, rackLength);
        this.setState({
          player2Rack: removedRack,
          player2PlayingRack: slicedRack,
          player2TempRack: slicedRack,
          clickedPosition: null,
          variations: null,
        });
      }
    }

    // tile placed
    if (this.props.dropsuccess === true && prevProps.dropsuccess === false) {
      if (this.props.currentplayer === 1) {
        let newRack = [...this.state.player1PlayingRack];
        newRack.splice(this.state.clickedPosition, 1);
        let newFullRack = [...this.state.player1RemovedRack];
        newFullRack.splice(this.state.clickedPosition, 1);
        this.setState({
          player1PlayingRack: newRack,
          player1RemovedRack: newFullRack,
          clickedPosition: null,
          variations: null,
        });
      } else if (this.props.currentplayer === 2) {
        let newRack = [...this.state.player2PlayingRack];
        newRack.splice(this.state.clickedPosition, 1);
        let newFullRack = [...this.state.player2RemovedRack];
        newFullRack.splice(this.state.clickedPosition, 1);
        this.setState({
          player2PlayingRack: newRack,
          player2RemovedRack: newFullRack,
          clickedPosition: null,
          variations: null,
        });
      }
    }
  }

  shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      let temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  };

  dealLettersToPlayers = () => {
    let allLetters = [];
    Object.values(si_letters).forEach((letter) => {
      for (let x = 0; x < letter[2]; x++) {
        allLetters.push(letter[0]);
      }
    });
    let shuffledArray = this.shuffleArray(allLetters);
    let p1 = [];
    let p2 = [];
    shuffledArray.forEach((letter, i) => {
      if (i % 2 === 0) {
        p1.push(letter);
      } else {
        p2.push(letter);
      }
    });

    p1 = this.shuffleArray(p1);
    p2 = this.shuffleArray(p2);

    this.setState({
      player1Rack: p1,
      player1RemovedRack: p1,
      player2Rack: p2,
      player2RemovedRack: p2,
      player1PlayingRack: p1.slice(0, rackLength),
      player1TempRack: p1.slice(0, rackLength),
      player2PlayingRack: p2.slice(0, rackLength),
      player2TempRack: p2.slice(0, rackLength),
    });
  };

  openVariations = (e) => {
    let letter = e.target.attributes.letter.value;
    let position = e.target.attributes.rackposition.value;
    let id = e.target.attributes.id.value;
    let variations = si_variations[letter];
    this.props.onclickcallback(letter);
    this.setState({
      clickedPosition: position,
      variations: variations,
      highlight: id,
      variationClickedPosition: null,
    });
  };

  substituteVariation = (e) => {
    let letter = e.target.attributes.letter.value;
    let pos = e.target.attributes.pos.value;
    this.props.onclickcallback(letter);
    this.setState({ variationClickedPosition: pos });
    console.log(pos);
  };

  tileScore = (letter) => {
    let letterScore = 0;
    for (let i = 0; i < letter.length; i++) {
      let l = letter.charAt(i);
      let letterData = si_letters[l];
      if (letterData) {
        letterScore = letterData[1];
      }
    }
    return letterScore;
  };

  render() {
    const {
      player1PlayingRack,
      player2PlayingRack,
      variations,
      variationClickedPosition,
      clickedPosition,
    } = this.state;
    const { currentplayer } = this.props;

    return (
      <>
        {currentplayer === 1 ? (
          <>
            <div className="player-text mb-2">Player 1 Letters</div>
            <table>
              <tbody>
                <tr>
                  {player1PlayingRack &&
                    player1PlayingRack.map((letter, i) => {
                      let id = Math.floor(Math.random() * 10000000000000);
                      let letterScore = this.tileScore(letter);

                      return (
                        <td
                          height="40px"
                          width="40px"
                          key={id}
                          id={id}
                          className={
                            "player1-rack" +
                            (clickedPosition === i.toString()
                              ? " highlight-rack-tile"
                              : "")
                          }
                        >
                          <span
                            className="player1-tile"
                            draggable="true"
                            id={id + 1}
                            score={3}
                            letter={letter}
                            rackposition={i}
                            player={1}
                            onClick={(e) => this.openVariations(e)}
                          >
                            {letter}
                          </span>
                          <span className="tile-score">{letterScore}</span>
                        </td>
                      );
                    })}
                </tr>
              </tbody>
            </table>
          </>
        ) : null}
        {currentplayer === 2 ? (
          <>
            <div className="player-text">Player 2 Letters</div>
            <table>
              <tbody>
                <tr>
                  {player2PlayingRack &&
                    player2PlayingRack.map((letter, i) => {
                      let id = Math.floor(Math.random() * 10000000000000);
                      let letterScore = this.tileScore(letter);

                      return (
                        <td
                          height="40px"
                          width="40px"
                          key={id}
                          id={id}
                          className={
                            "player2-rack" +
                            (clickedPosition === i.toString()
                              ? " highlight-rack-tile"
                              : "")
                          }
                        >
                          <span
                            className="player2-tile"
                            draggable="true"
                            id={id + 1}
                            score={3}
                            letter={letter}
                            rackposition={i}
                            player={2}
                            onClick={(e) => this.openVariations(e)}
                          >
                            {letter}
                          </span>
                          <span className="tile-score">{letterScore}</span>
                        </td>
                      );
                    })}
                </tr>
              </tbody>
            </table>
          </>
        ) : null}

        {variations && (
          <div className="substitute-rack">
            <div className="substitute-msg">
              Select the letter you want use instead
            </div>
            <table>
              <tbody>
                <tr>
                  {variations.map((variation, i) => {
                    return (
                      <td
                        height="30px"
                        width="30px"
                        key={i}
                        id={i}
                        className={
                          "substitute-tiles" +
                          (variationClickedPosition === i.toString()
                            ? " highlight-variation"
                            : "")
                        }
                      >
                        <span
                          letter={variation}
                          pos={i}
                          onClick={(e) => this.substituteVariation(e)}
                        >
                          {variation}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  }
}
