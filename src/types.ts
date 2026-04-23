export type GameMode = 'single' | 'mobile-vs' | 'desktop-vs' | 'online-vs';

export interface Question {
  id: number;
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  answer: string;
}

export interface WrongAnswer {
  question: Question;
  chosenId: string;
  player: number;
}
