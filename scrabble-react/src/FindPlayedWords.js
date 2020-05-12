export const findPlayedWords = (si_words, currentBoard, boardSize) => {
  let wordsFound = [];
  let tempWord = [];
  let previousHCellWasEmpty = true;
  let wordConnected = false;
  let disconnectedWordCount = 0;
  let invalidWords = [];
  let orphanedLetters = 0;

  //search horizontal
  for (let horiRow = 0; horiRow < boardSize; horiRow++) {
    for (let horiCell = 0; horiCell < boardSize; horiCell++) {
      let cell = currentBoard[horiRow][horiCell];
      if (cell !== "") {
        tempWord.push(cell);
        previousHCellWasEmpty = false;
        if (
          (horiRow !== boardSize - 1 &&
            currentBoard[horiRow + 1][horiCell] !== "") ||
          (horiRow !== 0 && currentBoard[horiRow - 1][horiCell] !== "")
        ) {
          wordConnected = true;
        }
      } else {
        if (previousHCellWasEmpty === false && tempWord.length > 1) {
          wordsFound.push(tempWord.join(""));
        }
        previousHCellWasEmpty = true;
        if (tempWord.length > 1 && wordConnected === false) {
          disconnectedWordCount += 1;
        }
        tempWord = [];
        wordConnected = false;
      }
    }
  }

  tempWord = [];
  previousHCellWasEmpty = true;
  wordConnected = false;

  //search vertical
  for (let vertCol = 0; vertCol < boardSize; vertCol++) {
    for (let vertCell = 0; vertCell < boardSize; vertCell++) {
      let cell = currentBoard[vertCell][vertCol];
      if (cell !== "") {
        tempWord.push(cell);
        previousHCellWasEmpty = false;
        if (
          (vertCol !== boardSize - 1 &&
            currentBoard[vertCell][vertCol + 1] !== "") ||
          (vertCol !== 0 && currentBoard[vertCell][vertCol - 1] !== "")
        ) {
          wordConnected = true;
        }
      } else {
        if (previousHCellWasEmpty === false && tempWord.length > 1) {
          wordsFound.push(tempWord.join(""));
        }
        previousHCellWasEmpty = true;
        if (tempWord.length > 1 && wordConnected === false) {
          disconnectedWordCount += 1;
        }
        tempWord = [];
        wordConnected = false;
      }
    }
  }

  // check orphaned letters
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      let cell = currentBoard[r][c];
      if (r === 0 && c !== boardSize - 1) {
        if (
          cell !== "" &&
          currentBoard[r][c + 1] === "" &&
          currentBoard[r + 1][c] === ""
        ) {
          orphanedLetters += 1;
        }
      } else if (r === boardSize - 1 && (c === 0 || c !== boardSize - 1)) {
        if (
          cell !== "" &&
          currentBoard[r][c + 1] === "" &&
          currentBoard[r - 1][c] === "" &&
          currentBoard[r][c - 1] === ""
        ) {
          orphanedLetters += 1;
        }
      } else {
        if (
          cell !== "" &&
          currentBoard[r][c + 1] === "" &&
          currentBoard[r][c - 1] === "" &&
          currentBoard[r + 1][c] === "" &&
          currentBoard[r - 1][c] === ""
        ) {
          orphanedLetters += 1;
        }
      }
      if (c === boardSize - 1 && r === 0) {
        if (
          cell !== "" &&
          currentBoard[r][c - 1] === "" &&
          currentBoard[r + 1][c] === ""
        ) {
          orphanedLetters += 1;
        }
      } else if (c === boardSize - 1 && r !== boardSize - 1) {
        if (
          cell !== "" &&
          currentBoard[r][c - 1] === "" &&
          currentBoard[r + 1][c] === "" &&
          currentBoard[r - 1][c] === ""
        ) {
          orphanedLetters += 1;
        }
      } else if (c === boardSize - 1 && r === boardSize - 1) {
        if (
          cell !== "" &&
          currentBoard[r][c - 1] === "" &&
          currentBoard[r - 1][c] === ""
        ) {
          orphanedLetters += 1;
        }
      }
    }
  }

  // check word validity
  wordsFound.forEach((word) => {
    if (si_words[word] !== 1) {
      invalidWords.push(word);
    }
  });

  return {
    wordsFound,
    disconnectedWordCount,
    invalidWords,
    orphanedLetters,
  };
};

// valid-word <space> just-one-letter give a bug
