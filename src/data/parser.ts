import { Question } from '../types';

export function parseEconQuestions(ocrText: string): Question[] {
  let cleaned = ocrText
    .replace(/==Start of PDF==/g, '')
    .replace(/==End of PDF==/g, '')
    .replace(/==Screenshot for page \d+==/g, '')
    .replace(/==Start of OCR for page \d+==/g, '')
    .replace(/==End of OCR for page \d+==/g, '');

  const qRegex = /第\s*(\d+)\s*題\n([\s\S]+?)答案：\s*([A-D]|a|b|c|d|\([A-D]\)|\([a-d]\))(.*?)\n([\s\S]*?)(?=第\s*\d+\s*題|$)/gi;
  
  const questions: Question[] = [];
  let match;
  while ((match = qRegex.exec(cleaned)) !== null) {
    const qId = parseInt(match[1], 10);
    const content = match[2];
    const rawAnswer = match[3].toUpperCase().replace(/[\(\)]/g, '');
    const answer = rawAnswer;
    const explanation = match[5].replace(/^解說：\s*/, '').trim();

    let text = content;
    let A = '', B = '', C = '', D = '';

    const optsRegex = /(?:\(A\)|A\.|a\.)([\s\S]*?)(?:\(B\)|B\.|b\.)([\s\S]*?)(?:\(C\)|C\.|c\.)([\s\S]*?)(?:\(D\)|D\.|d\.)([\s\S]*?)$/i;
    const optsMatch = optsRegex.exec(content);
    if (optsMatch) {
      text = content.substring(0, optsMatch.index).trim();
      text = text.replace(/^\d+\.\s*/, '').trim(); // Remove leading "1. " if present
      A = optsMatch[1].trim();
      B = optsMatch[2].trim();
      C = optsMatch[3].trim();
      D = optsMatch[4].trim();
      
      questions.push({
        id: qId,
        text: text,
        options: { A, B, C, D },
        answer: answer,
        // @ts-ignore
        explanation: explanation // (optional, but good to parse)
      });
    } else {
       // fallback
       questions.push({
         id: qId,
         text: content.trim(),
         options: { A: 'A', B: 'B', C: 'C', D: 'D' },
         answer: answer
       });
    }
  }
  return questions;
}

export function parseQuestions(ocrText: string): Question[] {
  let cleaned = ocrText
    .replace(/==Start of PDF==/g, '')
    .replace(/==End of PDF==/g, '')
    .replace(/==Screenshot for page \d+==/g, '')
    .replace(/==Start of OCR for page \d+==/g, '')
    .replace(/==End of OCR for page \d+==/g, '')
    .replace(/第[一二三四五六七八九十]+節：.*?（共 \d+ 題）/g, '')
    .replace(/通識教育中心/g, '')
    .replace(/說明[\s\S]*?內容範圍：.*?等。/g, '')
    .replace(/試題/g, '')
    .replace(/Linux 與邊緣運算 \(GS4538\)/g, '')
    .replace(/單選選擇題題庫（128 題）/g, '');

  // Filter standalone lines with numbers (page numbers) or empty lines
  cleaned = cleaned.split('\n').filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 0 && !/^\d+$/.test(trimmed);
  }).join('\n');

  const parts = cleaned.split('解答\n');
  const questionsText = parts[0];
  const answersText = parts[1] || '';

  const answersMap: Record<number, string> = {};
  const answerRegex = /(\d+)\.\s*([A-D])/g;
  let match;
  while ((match = answerRegex.exec(answersText)) !== null) {
    answersMap[parseInt(match[1], 10)] = match[2];
  }

  // Regex to extract questions
  // Matches "number. Question text" until the next "number." or end of string
  const qRegex = /(?:^|\n)(\d+)\.\s+([\s\S]+?)(?=(?:\n\d+\.\s+[\s\S]|$))/g;
  
  const questions: Question[] = [];
  while ((match = qRegex.exec(questionsText)) !== null) {
    const qId = parseInt(match[1], 10);
    let content = match[2];

    const optA = content.indexOf('(A)');
    const optB = content.indexOf('(B)');
    const optC = content.indexOf('(C)');
    const optD = content.indexOf('(D)');

    if (optA !== -1 && optB !== -1 && optC !== -1 && optD !== -1) {
      const text = content.substring(0, optA).trim();
      const A = content.substring(optA + 3, optB).trim();
      const B = content.substring(optB + 3, optC).trim();
      const C = content.substring(optC + 3, optD).trim();
      const D = content.substring(optD + 3).trim();

      questions.push({
        id: qId,
        text: text,
        options: { A, B, C, D },
        answer: answersMap[qId] || 'A'
      });
    }
  }
  return questions;
}
