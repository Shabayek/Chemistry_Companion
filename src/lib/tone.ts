/**
 * Feedback wording. Standard mode is short and neutral; kid mode is warmer and more encouraging.
 * `seed` (e.g. the question index) picks a variant so messages do not repeat every time.
 */
const KID = {
  correct: ['Great job! 🎉', 'You got it! ⭐', 'Brilliant! 🚀', 'Super scientist! 🧪'],
  wrong: ["Nice try! Here's the idea:", "Almost! Let's see why:", 'Good guess! The trick is:'],
  passed: ['You did it! 🎉', 'Amazing work! 🌟', 'Mission accomplished! 🚀'],
  failed: ["So close! Every scientist tries again.", "Keep going, you're learning! 💪"],
};
const STANDARD = {
  correct: ['Correct!'],
  wrong: ['Not quite.'],
  passed: ['Mission Complete!'],
  failed: ['Mission Not Cleared'],
};

export type ToneKey = keyof typeof STANDARD;

export function toneMessage(kind: ToneKey, kid: boolean, seed = 0): string {
  const list = (kid ? KID : STANDARD)[kind];
  return list[Math.abs(seed) % list.length]!;
}
