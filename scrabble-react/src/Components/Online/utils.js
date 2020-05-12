export const convertMapToArray = (mapArray, boardSize) => {
  let boardArray = [];
  for (let x = 0; x < boardSize; x++) {
    boardArray.push(mapArray[x]);
  }
  return boardArray;
};

export const createBoard = (size) => {
  let board = [];
  for (let x = 0; x < size; x++) {
    let row = [];
    for (let y = 0; y < size; y++) {
      row.push("");
    }
    board.push(row);
  }
  return board;
};
