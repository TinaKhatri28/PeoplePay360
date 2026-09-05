export interface RuleExecutionContext {
  basic: number;
  grossSoFar: number;
  overtimeHours: number;
  unpaidLeaveDays: number;
  absentDays: number;
  expectedWorkingDays: number;
  standardMonthlyHours: number;
}

export interface EvaluatableRule {
  id?: string;
  name: string;
  category: string; // Basic, Allowance, Deduction
  compute_method: string; // FIXED, PERCENTAGE, FORMULA
  amount?: number | null;
  percentage?: number | null;
  percentage_of?: string | null; // BASIC, GROSS_SO_FAR
  formula_key?: string | null; // OVERTIME, UNPAID_LEAVE_DEDUCTION, ATTENDANCE_BASED
  sequence: number;
}

export class SalaryRuleEvaluator {
  /**
   * Safe, deterministic rule evaluator WITHOUT eval()
   */
  evaluate(rule: EvaluatableRule, context: RuleExecutionContext): number {
    switch (rule.compute_method) {
      case 'FIXED': {
        return Number(rule.amount) || 0;
      }

      case 'PERCENTAGE': {
        const base = rule.percentage_of === 'GROSS_SO_FAR' 
          ? context.grossSoFar 
          : context.basic;
        const rate = (Number(rule.percentage) || 0) / 100;
        return +(base * rate).toFixed(2);
      }

      case 'FORMULA': {
        return this.evaluateSafeFormula(rule.formula_key, context);
      }

      default:
        return 0;
    }
  }

  private evaluateSafeFormula(key: string | null | undefined, ctx: RuleExecutionContext): number {
    switch (key) {
      case 'OVERTIME': {
        const hourlyRate = ctx.basic / (ctx.standardMonthlyHours || 160);
        return +(ctx.overtimeHours * hourlyRate * 1.5).toFixed(2);
      }

      case 'UNPAID_LEAVE_DEDUCTION': {
        const dailyRate = ctx.basic / (ctx.expectedWorkingDays || 30);
        return +(dailyRate * ctx.unpaidLeaveDays).toFixed(2);
      }

      case 'ATTENDANCE_BASED': {
        const totalExpected = ctx.expectedWorkingDays || 26;
        const attendedDays = Math.max(0, totalExpected - ctx.absentDays);
        const ratio = totalExpected > 0 ? attendedDays / totalExpected : 1;
        // Negative adjustment if absent
        return +((ctx.basic * ratio) - ctx.basic).toFixed(2);
      }

      default:
        return 0;
    }
  }
}

export const salaryRuleEvaluator = new SalaryRuleEvaluator();
