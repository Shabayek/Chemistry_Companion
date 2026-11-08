import { describe, it, expect } from 'vitest';
import {
  createMissionState, recordAnswer, scoreQuiz, missedQuestionIds, correctQuestionIds, isAnswerCorrect, advancePhase, startQuiz,
  completeStep, nextStep, nextQuiz, expireTime, timeRemainingMs, isLastStep, gradedSteps, isStepComplete,
} from '../src/game/engine/missions';
import type { Mission, QuizQuestion } from '../src/types';

const q = (id: string, answer: string, type: QuizQuestion['type'] = 'mcq'): QuizQuestion => ({
  id, prompt: id, type, answer, explanation: '', difficulty: 1, ...(type === 'mcq' ? { options: [answer, 'wrong'] } : {}),
});

const mission: Mission = {
  id: 'test', world: 'beginner', zone: 'Z', title: 'T', concept: 'C', kind: 'core', intro: [],
  steps: [
    { id: 's1', kind: 'practice', title: 't', prompt: 'p', interactive: 'molecule-maker', data: { target: 'H2O' } },
    { id: 's2', kind: 'guided', title: 't', prompt: 'p', interactive: 'periodic-explorer' },
  ],
  quiz: [q('q1', 'A'), q('q2', 'B'), q('q3', 'Sodium chloride', 'fillblank'), q('q4', 'D')],
  rewards: [],
};
const boss: Mission = { ...mission, id: 'boss', kind: 'boss', bossRules: { lives: 2 } };
const mini: Mission = { ...mission, id: 'mini', kind: 'miniboss', bossRules: { timeLimitSec: 60 } };

const inQuiz = (m: Mission = mission) => startQuiz(createMissionState(m, 0), 1000);

describe('isAnswerCorrect', () => {
  it('matches choices exactly', () => {
    expect(isAnswerCorrect(mission.quiz[0]!, 'A')).toBe(true);
    expect(isAnswerCorrect(mission.quiz[0]!, 'a')).toBe(false);
    expect(isAnswerCorrect(mission.quiz[0]!, undefined)).toBe(false);
  });
  it('is lenient on case and whitespace for fill-in-the-blank', () => {
    expect(isAnswerCorrect(mission.quiz[2]!, '  sodium   CHLORIDE ')).toBe(true);
    expect(isAnswerCorrect(mission.quiz[2]!, 'sodium')).toBe(false);
  });
  it('compares ordered lists for array answers', () => {
    const dq: QuizQuestion = { id: 'd', prompt: '', type: 'dragmatch', answer: ['x', 'y'], explanation: '', difficulty: 1 };
    expect(isAnswerCorrect(dq, ['x', 'y'])).toBe(true);
    expect(isAnswerCorrect(dq, ['y', 'x'])).toBe(false);
    expect(isAnswerCorrect(dq, 'x')).toBe(false);
  });
});

describe('phases and practice steps', () => {
  it('goes intro -> practice -> quiz -> result', () => {
    let s = createMissionState(mission, 0);
    expect(s.phase).toBe('intro');
    s = advancePhase(s, 1);
    expect(s.phase).toBe('practice');
    expect(s.stepIndex).toBe(0);
    expect(isLastStep(s)).toBe(false);
    s = nextStep(s, 2);
    expect(s.stepIndex).toBe(1);
    expect(isLastStep(s)).toBe(true);
    s = nextStep(s, 3);
    expect(s.phase).toBe('quiz');
    expect(s.quizStartedAt).toBe(3);
  });

  it('skips practice when a mission has no steps and ends at once with no quiz', () => {
    expect(advancePhase(createMissionState({ ...mission, steps: [] }, 0), 5).phase).toBe('quiz');
    const empty = advancePhase(createMissionState({ ...mission, steps: [], quiz: [] }, 0), 5);
    expect(empty.phase).toBe('result');
    expect(empty.endReason).toBe('completed');
  });

  it('records step results, keeps the best and clamps to 0..1', () => {
    let s = createMissionState(mission, 0);
    s = completeStep(s, 's1', { score: 0.5 });
    s = completeStep(s, 's1', { score: 0.25 });
    expect(s.stepResults.s1).toEqual({ score: 0.5 });
    s = completeStep(s, 's1', { score: 7 });
    expect(s.stepResults.s1).toEqual({ score: 1 });
    expect(completeStep(s, 's2', { score: NaN }).stepResults.s2).toEqual({ score: 0 });
    expect(isStepComplete(s, 's1')).toBe(true);
    expect(isStepComplete(s, 's2')).toBe(false);
    expect(gradedSteps(mission).map((x) => x.id)).toEqual(['s1']);
  });
});

