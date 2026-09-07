const enabled = (): boolean => !process.env.NO_COLOR && process.stdout.isTTY;

const wrap =
  (open: number, close = 39) =>
  (text: string): string =>
    enabled() ? `\u001b[${open}m${text}\u001b[${close}m` : text;

export const cyan = wrap(36);
export const green = wrap(32);
export const yellow = wrap(33);
export const red = wrap(31);
export const magenta = wrap(35);
export const bold = wrap(1, 22);
export const dim = wrap(2, 22);

export function gradeAnsi(grade: string): string {
  if (grade === "S" || grade === "A") return green(grade);
  if (grade === "B") return yellow(grade);
  if (grade === "C") return magenta(grade);
  if (grade === "D" || grade === "F") return red(grade);
  return grade;
}
