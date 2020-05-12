import { si_letters } from "./si_letters";
export const scoreCalculator = (currentWords, prevWords) => {
  let cw2 = [...currentWords];
  let pw2 = [...prevWords];
  let score = 0;

  let length = pw2.length;

  for (let x = 0; x < length; x++) {
    let word = pw2[x];
    let cwIndex = cw2.indexOf(word);
    if (cwIndex !== -1) {
      cw2.splice(cwIndex, 1);
    }
  }

  cw2.forEach((word) => {
    for (let i = 0; i < word.length; i++) {
      let letter = word.charAt(i);
      let letterData = si_letters[letter];
      if (letterData) {
        score += letterData[1];
      }
    }
  });

  return { newWords: cw2, score };
};