describe('quiz', () => {
  it('tracks streaks, best streak, missed and correct questions', () => {
    let s = inQuiz();
    s = recordAnswer(s, 'q1', 'A');
    s = recordAnswer(s, 'q2', 'B');
    expect(s.streak).toBe(2);
    s = recordAnswer(s, 'q3', 'nope');
    expect(s.streak).toBe(0);
    expect(s.bestStreak).toBe(2);
    s = recordAnswer(s, 'q4', 'D');
    expect(scoreQuiz(s)).toBe(3);
    expect(missedQuestionIds(s)).toEqual(['q3']);
    expect(correctQuestionIds(s)).toEqual(['q1', 'q2', 'q4']);
  });

  it('keeps the first answer and ignores answers outside the quiz phase', () => {
    let s = inQuiz();
    s = recordAnswer(s, 'q1', 'wrong');
    s = recordAnswer(s, 'q1', 'A');
    expect(s.answers.q1).toBe('wrong');
    expect(recordAnswer(createMissionState(mission, 0), 'q1', 'A').answers).toEqual({});
  });

  it('moves to the result after the last question', () => {
    let s = inQuiz();
    for (let i = 0; i < 4; i++) s = nextQuiz(s, 2000 + i);
    expect(s.phase).toBe('result');
    expect(s.endReason).toBe('completed');
    expect(s.endedAt).toBe(2003);
    expect(missedQuestionIds(createMissionState(mission, 0))).toEqual(['q1', 'q2', 'q3', 'q4']);
  });
});

describe('boss lives', () => {
  it('costs a life per wrong answer and ends the attempt at zero', () => {
    let s = inQuiz(boss);
    expect(s.livesLeft).toBe(2);
    s = recordAnswer(s, 'q1', 'A');
    expect(s.livesLeft).toBe(2);
    s = recordAnswer(s, 'q2', 'x');
    expect(s.livesLeft).toBe(1);
    expect(s.endReason).toBeNull();
    s = nextQuiz(nextQuiz(s, 1));
    s = recordAnswer(s, 'q3', 'x');
    expect(s.livesLeft).toBe(0);
    expect(s.endReason).toBe('out-of-lives');
    expect(recordAnswer(s, 'q4', 'D').answers.q4).toBeUndefined();
    s = nextQuiz(s, 5000);
    expect(s.phase).toBe('result');
    expect(s.endReason).toBe('out-of-lives');
  });

  it('missions without a lives rule never lose lives', () => {
    expect(recordAnswer(inQuiz(), 'q1', 'x').livesLeft).toBeNull();
  });
});

describe('mini-boss timer', () => {
  it('counts down from the quiz start and expires', () => {
    const s = inQuiz(mini); // quiz started at t=1000, 60 s limit
    expect(timeRemainingMs(s, 1000)).toBe(60000);
    expect(timeRemainingMs(s, 31000)).toBe(30000);
    expect(expireTime(s, 30000)).toBe(s);
    const ended = expireTime(s, 61000);
    expect(ended.phase).toBe('result');
    expect(ended.endReason).toBe('time-up');
    expect(timeRemainingMs(ended, 99999)).toBe(0);
  });
  it('untimed missions have no timer', () => {
    expect(timeRemainingMs(inQuiz(), 5000)).toBeNull();
    expect(expireTime(inQuiz(), 1e9).phase).toBe('quiz');
  });
});
